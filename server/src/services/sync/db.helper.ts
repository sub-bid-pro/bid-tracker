import { supabaseAdmin } from '../../lib/supabase';

export const getUserTokensAndProfile = async (userId: string) => {
  const [tokenResponse, profileResponse] = await Promise.all([
    supabaseAdmin.from('google_tokens').select('*').eq('id', userId).single(),
    supabaseAdmin
      .from('profiles')
      .select('storage_preference, drive_root_folder_name')
      .eq('id', userId)
      .single(),
  ]);

  return {
    tokenData: tokenResponse.data,
    profileData: profileResponse.data,
  };
};

export const checkProcessedEmail = async (emailId: string) => {
  const { data } = await supabaseAdmin
    .from('processed_emails')
    .select('id')
    .eq('email_id', emailId)
    .single();
  return data;
};

export const findExistingBidByThread = async (userId: string, threadId: string) => {
  const { data } = await supabaseAdmin
    .from('bids')
    .select('id, job_name, drive_folder_id')
    .eq('user_id', userId)
    .eq('thread_id', threadId)
    .single();
  return data;
};

export const fuzzyFindBidByName = async (userId: string, projectName: string) => {
  const { data } = await supabaseAdmin
    .from('bids')
    .select('id, job_name')
    .eq('user_id', userId)
    .ilike('job_name', `%${projectName}%`)
    .single();
  return data;
};

export const updateBid = async (bidId: string, updateData: any) => {
  return await supabaseAdmin.from('bids').update(updateData).eq('id', bidId);
};

export const createBid = async (bidData: any) => {
  return await supabaseAdmin.from('bids').insert(bidData);
};

export const markEmailAsProcessed = async (emailId: string, userId: string) => {
  return await supabaseAdmin.from('processed_emails').insert({ email_id: emailId, user_id: userId });
};

export const handleInvalidGrant = async (userId: string) => {
  await supabaseAdmin.from('google_tokens').delete().eq('id', userId);
  await supabaseAdmin.from('profiles').update({ gmail_connected: false }).eq('id', userId);
};
