import { Request, Response } from 'express';
import prisma from '../lib/prisma';

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

    return res.status(200).json({ qr });
  } catch (error) {
    console.error('Scan detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const registerQr = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { 
      fullName, name, mobile, email, address, city, state, pincode, // Customer details
      vehicleType, registrationNumber, make, model, color, // Vehicle details
      emergencyName, emergencyRelationship, emergencyMobile // Emergency contact
    } = req.body;

    const qr = await prisma.qrCode.findUnique({ where: { qr_token: token } });
    if (!qr) return res.status(404).json({ error: 'Invalid QR Code' });
    if (qr.status === 'ACTIVATED') return res.status(400).json({ error: 'QR Code is already registered and activated' });

    // 1. Create or Find Customer by Mobile
    let customer = await prisma.customer.findUnique({ where: { mobile } });
    if (!customer) {
      const customer_code = `CUST-${Math.floor(100000 + Math.random() * 900000)}`;
      customer = await prisma.customer.create({
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
    let vehicle = await prisma.vehicle.findUnique({ where: { registration_number: registrationNumber } });
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
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
      await prisma.emergencyContact.create({
        data: {
          customer_id: customer.id,
          name: emergencyName,
          relationship: emergencyRelationship || 'Relative',
          mobile: emergencyMobile,
          is_primary: true
        }
      });
    }

    // 4. Update QR Code
    const updatedQr = await prisma.qrCode.update({
      where: { id: qr.id },
      data: {
        customer_id: customer.id,
        status: 'ACTIVATED',
        activated_at: new Date()
      }
    });

    return res.status(200).json({ message: 'Registration successful', qr: updatedQr });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
