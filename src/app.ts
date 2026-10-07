import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import customerRoutes from './routes/customer.routes';
import vehicleRoutes from './routes/vehicle.routes';
import emergencyRoutes from './routes/emergency.routes';
import qrRoutes from './routes/qr.routes';
import batchRoutes from './routes/batch.routes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Vyra Connect API is running',
    version: '1.0.0'
  });
});

app.use('/api/admin/customers', customerRoutes);
app.use('/api/admin/vehicles', vehicleRoutes);
app.use('/api/admin/emergency', emergencyRoutes);
app.use('/api/admin/qr', qrRoutes);
app.use('/api/admin/qr-batches', batchRoutes);

// Dashboard Stats Route
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const totalCustomers = await prisma.customer.count();
    const totalQRs = await prisma.qrCode.count();
    const activeQRs = await prisma.qrCode.count({ where: { status: 'ACTIVE' } });
    const totalVehicles = await prisma.vehicle.count();
    
    // Fetch recent QR assignments
    const recentAssignments = await prisma.qrCode.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { activated_at: 'desc' },
      take: 4,
      include: { customer: true }
    });

    res.json({ 
      totalCustomers,
      totalQRs,
      activeQRs,
      totalVehicles,
      recentAssignments: recentAssignments.map(qr => ({
        id: qr.id,
        serial: qr.qr_serial,
        customerName: qr.customer?.full_name || 'Unknown',
        status: qr.status
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Database connection error' });
  }
});

// Admin Login Route
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    
    if (user) {
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (isMatch) {
        return res.status(200).json({ success: true, token: 'mock_jwt_token', user });
      }
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
});
