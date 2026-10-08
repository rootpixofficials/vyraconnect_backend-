import { Request, Response } from 'express';
import { QrService } from '../services/qr.service';
import prisma from '../lib/prisma';

export const generateSingleQr = async (req: Request, res: Response) => {
  try {
    const { productType } = req.body;
    if (!productType) {
      return res.status(400).json({ error: 'Product type is required' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://vyraconnect.in/scan';
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
      take: 200 
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

    const adminId = (req as any).user?.id || 'admin'; // Use auth middleware user if available
    const updatedQr = await QrService.assignQr(qrId, customerId, adminId);
    return res.status(200).json({ message: 'QR assigned successfully', qrCode: updatedQr });
  } catch (error: any) {
    console.error('Error assigning QR:', error);
    return res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const activateQr = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'QR ID is required' });

    const adminId = (req as any).user?.id || 'admin';
    const activatedQr = await QrService.activateQr(id, adminId);
    return res.status(200).json({ message: 'QR activated successfully', qrCode: activatedQr });
  } catch (error: any) {
    console.error('Error activating QR:', error);
    return res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const blockQr = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!id || !reason) {
      return res.status(400).json({ error: 'QR ID and reason are required' });
    }

    const adminId = (req as any).user?.id || 'admin';
    const blockedQr = await QrService.blockQr(id, reason, adminId);
    return res.status(200).json({ message: 'QR blocked successfully', qrCode: blockedQr });
  } catch (error: any) {
    console.error('Error blocking QR:', error);
    return res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const unblockQr = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'QR ID is required' });

    const adminId = (req as any).user?.id || 'admin';
    const unblockedQr = await QrService.unblockQr(id, adminId);
    return res.status(200).json({ message: 'QR unblocked successfully', qrCode: unblockedQr });
  } catch (error: any) {
    console.error('Error unblocking QR:', error);
    return res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const replaceQr = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!id || !reason) {
      return res.status(400).json({ error: 'QR ID and reason are required' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://vyraconnect.in/scan';
    const adminId = (req as any).user?.id || 'admin';
    const newQr = await QrService.replaceQr(id, reason, adminId, baseUrl);
    return res.status(200).json({ message: 'QR replaced successfully', qrCode: newQr });
  } catch (error: any) {
    console.error('Error replacing QR:', error);
    return res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const getQrAuditLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'QR ID is required' });

    const logs = await prisma.qrAuditLog.findMany({
      where: { qr_id: id },
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ logs });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getQrScanLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'QR ID is required' });

    const scans = await prisma.qrScanLog.findMany({
      where: { qr_id: id },
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ scans });
  } catch (error: any) {
    console.error('Error fetching scan logs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
