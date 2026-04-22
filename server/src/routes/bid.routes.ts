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
  } catch (error) {
    console.error('Sync route error:', error);
    res.status(500).json({ error: 'Failed to sync bids' });
  }
});

export default router;
