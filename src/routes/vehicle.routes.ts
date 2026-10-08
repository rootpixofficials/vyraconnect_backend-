import { Router } from 'express';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle
} from '../controllers/vehicle.controller';

const router = Router();

router.get('/', getVehicles);
router.post('/', createVehicle);
router.post('/customers/:customerId/vehicles', createVehicle); // backwards compatibility
router.patch('/:id', updateVehicle);
router.patch('/:id/status', updateVehicleStatus);
router.delete('/:id', deleteVehicle);

export default router;
