// app/api/payment/verify/route.ts

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { orderId, paymentId, signature, userId, plan } = await req.json();

    // Verify Razorpay signature
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');

    if (expectedSignature !== signature) {
      return Response.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
    }

    // Calculate expiry
    const expiresAt = plan === 'annual'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const amount = plan === 'annual' ? 299900 : 49900;

    // Update subscription in database
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: plan === 'annual' ? 'annual' : 'pro',
        status: 'active',
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        amount_paise: amount,
        expires_at: expiresAt,
      }, { onConflict: 'user_id' });

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('Payment verify error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
