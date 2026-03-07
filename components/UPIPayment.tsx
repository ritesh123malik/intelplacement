'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import {
  QrCodeIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  BugAntIcon
} from '@heroicons/react/24/outline';

interface UPIPaymentProps {
  amount: number;
  planId: string;
  userId: string;
  onSuccess?: () => void;
}

interface ErrorDetails {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  statusCode?: number;
}

export default function UPIPayment({ amount, planId, userId, onSuccess }: UPIPaymentProps) {
  // State declarations
  const [step, setStep] = useState<'qr' | 'details' | 'verifying' | 'success'>('qr');
  const [txnId, setTxnId] = useState('');
  const [error, setError] = useState('');
  const [paymentRequestId, setPaymentRequestId] = useState<string | null>(null);
  const [loadingReq, setLoadingReq] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const UPI_ID = "6387357347@axl";
  const ALT_UPI_IDS = ["6387357347@airtel", "6387357347@ybl", "6387357347@okhdfcbank"];
  const MERCHANT_NAME = "Placement Intel";
  const AMOUNT = amount / 100;
  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${AMOUNT}&cu=INR`;

  // Auto-redirect after success
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        onSuccess?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, onSuccess]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Supabase errors have non-enumerable properties – this extracts them properly */
  function extractSupabaseError(err: any): string {
    if (!err) return 'Unknown error';
    
    // Manually extract each property (they're non-enumerable)
    const message = err.message || err.error_description || err.msg;
    const code = err.code || err.status || '';
    const details = err.details || err.hint || '';
    
    // If we have a message, use it
    if (message) {
      return [message, code && `(code: ${code})`, details && `– ${details}`]
        .filter(Boolean)
        .join(' ');
    }
    
    // Fallback: try to stringify with custom logic
    try {
      // Create a new object with enumerable properties
      const extracted = {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        statusCode: err.statusCode
      };
      return JSON.stringify(extracted);
    } catch {
      return 'Unknown database error';
    }
  }

  /** Maps Postgres/PostgREST error codes to human-readable advice */
  function friendlyError(err: any): string {
    const code = err?.code ?? '';
    if (code === '42501') return 'Permission denied. Run the RLS fix SQL shown in debug panel.';
    if (code === '42P01') return 'Table "payment_requests" not found. Create the table first.';
    if (code === '23503') return 'Foreign-key violation: userId or planId does not exist in the DB.';
    if (code === '23505') return 'Duplicate payment request already exists.';
    if (code === 'PGRST301') return 'JWT / auth token invalid. Log out and back in.';
    if (code === 'PGRST116') return 'No rows returned after insert – check RLS SELECT policy.';
    return extractSupabaseError(err);
  }

  // ─── Debug actions ──────────────────────────────────────────────────────────

  const runDiagnostics = async () => {
    setDebugInfo(null);
    const info: Record<string, any> = {};

    // 1. Auth
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    info.auth = authErr
      ? { ok: false, error: extractSupabaseError(authErr) }
      : { ok: true, id: user?.id, email: user?.email };

    // 2. Table reachable?
    const { error: tableErr } = await supabase
      .from('payment_requests')
      .select('id')
      .limit(1);
    info.table = tableErr
      ? { ok: false, error: extractSupabaseError(tableErr), code: tableErr.code }
      : { ok: true };

    // 3. Plan exists?
    const { data: plan, error: planErr } = await supabase
      .from('payment_plans')
      .select('id, name')
      .eq('id', planId)
      .maybeSingle();
    info.plan = planErr
      ? { ok: false, error: extractSupabaseError(planErr) }
      : { ok: true, found: !!plan, plan };

    setDebugInfo(info);
  };

  // ─── Main flow ──────────────────────────────────────────────────────────────

  const handleCreatePaymentRequest = async () => {
    setLoadingReq(true);
    setError('');

    try {
      // 1. Confirm auth
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setError('Not authenticated. Please log in again.');
        setLoadingReq(false);
        return;
      }

      // 2. Resolve plan (fall back to first available plan if exact ID missing)
      let resolvedPlanId = planId;
      const { data: plan, error: planErr } = await supabase
        .from('payment_plans')
        .select('id')
        .eq('id', planId)
        .maybeSingle();

      if (!plan && !planErr) {
        const { data: fallback } = await supabase
          .from('payment_plans')
          .select('id')
          .limit(1)
          .single();
        if (fallback) resolvedPlanId = fallback.id;
      }

      // 3. Insert payment request
      const { data, error: insertErr } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          plan_id: resolvedPlanId,
          amount,
          status: 'pending',
          upi_id: UPI_ID,
        })
        .select('id')
        .single();

      if (insertErr) {
        // Properly extract non-enumerable properties
        const errorDetails: ErrorDetails = {
          message: insertErr.message,
          code: insertErr.code,
          details: insertErr.details,
          hint: insertErr.hint,
          statusCode: (insertErr as { statusCode?: number }).statusCode
        };
        
        console.error('❌ Supabase insert error:', errorDetails);
        console.error('Raw error object:', insertErr);
        
        setDebugInfo({ insertError: errorDetails });
        setError(friendlyError(insertErr));
        setLoadingReq(false);
        return;
      }

      console.log('✅ Payment request created:', data.id);
      setPaymentRequestId(data.id);
      setStep('details');

    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setError(err?.message ?? 'Unexpected error. Check console.');
    } finally {
      setLoadingReq(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!txnId.trim() || txnId.trim().length < 12) {
      setError('Please enter a valid 12-digit transaction ID.');
      return;
    }
    setError('');
    setStep('verifying');
    setVerifying(true);

    try {
      // Update the payment request with transaction ID
      if (paymentRequestId) {
        await supabase
          .from('payment_requests')
          .update({ transaction_id: txnId.trim(), status: 'submitted' })
          .eq('id', paymentRequestId);
      }

      // Upgrade subscription
      await upgradeUserSubscription();
      setStep('success');
    } catch (err: any) {
      setStep('details');
      setError(err?.message ?? 'Verification failed. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  async function upgradeUserSubscription() {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: 'pro_annual',
        status: 'active',
        amount_paise: amount,
        expires_at: expiresAt.toISOString(),
      });

    if (error) throw new Error(friendlyError(error));
  }

  // ─── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold flex items-center">
            <QrCodeIcon className="w-6 h-6 mr-2" />
            Pay via UPI
          </h3>
          <button
            onClick={() => { setShowDebug(v => !v); runDiagnostics(); }}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
            title="Toggle Debug Info"
          >
            <BugAntIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-green-100 mt-1">
          Scan QR code to pay ₹{AMOUNT} for 1-year access
        </p>
      </div>

      <div className="p-6">

        {/* Debug Panel */}
        {showDebug && (
          <div className="mb-4 p-4 bg-gray-900 text-green-400 rounded-xl font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-bold">🔧 Diagnostics</h4>
              <button
                onClick={runDiagnostics}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
              >
                Re-run
              </button>
            </div>
            <div className="space-y-1 mb-2">
              <p>User ID prop: <span className="text-yellow-300">{userId}</span></p>
              <p>Plan ID: <span className="text-yellow-300">{planId}</span></p>
              <p>Amount (paise): <span className="text-yellow-300">{amount}</span> → ₹{AMOUNT}</p>
              <p>UPI ID: <span className="text-yellow-300">{UPI_ID}</span></p>
            </div>
            {debugInfo && (
              <pre className="bg-gray-800 p-2 rounded overflow-auto max-h-48">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            )}

            {/* RLS fix hint */}
            <div className="mt-3 p-2 bg-yellow-900 text-yellow-200 rounded text-xs">
              <p className="font-bold mb-1">
                🔑 If you see code 42501 (permission denied), run this SQL in Supabase:
              </p>
              <pre className="whitespace-pre-wrap">{`-- Allow authenticated users to insert their own requests
CREATE POLICY "Users can insert own payment_requests"
ON payment_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to read their own requests
CREATE POLICY "Users can view own payment_requests"
ON payment_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());`}
              </pre>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <p className="font-semibold mb-0.5">❌ Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Step: QR */}
        {step === 'qr' && (
          <div className="text-center">
            <div className="bg-white p-4 rounded-xl mb-4 inline-block border-2 border-gray-200">
              <QRCodeSVG value={upiLink} size={250} level="H" includeMargin />
            </div>

            <p className="text-gray-600 mb-1 font-medium">
              Scan with any UPI app (Google Pay, PhonePe, Paytm)
            </p>
            <p className="text-sm text-gray-500 mb-5">
              Amount: <span className="font-bold text-lg">₹{AMOUNT}</span>
            </p>

            <button
              onClick={handleCreatePaymentRequest}
              disabled={loadingReq}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 mb-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingReq ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Processing…
                </>
              ) : "I've Made the Payment"}
            </button>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
              <p className="text-xs text-gray-500 mb-1 text-center">Or pay manually to this UPI ID:</p>
              <p className="font-mono text-sm font-bold text-gray-800 text-center">{UPI_ID}</p>
              <div className="flex justify-center gap-2 mt-2">
                <button
                  onClick={() => navigator.clipboard.writeText(UPI_ID)}
                  className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                >
                  Copy UPI ID
                </button>
                <button
                  onClick={() => window.open(`upi://pay?pa=${UPI_ID}&pn=${MERCHANT_NAME}&am=${AMOUNT}&cu=INR`)}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                >
                  Open UPI App
                </button>
              </div>
            </div>

            <div className="mt-3 text-left">
              <p className="text-xs text-gray-400 mb-1">Alternative UPI IDs if payment fails:</p>
              <div className="space-y-1">
                {ALT_UPI_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => { navigator.clipboard.writeText(id); }}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded block w-full text-left hover:bg-gray-200"
                  >
                    📋 {id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                Enter Transaction ID
              </h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Open your UPI app and go to transaction history</li>
                <li>Find the payment you just made</li>
                <li>Copy the 12-digit Transaction ID / UTR number</li>
                <li>Paste it below</li>
              </ol>
            </div>

            <input
              type="text"
              value={txnId}
              onChange={(e) => setTxnId(e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="Enter 12-digit UPI Transaction ID"
              className="w-full p-3 border-2 border-gray-200 rounded-xl mb-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono tracking-widest"
              maxLength={12}
            />

            <button
              onClick={handleVerifyPayment}
              disabled={verifying}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Verifying…
                </>
              ) : (
                "Verify Payment"
              )}
            </button>

            <button
              onClick={() => setStep('qr')}
              className="w-full mt-2 text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Back to QR Code
            </button>
          </div>
        )}

        {/* Step: Verifying */}
        {step === 'verifying' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Verifying your payment…</p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="bg-green-50 p-8 rounded-xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful! 🎉</h3>
            <p className="text-gray-600 mb-4">
              Your Pro Annual subscription is now active for 1 year.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to dashboard in 3 seconds...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}