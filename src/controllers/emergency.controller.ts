import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const addEmergencyContact = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const data = { ...req.body, customer_id: customerId };
    const contact = await prisma.emergencyContact.create({ data });
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add emergency contact' });
  }
};

export const removeEmergencyContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.emergencyContact.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove emergency contact' });
  }
};
