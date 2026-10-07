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
      orderBy: { generated_at: 'desc' },
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

  static async generateSingleQr(productType: string, baseUrl: string, adminId?: string) {
    const prefix = productType.toString();
    const nextNum = await this.getNextSerialNumber(productType);
    const qr_serial = `${prefix}-${nextNum.toString().padStart(6, '0')}`;
    const qr_token = this.generateToken();
    const qr_url = `${baseUrl}?token=${qr_token}`;

    const qrCode = await prisma.qrCode.create({
      data: {
        qr_serial,
        qr_token,
        qr_url,
        product_type: productType,
        created_by: adminId || null,
        status: "AVAILABLE"
      }
    });
    return qrCode;
  }

  static async generateBulkQr(batchId: string, productType: string, quantity: number, baseUrl: string, adminId?: string) {
    const prefix = productType.toString();
    const startNum = await this.getNextSerialNumber(productType);
    
    const qrCodes = [];
    for (let i = 0; i < quantity; i++) {
      const qr_serial = `${prefix}-${(startNum + i).toString().padStart(6, '0')}`;
      const qr_token = this.generateToken();
      const qr_url = `${baseUrl}?token=${qr_token}`;
      
      qrCodes.push({
        qr_serial,
        qr_token,
        qr_url,
        product_type: productType,
        batch_id: batchId,
        created_by: adminId || null,
        status: "AVAILABLE"
      });
    }

    await prisma.qrCode.createMany({
      data: qrCodes
    });

    return prisma.qrCode.findMany({ where: { batch_id: batchId } });
  }

  static async assignQr(qrId: string, customerId: string) {
    return prisma.qrCode.update({
      where: { id: qrId },
      data: { 
        customer_id: customerId,
        status: "ASSIGNED",
        assigned_at: new Date()
      }
    });
  }

  static async blockQr(qrId: string, reason: string) {
    return prisma.qrCode.update({
      where: { id: qrId },
      data: {
        status: "BLOCKED",
        blocked_at: new Date(),
        blocked_reason: reason
      }
    });
  }
}
