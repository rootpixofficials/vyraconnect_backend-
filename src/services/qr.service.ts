import crypto from 'crypto';
import QRCode from 'qrcode';
import prisma from '../lib/prisma';

export class QrService {
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async generateQrImageBase64(url: string): Promise<string> {
    return QRCode.toDataURL(url);
  }

  static async getNextSerialNumber(productType: string): Promise<number> {
    const lastQr = await prisma.qrCode.findFirst({
      where: { product_type: productType },
      orderBy: { qr_serial: 'desc' },
    });
    
    let nextNum = 1;
    if (lastQr) {
      const parts = lastQr.qr_serial.split('-');
      if (parts.length === 2 && parts[1]) {
        const numPart = parseInt(parts[1], 10);
        if (!isNaN(numPart)) {
          nextNum = numPart + 1;
        }
      }
    }
    return nextNum;
  }

  static async createAuditLog(tx: any, qrId: string, action: string, performedBy?: string, customerId?: string, reason?: string, oldStatus?: string, newStatus?: string, metadata?: any) {
    await tx.qrAuditLog.create({
      data: {
        qr_id: qrId,
        customer_id: customerId || null,
        action,
        performed_by: performedBy || null,
        reason: reason || null,
        old_status: oldStatus || null,
        new_status: newStatus || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    });
  }

  static async generateSingleQr(productType: string, baseUrl: string, adminId?: string) {
    const prefix = productType.toString();
    const nextNum = await this.getNextSerialNumber(productType);
    const qr_serial = \`\${prefix}-\${nextNum.toString().padStart(6, '0')}\`;
    const qr_token = this.generateToken();
    const qr_url = \`\${baseUrl}?token=\${qr_token}\`;
    const qr_image_base64 = await QRCode.toDataURL(qr_url, { margin: 1 });

    const qrCode = await prisma.$transaction(async (tx) => {
      const qr = await tx.qrCode.create({
        data: {
          qr_serial,
          qr_token,
          qr_url,
          qr_image_base64,
          product_type: productType,
          created_by: adminId || null,
          status: "AVAILABLE"
        }
      });
      await this.createAuditLog(tx, qr.id, "GENERATED", adminId, undefined, "Generated single QR", null, "AVAILABLE");
      return qr;
    });
    return qrCode;
  }

  static async generateBulkQr(batchId: string, productType: string, quantity: number, baseUrl: string, adminId?: string) {
    const prefix = productType.toString();
    const startNum = await this.getNextSerialNumber(productType);
    
    const qrCodesData = [];
    const auditLogsData = [];
    
    for (let i = 0; i < quantity; i++) {
      const qr_serial = \`\${prefix}-\${(startNum + i).toString().padStart(6, '0')}\`;
      const qr_token = this.generateToken();
      const qr_url = \`\${baseUrl}?token=\${qr_token}\`;
      const qr_image_base64 = await QRCode.toDataURL(qr_url, { margin: 1 });
      
      qrCodesData.push({
        qr_serial,
        qr_token,
        qr_url,
        qr_image_base64,
        product_type: productType,
        batch_id: batchId,
        created_by: adminId || null,
        status: "AVAILABLE"
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.qrCode.createMany({ data: qrCodesData });
      
      const createdQrs = await tx.qrCode.findMany({ where: { batch_id: batchId } });
      for (const qr of createdQrs) {
        auditLogsData.push({
          qr_id: qr.id,
          action: "GENERATED",
          performed_by: adminId || null,
          reason: "Bulk generated",
          new_status: "AVAILABLE"
        });
      }
      if (auditLogsData.length > 0) {
        await tx.qrAuditLog.createMany({ data: auditLogsData });
      }
    });

    return prisma.qrCode.findMany({ where: { batch_id: batchId } });
  }

  static async assignQr(qrId: string, customerId: string, adminId?: string) {
    return prisma.$transaction(async (tx) => {
      const qr = await tx.qrCode.findUnique({ where: { id: qrId } });
      if (!qr) throw new Error("QR Code not found");
      if (qr.status !== "AVAILABLE") throw new Error(\`Cannot assign QR with status \${qr.status}\`);
      
      const customer = await tx.customer.findUnique({ where: { id: customerId } });
      if (!customer) throw new Error("Customer not found");

      const updatedQr = await tx.qrCode.update({
        where: { id: qrId },
        data: { 
          customer_id: customerId,
          status: "ASSIGNED",
          assigned_at: new Date(),
          assigned_by: adminId || null
        }
      });

      await this.createAuditLog(tx, qr.id, "ASSIGNED", adminId, customerId, "Assigned to customer", qr.status, "ASSIGNED");
      return updatedQr;
    });
  }

  static async activateQr(qrId: string, adminId?: string) {
    return prisma.$transaction(async (tx) => {
      const qr = await tx.qrCode.findUnique({ where: { id: qrId } });
      if (!qr) throw new Error("QR Code not found");
      if (qr.status !== "ASSIGNED") throw new Error(\`Cannot activate QR with status \${qr.status}\`);
      if (!qr.customer_id) throw new Error("QR is not assigned to a customer");

      const now = new Date();
      // Calculate 10 year expiry server-side
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 10);

      const updatedQr = await tx.qrCode.update({
        where: { id: qrId },
        data: {
          status: "ACTIVE",
          activated_at: now,
          activated_by: adminId || null,
          expires_at: expiresAt
        }
      });

      await this.createAuditLog(tx, qr.id, "ACTIVATED", adminId, qr.customer_id, "Activated QR code", qr.status, "ACTIVE", { expires_at: expiresAt });
      return updatedQr;
    });
  }

  static async blockQr(qrId: string, reason: string, adminId?: string) {
    return prisma.$transaction(async (tx) => {
      const qr = await tx.qrCode.findUnique({ where: { id: qrId } });
      if (!qr) throw new Error("QR Code not found");
      if (qr.status === "BLOCKED" || qr.status === "REPLACED") throw new Error(\`Cannot block QR with status \${qr.status}\`);

      const updatedQr = await tx.qrCode.update({
        where: { id: qrId },
        data: {
          status: "BLOCKED",
          blocked_at: new Date(),
          blocked_by: adminId || null,
          blocked_reason: reason
        }
      });

      await this.createAuditLog(tx, qr.id, "BLOCKED", adminId, qr.customer_id || undefined, reason, qr.status, "BLOCKED");
      return updatedQr;
    });
  }

  static async unblockQr(qrId: string, adminId?: string) {
    return prisma.$transaction(async (tx) => {
      const qr = await tx.qrCode.findUnique({ where: { id: qrId } });
      if (!qr) throw new Error("QR Code not found");
      if (qr.status !== "BLOCKED") throw new Error(\`Cannot unblock QR with status \${qr.status}\`);

      // Determine correct restoration state based on timestamps
      let restoreStatus = "AVAILABLE";
      if (qr.activated_at) restoreStatus = "ACTIVE";
      else if (qr.assigned_at) restoreStatus = "ASSIGNED";

      // Verify it has not expired if it's being restored to ACTIVE
      if (restoreStatus === "ACTIVE" && qr.expires_at && new Date() > qr.expires_at) {
        restoreStatus = "EXPIRED";
      }

      const updatedQr = await tx.qrCode.update({
        where: { id: qrId },
        data: {
          status: restoreStatus,
          unblocked_at: new Date(),
          unblocked_by: adminId || null,
          blocked_reason: null
        }
      });

      await this.createAuditLog(tx, qr.id, "UNBLOCKED", adminId, qr.customer_id || undefined, "Unblocked QR", qr.status, restoreStatus);
      return updatedQr;
    });
  }

  static async replaceQr(oldQrId: string, reason: string, adminId: string, baseUrl: string) {
    return prisma.$transaction(async (tx) => {
      const oldQr = await tx.qrCode.findUnique({ where: { id: oldQrId } });
      if (!oldQr) throw new Error("Old QR Code not found");
      if (oldQr.status === "REPLACED") throw new Error("QR Code is already replaced");
      if (!oldQr.customer_id) throw new Error("Cannot replace an unassigned QR Code");

      // Generate new QR Code parameters
      const productType = oldQr.product_type;
      const nextNum = await this.getNextSerialNumber(productType);
      const prefix = productType.toString();
      const qr_serial = \`\${prefix}-\${nextNum.toString().padStart(6, '0')}\`;
      const qr_token = this.generateToken();
      const qr_url = \`\${baseUrl}?token=\${qr_token}\`;
      const qr_image_base64 = await QRCode.toDataURL(qr_url, { margin: 1 });

      // Create new QR Code inheriting customer and state
      const newQr = await tx.qrCode.create({
        data: {
          qr_serial,
          qr_token,
          qr_url,
          qr_image_base64,
          product_type,
          customer_id: oldQr.customer_id,
          status: oldQr.status === "EXPIRED" ? "ACTIVE" : oldQr.status, // Revive if expired
          assigned_at: oldQr.assigned_at,
          assigned_by: oldQr.assigned_by,
          activated_at: oldQr.activated_at,
          activated_by: oldQr.activated_by,
          expires_at: oldQr.expires_at, // Inherit expiry date or set new one? Typically inherit or extend. We inherit here.
          created_by: adminId,
        }
      });

      // Update old QR Code
      const updatedOldQr = await tx.qrCode.update({
        where: { id: oldQr.id },
        data: {
          status: "REPLACED",
          replacement_qr_id: newQr.id,
          replaced_by: adminId,
          replaced_at: new Date(),
          replacement_reason: reason
        }
      });

      // Update new QR to point to old QR
      await tx.qrCode.update({
        where: { id: newQr.id },
        data: {
          replaced_qr_id: updatedOldQr.id
        }
      });

      await this.createAuditLog(tx, oldQr.id, "REPLACED", adminId, oldQr.customer_id, reason, oldQr.status, "REPLACED", { replacement_qr_id: newQr.id });
      await this.createAuditLog(tx, newQr.id, "GENERATED_AS_REPLACEMENT", adminId, oldQr.customer_id, \`Replaced \${oldQr.qr_serial}\`, null, newQr.status, { replaced_qr_id: oldQr.id });
      
      return newQr;
    });
  }
}
