import { Router } from 'express';
import {
  generateAuthUrl,
  handleGoogleCallback,
  disconnectGmail,
} from '../controllers/auth.controller';

const router = Router();

router.get('/google', generateAuthUrl);
router.get('/google/callback', handleGoogleCallback);
router.post('/google/disconnect', disconnectGmail);

export default router;
