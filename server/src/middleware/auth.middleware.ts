import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import type { BillingProfile } from '../billing/types';

// Typed access to what `authenticate` attaches to the request.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUserId?: string;
      authEmail?: string;
      profile?: BillingProfile;
    }
  }
}

const PROFILE_COLUMNS =
  'id, role, access_state, trial_ends_at, stripe_customer_id, stripe_subscription_id, ' +
  'successful_payment_count, grace_started_at, grace_ends_at';

/**
 * Verifies the Supabase JWT from `Authorization: Bearer <token>`, loads the
 * caller's billing profile, and attaches both to the request. 401 on failure.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    req.authUserId = user.id;
    req.authEmail = user.email ?? undefined;
    req.profile = profile as unknown as BillingProfile;

    next();
  } catch (err) {
    console.error('[authenticate] Unexpected error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
