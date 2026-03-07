// app/api/payment/create-order/route.ts

import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { plan, userId } = await req.json();
    if (!userId) return Response.json({ error: 'User ID required' }, { status: 400 });

    const amount = plan === 'annual'
      ? parseInt(process.env.NEXT_PUBLIC_PRO_ANNUAL_PRICE || '299900')
      : parseInt(process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE || '49900');

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `placement_intel_${userId}_${Date.now()}`,
      notes: { userId, plan },
    });

    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err: any) {
    console.error('Create order error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
