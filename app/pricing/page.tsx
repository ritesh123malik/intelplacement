'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import UPIPayment from '@/components/UPIPayment';
import { CheckCircleIcon, StarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch plans
    const { data: plansData } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_inr');

    setPlans(plansData || []);

    // Check current subscription
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      setCurrentSubscription(sub);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-200 border-t-primary-600" role="status" aria-label="Loading" />
      </div>
    );
  }

  const features = [
    'Unlimited LeetCode questions',
    'AI-powered explanations',
    'Spaced repetition system',
    'Mock interviews with AI',
    'Resume review & optimization',
    'CGPA calculator & predictor',
    'Progress tracking analytics',
    'Company-specific roadmaps',
    'Priority email support',
  ];

  return (
    <div className="min-h-screen bg-bg">
      <div className="pt-24 pb-12 border-b border-gray-200 bg-gradient-to-b from-primary-50/50 to-transparent relative overflow-hidden">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 text-gray-900 inline-flex items-center justify-center gap-3 flex-wrap">
            <StarIcon className="w-10 h-10 text-primary-600" aria-hidden />
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Supercharge your placement trajectory with Premium.
          </p>
        </div>
      </div>

      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8 items-start max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card rounded-3xl overflow-hidden hover:border-gray-300 transition-all">
            <div className="p-8">
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Basic</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">₹0</div>
              <p className="text-gray-600 mb-8 h-12">Essential features for getting started.</p>
              <button disabled className="w-full bg-gray-100 border border-gray-200 text-gray-500 py-3 rounded-xl font-bold text-sm cursor-not-allowed mb-8">
                Current plan
              </button>
              <ul className="space-y-4">
                <li className="flex items-start text-gray-900 text-sm font-medium">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" aria-hidden />
                  <span>50 LeetCode questions/month</span>
                </li>
                <li className="flex items-start text-gray-900 text-sm font-medium">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" aria-hidden />
                  <span>Basic roadmap generator</span>
                </li>
                <li className="flex items-start text-gray-900 text-sm font-medium">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" aria-hidden />
                  <span>CGPA calculator</span>
                </li>
                <li className="flex items-start text-gray-400 text-sm line-through">
                  <CheckCircleIcon className="w-5 h-5 text-gray-300 mr-3 mt-0.5 flex-shrink-0" aria-hidden />
                  <span>AI explanations</span>
                </li>
                <li className="flex items-start text-gray-400 text-sm line-through">
                  <CheckCircleIcon className="w-5 h-5 text-gray-300 mr-3 mt-0.5 flex-shrink-0" aria-hidden />
                  <span>Spaced repetition</span>
                </li>
              </ul>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="card rounded-3xl border-2 border-primary-300 overflow-hidden relative transform md:-translate-y-2 z-10 shadow-lg">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-accent-purple" />
            <div className="bg-primary-50 py-2.5 text-center text-primary-700 text-xs font-bold uppercase tracking-wider border-b border-primary-100">
              Most Popular
            </div>
            <div className="p-8 relative">
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Pro Monthly</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-display font-bold text-gray-900">₹50</span>
                <span className="text-gray-500 ml-2 font-mono text-sm">/mo</span>
              </div>
              <p className="text-gray-600 mb-8 h-12">Unrestricted access to the entire platform.</p>
              {currentSubscription?.plan === 'pro' ? (
                <button disabled className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 py-3 rounded-xl font-bold text-sm cursor-not-allowed mb-8">
                  Active
                </button>
              ) : (
                <div className="mb-8">
                  {userId ? (
                    <UPIPayment planId={plans.find(p => p.name === 'Pro Monthly')?.id || 'default_monthly'} amount={5000} userId={userId} onSuccess={() => window.location.reload()} />
                  ) : (
                    <button type="button" onClick={() => router.push('/auth/login')} className="btn-primary w-full py-3 text-sm">
                      Sign in to subscribe
                    </button>
                  )}
                </div>
              )}
              <div className="h-px w-full bg-gray-200 mb-8" />
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start text-gray-900 text-sm font-medium">
                    <CheckCircleIcon className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card rounded-3xl overflow-hidden hover:border-amber-200 transition-all">
            <div className="p-8 relative">
              <h3 className="text-2xl font-display font-bold text-amber-700 mb-2">Pro Annual</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-display font-bold text-gray-900">₹500</span>
                <span className="text-gray-500 ml-2 font-mono text-sm">/yr</span>
              </div>
              <div className="inline-flex items-center text-xs font-bold font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded mb-4">
                SAVE ₹100 (17% OFF)
              </div>
              <p className="text-gray-600 mb-6 h-auto">Best value for sustained preparation.</p>
              {currentSubscription?.plan === 'pro_annual' ? (
                <button disabled className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 py-3 rounded-xl font-bold text-sm cursor-not-allowed mb-8">
                  Active
                </button>
              ) : (
                <div className="mb-8">
                  {userId ? (
                    <UPIPayment planId={plans.find(p => p.name === 'Pro Semi-Annual')?.id || 'default_annual'} amount={50000} userId={userId} onSuccess={() => window.location.reload()} />
                  ) : (
                    <button type="button" onClick={() => router.push('/auth/login')} className="btn-primary w-full py-3 text-sm">
                      Sign in to subscribe
                    </button>
                  )}
                </div>
              )}
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start text-gray-900 text-sm font-medium">
                    <CheckCircleIcon className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-xs text-gray-500 leading-relaxed">
                  * Equivalent to 2 months free vs monthly.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="text-center mt-16 max-w-2xl mx-auto flex flex-col items-center">
          <ShieldCheckIcon className="w-12 h-12 text-gray-400 mb-4" aria-hidden />
          <p className="text-sm font-medium text-gray-600 flex flex-wrap items-center justify-center gap-3">
            <span>🔒 Secure</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" aria-hidden />
            <span>Cancel anytime</span>
          </p>
        </div>
      </div>
    </div>
  );
}
