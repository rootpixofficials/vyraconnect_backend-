import { Router } from 'express';
import { getScanDetails, registerQr } from '../controllers/scan.controller';

const router = Router();

router.get('/:token', getScanDetails);
router.post('/:token/register', registerQr);

export default router;
