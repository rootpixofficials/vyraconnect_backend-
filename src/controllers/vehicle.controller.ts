import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const data = { ...req.body, customer_id: customerId };
    const vehicle = await prisma.vehicle.create({ data });
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create vehicle' });
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
