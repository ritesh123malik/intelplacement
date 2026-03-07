import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { txnId, userId, amount, paymentRequestId } = await req.json();

        // Secure webhook tunnel utilizing Node HTTP directly to Telegram Bot APIs
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            const message = `
🔔 *PLACEMENT-INTEL: INCOMING PAYMENT!* 🔔
💰 *Amount:* ₹${amount}
🆔 *Transaction UTR:* \`${txnId}\`
👤 *User Node:* \`${userId}\`
📋 *Telemetry Request ID:* \`${paymentRequestId}\`
⏱️ *Timestamp:* ${new Date().toLocaleString()}

🚨 **[VERIFY NOW ON ADMIN DASHBOARD](${process.env.NEXT_PUBLIC_APP_URL}/admin/payments)**
      `;

            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                })
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Core Webhook Notification failure vector:', error);
        return NextResponse.json({ success: false, error: 'Telegram operations pipeline failed to clear network socket' });
    }
}
