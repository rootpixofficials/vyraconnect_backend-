import { Request, Response } from 'express';
import { QrService } from '../services/qr.service';
import prisma from '../lib/prisma';

export const generateSingleQr = async (req: Request, res: Response) => {
  try {
    const { productType } = req.body;
    if (!productType) {
      return res.status(400).json({ error: 'Product type is required' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000/scan';
    const adminId = (req as any).user?.id;

    const qrCode = await QrService.generateSingleQr(String(productType), baseUrl, adminId);
    return res.status(201).json({ message: 'QR generated successfully', qrCode });
  } catch (error: any) {
    console.error('Error generating single QR:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getQrList = async (req: Request, res: Response) => {
  try {
    const qrs = await prisma.qrCode.findMany({
      orderBy: { generated_at: 'desc' },
      take: 100 // pagination could be implemented here
    });
    return res.status(200).json({ qrs });
  } catch (error: any) {
    console.error('Error fetching QRs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const assignQr = async (req: Request, res: Response) => {
  try {
    const { qrId, customerId } = req.body;
    if (!qrId || !customerId) {
      return res.status(400).json({ error: 'QR ID and Customer ID are required' });
    }

    const updatedQr = await QrService.assignQr(qrId, customerId);
    return res.status(200).json({ message: 'QR assigned successfully', qrCode: updatedQr });
  } catch (error: any) {
    console.error('Error assigning QR:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const blockQr = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!id || !reason) {
      return res.status(400).json({ error: 'QR ID and reason are required' });
    }

    const blockedQr = await QrService.blockQr(id, reason);
    return res.status(200).json({ message: 'QR blocked successfully', qrCode: blockedQr });
  } catch (error: any) {
    console.error('Error blocking QR:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
