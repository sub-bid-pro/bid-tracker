import { Router } from 'express';
import { syncUserBids } from '../services/gmail.service';

const router = Router();

router.post('/sync', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Await the sync process
    await syncUserBids(userId);
    res.status(200).json({ message: 'Sync complete' });
  } catch (error: any) {
    console.error('Sync route error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to sync bids' });
  }
});

export default router;
