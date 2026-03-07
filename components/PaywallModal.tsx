'use client';

import Link from 'next/link';
import { X, Zap, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
}

const PRO_PERKS = [
  'All 40+ companies including Google, Microsoft, Amazon',
  'Every question — all rounds, all years',
  'Unlimited AI resume scoring',
  'Unlimited prep roadmaps',
];

export default function PaywallModal({ isOpen, onClose, companyName }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <div className="card max-w-md w-full p-8 relative border-amber-200 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <X size={18} aria-hidden />
        </button>

        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Zap size={26} className="text-amber-600" aria-hidden />
        </div>

        <h2 id="paywall-title" className="font-display font-bold text-xl text-center text-gray-900 mb-2">
          {companyName ? `${companyName} is a Pro company` : 'Upgrade to Pro'}
        </h2>
        <p className="text-gray-600 text-sm text-center mb-6">
          Unlock all questions, AI tools, and every company.
        </p>

        <ul className="flex flex-col gap-2.5 mb-7">
          {PRO_PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-2.5 text-sm">
              <Check size={15} className="text-amber-600 flex-shrink-0" aria-hidden />
              <span className="text-gray-700">{perk}</span>
            </li>
          ))}
        </ul>

        <Link href="/pricing" className="btn-gold w-full flex items-center justify-center gap-2 py-3 text-base font-bold">
          <Zap size={17} aria-hidden />
          View pricing
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="w-full text-gray-500 text-sm font-medium mt-3 hover:text-gray-700 transition-colors py-2"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
