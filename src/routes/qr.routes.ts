import { Router } from 'express';
import { 
  generateSingleQr, 
  getQrList, 
  assignQr, 
  activateQr,
  blockQr, 
  unblockQr,
  replaceQr,
  getQrAuditLogs,
  getQrScanLogs
} from '../controllers/qr.controller';

const router = Router();

router.post('/generate', generateSingleQr);
router.get('/list', getQrList);
router.post('/assign', assignQr);

router.post('/:id/activate', activateQr);
router.post('/:id/block', blockQr);
router.post('/:id/unblock', unblockQr);
router.post('/:id/replace', replaceQr);

router.get('/:id/audit', getQrAuditLogs);
router.get('/:id/scans', getQrScanLogs);

export default router;
