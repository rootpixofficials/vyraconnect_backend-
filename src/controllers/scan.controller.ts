import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { QrService } from '../services/qr.service';

export const getScanDetails = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const qr = await prisma.qrCode.findUnique({
      where: { qr_token: token },
      include: {
        customer: {
          include: {
            vehicles: true,
            emergency_contacts: true
          }
        }
      }
    });

    if (!qr) return res.status(404).json({ error: 'Invalid QR Code' });

    // Track Scan Request Info
    const ua = req.headers['user-agent'] || '';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    
    // Validate Expiry dynamically
    let currentStatus = qr.status;
    if (currentStatus === 'ACTIVE' && qr.expires_at && new Date() > qr.expires_at) {
      currentStatus = 'EXPIRED';
      // Auto-update DB if expired
      await prisma.qrCode.update({ where: { id: qr.id }, data: { status: 'EXPIRED' } });
    }

    let scanResult = 'SUCCESS';
    if (currentStatus === 'BLOCKED') scanResult = 'BLOCKED_REJECT';
    else if (currentStatus === 'REPLACED') scanResult = 'REPLACED_REJECT';
    else if (currentStatus === 'EXPIRED') scanResult = 'EXPIRED_REJECT';

    // Log the scan asynchronously
    prisma.qrScanLog.create({
      data: {
        qr_id: qr.id,
        scan_result: scanResult,
        resulting_status: currentStatus,
        device_type: ua.includes('Mobile') ? 'Mobile' : 'Desktop',
        browser: ua, // Simple for now, could parse full UA
        ip_address: String(ip),
      }
    }).catch(err => console.error('Failed to log scan:', err));

    // Handle Rejected States
    if (currentStatus === 'BLOCKED') {
      return res.status(403).json({ error: 'This QR code has been blocked.', status: currentStatus, qr: { status: currentStatus } });
    }
    if (currentStatus === 'REPLACED') {
      return res.status(403).json({ error: 'This QR code has been replaced with a newer version.', status: currentStatus, qr: { status: currentStatus } });
    }
    if (currentStatus === 'EXPIRED') {
      return res.status(403).json({ error: 'This QR code has expired.', status: currentStatus, qr: { status: currentStatus } });
    }

    return res.status(200).json({ qr: { ...qr, status: currentStatus } });
  } catch (error) {
    console.error('Scan detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const registerQr = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { 
      fullName, name, mobile, email, address, city, state, pincode, 
      vehicleType, registrationNumber, make, model, color,
      emergencyName, emergencyRelationship, emergencyMobile
    } = req.body;

    const qr = await prisma.qrCode.findUnique({ where: { qr_token: token } });
    if (!qr) return res.status(404).json({ error: 'Invalid QR Code' });
    
    // Status check
    if (qr.status === 'ACTIVE' || qr.status === 'ACTIVATED') {
      return res.status(400).json({ error: 'QR Code is already registered and active' });
    }
    if (qr.status === 'BLOCKED' || qr.status === 'REPLACED' || qr.status === 'EXPIRED') {
      return res.status(400).json({ error: `Cannot register QR code. Status is ${qr.status}` });
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Create or Find Customer by Mobile
      let customer = await tx.customer.findUnique({ where: { mobile } });
      if (!customer) {
        const customer_code = `CUST-${Math.floor(100000 + Math.random() * 900000)}`;
        customer = await tx.customer.create({
          data: {
            customer_code,
            full_name: fullName || name || 'Unknown',
            mobile,
            email,
            address,
            city,
            state,
            pincode
          }
        });
      }

      // 2. Find or Create Vehicle
      let vehicle = await tx.vehicle.findUnique({ where: { registration_number: registrationNumber } });
      if (!vehicle) {
        vehicle = await tx.vehicle.create({
          data: {
            customer_id: customer.id,
            vehicle_type: vehicleType || 'Four Wheeler',
            registration_number: registrationNumber,
            make,
            model,
            color
          }
        });
      }

      // 3. Create Emergency Contact if provided
      if (emergencyName && emergencyMobile) {
        await tx.emergencyContact.create({
          data: {
            customer_id: customer.id,
            name: emergencyName,
            relationship: emergencyRelationship || 'Relative',
            mobile: emergencyMobile,
            is_primary: true
          }
        });
      }

      // 4. Update QR Code & Create Audit
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 10);

      const updatedQr = await tx.qrCode.update({
        where: { id: qr.id },
        data: {
          customer_id: customer.id,
          status: 'ACTIVE',
          activated_at: now,
          expires_at: expiresAt
        }
      });

      await tx.qrAuditLog.create({
        data: {
          qr_id: qr.id,
          customer_id: customer.id,
          action: "ACTIVATED",
          reason: "Customer self-registration",
          old_status: qr.status,
          new_status: "ACTIVE",
          metadata: JSON.stringify({ expires_at: expiresAt })
        }
      });

      return res.status(200).json({ message: 'Registration successful', qr: updatedQr });
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
