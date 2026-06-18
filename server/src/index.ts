import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import bidRoutes from './routes/bid.routes';
import billingRoutes from './routes/billing.routes';
import { handleStripeWebhook } from './controllers/stripe.webhook';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());

// IMPORTANT: the Stripe webhook needs the RAW request body for signature
// verification, so it is registered BEFORE express.json() with express.raw().
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook,
);

// Every other route uses normal JSON parsing.
app.use(express.json());

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/billing', billingRoutes);

app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
