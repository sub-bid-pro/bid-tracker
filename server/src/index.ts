import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import bidRoutes from './routes/bid.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/bids', bidRoutes);

app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
