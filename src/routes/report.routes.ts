import { Router } from 'express';
import { getReportDashboard } from '../controllers/report.controller';

const router = Router();

router.get('/dashboard', getReportDashboard);

export default router;
