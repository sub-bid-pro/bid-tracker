import type { Request, Response } from 'express';
import { oauth2Client, syncUserBids } from '../services/gmail.service';
import { supabaseAdmin } from '../lib/supabase';

export const generateAuthUrl = (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent select_account',
    state: userId,
  });

  res.redirect(url);
};

export const handleGoogleCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const userId = state as string;

  try {
    const { tokens } = await oauth2Client.getToken(code as string);

    // 1. Save tokens securely to Supabase
    await supabaseAdmin.from('google_tokens').upsert({
      id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    // 2. Flag the user's profile as connected
    await supabaseAdmin
      .from('profiles')
      .update({
        gmail_connected: true,
      })
      .eq('id', userId);

    syncUserBids(userId);

    // Dynamic Frontend URL
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${FRONTEND_URL}/settings?status=success`);
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.redirect('http://localhost:5173/settings?error=oauth_failed');
  }
};

// Disconnect gmail account
export const disconnectGmail = async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // 1. Delete the tokens
    await supabaseAdmin.from('google_tokens').delete().eq('id', userId);

    // 2. Set the connected flag to false
    await supabaseAdmin.from('profiles').update({ gmail_connected: false }).eq('id', userId);

    res.status(200).json({ message: 'Disconnected successfully' });
  } catch (error) {
    console.error('Disconnect Error:', error);
    res.status(500).json({ error: 'Failed to disconnect Gmail' });
  }
};
