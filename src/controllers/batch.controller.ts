import { Request, Response } from 'express';
import { ProductType, BatchStatus } from '@prisma/client';
import { QrService } from '../services/qr.service';
import { PdfService } from '../services/pdf.service';
import prisma from '../lib/prisma';
import crypto from 'crypto';

export const generateBulkQr = async (req: Request, res: Response) => {
  try {
    const { productType, quantity } = req.body;
    if (!productType || !quantity) {
      return res.status(400).json({ error: 'Product type and quantity are required' });
    }

    const adminId = (req as any).user?.id;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000/scan';
    const batchCode = `BATCH-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create batch record
    const batch = await prisma.qrBatch.create({
      data: {
        batch_code: batchCode,
        product_type: productType as ProductType,
        quantity,
        status: BatchStatus.GENERATING,
        created_by: adminId || null,
      }
    });

    // Generate QRs
    const qrCodes = await QrService.generateBulkQr(batch.id, productType as ProductType, quantity, baseUrl, adminId);

    // Update batch status and count
    await prisma.qrBatch.update({
      where: { id: batch.id },
      data: {
        generated_count: qrCodes.length,
      }
    });

    // Generate PDF asynchronously (or synchronously depending on the requirement, but usually async for large batches)
    // We await it here so we can return the pdf_path immediately
    const pdfPath = await PdfService.generateBatchPdf(batch.id, qrCodes, batchCode);

    // Update batch with PDF and complete status
    const completedBatch = await prisma.qrBatch.update({
      where: { id: batch.id },
      data: {
        status: BatchStatus.COMPLETED,
        pdf_path: pdfPath
      }
    });

    return res.status(201).json({ message: 'Bulk QR generated successfully', batch: completedBatch });
  } catch (error: any) {
    console.error('Error generating bulk QR:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBatchList = async (req: Request, res: Response) => {
  try {
    const batches = await prisma.qrBatch.findMany({
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ batches });
  } catch (error: any) {
    console.error('Error fetching batches:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBatchDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const batch = await prisma.qrBatch.findUnique({
      where: { id },
      include: { qr_codes: true }
    });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    return res.status(200).json({ batch });
  } catch (error: any) {
    console.error('Error fetching batch details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
