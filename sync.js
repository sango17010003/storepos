import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { table, payload, secretToken } = req.body;
  // Authenticate using a session PIN hash or internal bearer token
  if (secretToken !== process.env.POS_APP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized counter access' });
  }

  const { data, error } = await supabase.from(table).insert(payload);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json({ success: true, data });
}