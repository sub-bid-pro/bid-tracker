import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createBillingSession,
  createPortalSession,
  syncBilling,
  getAccess,
} from '../controllers/billing.controller';

const router = Router();

// All require a verified Supabase JWT (Authorization: Bearer <token>).
router.post('/session', authenticate, createBillingSession);
router.post('/portal', authenticate, createPortalSession);
router.post('/sync', authenticate, syncBilling);
router.get('/access', authenticate, getAccess);

export default router;
