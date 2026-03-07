'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircleIcon, XCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPayments();

        // Refresh interval mapping
        const interval = setInterval(fetchPayments, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchPayments = async () => {
        const { data, error } = await supabase
            .from('payment_requests')
            .select(`
        *,
        users:user_id (
          email
        )
      `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (!error) {
            setPayments(data || []);
        }
        setLoading(false);
    };

    const verifyPayment = async (paymentId: string, userId: string, amount: number) => {
        setVerifyingId(paymentId);

        try {
            // Transition request status
            await supabase
                .from('payment_requests')
                .update({
                    status: 'verified',
                    verified_at: new Date().toISOString()
                })
                .eq('id', paymentId);

            // Provision Clearance Level
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);

            await supabase
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    plan: amount >= 50000 ? 'pro_annual' : 'pro',
                    status: 'active',
                    amount_paise: amount,
                    expires_at: expiresAt.toISOString()
                });

            // Synchronize View
            fetchPayments();
        } catch (e) {
            console.error("Critical failure during verification", e);
            alert("Failed to provision subscription.");
        } finally {
            setVerifyingId(null);
        }
    };

    const rejectPayment = async (paymentId: string) => {
        if (!confirm("Are you sure you want to REJECT this transaction?")) return;

        await supabase
            .from('payment_requests')
            .update({
                status: 'failed',
                notes: 'Rejected manually by Site Administrator'
            })
            .eq('id', paymentId);

        fetchPayments();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg noise p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8 border-b border-border pb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue/10 flex items-center justify-center border border-blue/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                        <ShieldCheckIcon className="w-6 h-6 text-blue" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-text-primary">Terminal Operations</h1>
                        <p className="text-text-muted text-sm mt-1">Pending UPI Validations</p>
                    </div>
                </div>

                {payments.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card p-12 text-center border-dashed border-2 border-border"
                    >
                        <div className="w-20 h-20 bg-green-500/10 rounded-full mx-auto flex items-center justify-center mb-6">
                            <CheckCircleIcon className="w-10 h-10 text-green-500" />
                        </div>
                        <p className="text-text-primary font-display font-bold text-xl mb-2">Systems Operational</p>
                        <p className="text-text-secondary text-sm">No pending clearance transmissions detected.</p>
                    </motion.div>
                ) : (
                    <div className="grid gap-6">
                        <AnimatePresence>
                            {payments.map((payment) => (
                                <motion.div
                                    key={payment.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="card p-6 border border-yellow-500/20 shadow-[0_4px_30px_rgba(234,179,8,0.05)] relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-2xl pointer-events-none rounded-full"></div>

                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <p className="font-bold text-lg text-text-primary flex items-center gap-2">
                                                {payment.users?.email || 'Unknown User Vector'}
                                            </p>
                                            <p className="text-xs text-text-muted font-mono mt-1">
                                                Time: {new Date(payment.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 font-bold tracking-widest uppercase text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 rounded">
                                            Authorization Pending
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-surface-dark p-4 rounded-xl border border-border">
                                            <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest mb-1">Total</p>
                                            <p className="font-display font-bold text-blue text-xl">₹{payment.amount / 100}</p>
                                        </div>
                                        <div className="bg-surface-dark p-4 rounded-xl border border-border col-span-2">
                                            <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest mb-1">UTR Reference ID</p>
                                            <p className="font-mono text-text-primary tracking-wider">{payment.transaction_id || 'Not Provided'}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => verifyPayment(payment.id, payment.user_id, payment.amount)}
                                            disabled={verifyingId === payment.id}
                                            className="btn-primary py-3 flex-1 flex flex-row items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                        >
                                            {verifyingId === payment.id ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                    Commit Clearance & Upgrade
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => rejectPayment(payment.id)}
                                            disabled={verifyingId === payment.id}
                                            className="px-6 py-3 bg-red-500/10 text-red-400 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-red-500/20 border border-red-500/30 transition-all flex items-center gap-2"
                                        >
                                            <XCircleIcon className="w-5 h-5" />
                                            Reject
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
