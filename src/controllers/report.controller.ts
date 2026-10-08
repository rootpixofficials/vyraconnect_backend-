import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getReportDashboard = async (req: Request, res: Response) => {
  try {
    const totalQRs = await prisma.qrCode.count();
    
    // Group by status
    const statusCountsRaw = await prisma.qrCode.groupBy({
      by: ['status'],
      _count: true
    });
    
    const statusCounts = statusCountsRaw.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    const available = statusCounts['AVAILABLE'] || 0;
    const assigned = statusCounts['ASSIGNED'] || 0;
    const active = statusCounts['ACTIVE'] || 0;
    const blocked = statusCounts['BLOCKED'] || 0;
    const expired = statusCounts['EXPIRED'] || 0;
    const replaced = statusCounts['REPLACED'] || 0;

    const totalSold = assigned + active + blocked + expired + replaced;

    const totalCustomers = await prisma.customer.count();
    const activeCustomers = await prisma.customer.count({ where: { status: 'ACTIVE' } });
    const inactiveCustomers = totalCustomers - activeCustomers;

    const totalVehicles = await prisma.vehicle.count();

    // Most sold batch (where customer is assigned)
    const batchStats = await prisma.qrCode.groupBy({
      by: ['batch_id'],
      where: { customer_id: { not: null }, batch_id: { not: null } },
      _count: true,
      orderBy: {
        _count: 'desc'
      },
      take: 1
    });

    let topBatch = null;
    if (batchStats.length > 0 && batchStats[0].batch_id) {
      const batchData = await prisma.qrBatch.findUnique({ where: { id: batchStats[0].batch_id } });
      if (batchData) {
        topBatch = {
          batch_code: batchData.batch_code,
          sold_count: batchStats[0]._count
        };
      }
    }

    res.json({
      metrics: {
        totalQRs,
        totalSold,
        available,
        assignedPending: assigned,
        active,
        blocked,
        expired,
        replaced,
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        totalVehicles
      },
      topBatch
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};
