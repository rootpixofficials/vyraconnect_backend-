import { Router } from 'express';
import {
  getVehicles,
  createVehicle,
  updateVehicleStatus
} from '../controllers/vehicle.controller';

const router = Router();

router.get('/', getVehicles);
router.post('/customers/:customerId/vehicles', createVehicle);
router.patch('/:id/status', updateVehicleStatus);

export default router;
