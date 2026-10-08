import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ orderBy: { created_at: 'desc' } });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    // Allows customerId from params (old style) or body
    const customerId = req.params.customerId || req.body.customer_id;
    const data = { ...req.body, customer_id: customerId };
    if (!data.customer_id) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    const vehicle = await prisma.vehicle.create({ data });
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: req.body
    });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

export const updateVehicleStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { status }
    });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vehicle status' });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.vehicle.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vehicle (may have dependent records)' });
  }
};
