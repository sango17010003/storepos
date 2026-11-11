// api/sync.js - Vercel Serverless Function
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // 1. Bot check: Honeypot trap verification
  if (req.body.b_trap_name) {
    return res.status(403).json({ error: 'Automated agent request forbidden.' });
  }

  const { action, gstin, payload } = req.body;
  if (!gstin || gstin.length !== 15) {
    return res.status(400).json({ error: 'Invalid 15-digit Store GSTIN.' });
  }

  try {
    if (action === 'RECORD_SALE') {
      const { data, error } = await supabase
        .from('sales')
        .insert([{ gstin, bill_data: payload, created_at: new Date().toISOString() }]);

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'CANCEL_SALE') {
      const { data, error } = await supabase
        .from('sales')
        .update({ status: 'CANCELLED' })
        .eq('gstin', gstin)
        .eq('invoice_number', payload.invoiceNo);

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    return res.status(400).json({ error: 'Unrecognized action dispatch.' });
  } catch (err) {
    console.error("Backend Sync Error:", err);
    return res.status(500).json({ error: 'Secure transaction failed.' });
  }
}