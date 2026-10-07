import { Router } from 'express';
import { generateSingleQr, getQrList, assignQr, blockQr } from '../controllers/qr.controller';

const router = Router();

router.post('/generate', generateSingleQr);
router.get('/list', getQrList);
router.post('/assign', assignQr);
router.post('/:id/block', blockQr);

export default router;
