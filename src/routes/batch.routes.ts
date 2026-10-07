import { Router } from 'express';
import { generateBulkQr, getBatchList, getBatchDetails } from '../controllers/batch.controller';

const router = Router();

router.post('/generate', generateBulkQr);
router.post('/bulk-generate', generateBulkQr); // As requested
router.get('/list', getBatchList);
router.get('/:id', getBatchDetails);

export default router;
