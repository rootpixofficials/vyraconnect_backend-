import { Router } from 'express';
import {
  addEmergencyContact,
  removeEmergencyContact
} from '../controllers/emergency.controller';

const router = Router();

router.post('/customers/:customerId/contacts', addEmergencyContact);
router.delete('/:id', removeEmergencyContact);

export default router;
