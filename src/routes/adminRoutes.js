import express from 'express';
import { getAdminDashboard, loginAdmin } from '../controllers/adminController.js';

const router = express.Router();

// Admin login route
router.post('/login', loginAdmin);

// Admin dashboard route
router.get('/dashboard', getAdminDashboard);

// Export as default for ES Modules
export default router;
