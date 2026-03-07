// components/CompanyCard.tsx
import Link from 'next/link';
import { Company } from '@/types';
import { ExternalLink, Zap, TrendingUp } from 'lucide-react';

export default function CompanyCard({ company }: { company: Company }) {
  const initials = company.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Link href={`/company/${company.slug}`}
      className="card card-hover p-6 flex flex-col gap-4 group">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center
                         font-display font-bold text-sm text-text-secondary group-hover:border-blue/30 transition-colors">
            {initials}
          </div>
          <div>
            <h3 className="font-display font-bold text-base leading-tight">{company.name}</h3>
            <p className="text-text-muted text-xs font-mono">{company.industry}</p>
          </div>
        </div>
        <span className={`badge flex-shrink-0 ${company.tier === 'pro' ? 'badge-pro' : 'badge-free'}`}>
          {company.tier === 'pro' && <Zap size={9} />}
          {company.tier === 'pro' ? 'Pro' : 'Free'}
        </span>
      </div>

      {/* Description */}
      <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">
        {company.description}
      </p>

      {/* Package */}
      {company.package_lpa_min && (
        <div className="flex items-center gap-2">
          <TrendingUp size={13} className="text-green" />
          <span className="text-green text-xs font-mono">
            ₹{company.package_lpa_min}–{company.package_lpa_max} LPA
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
        <span className="text-text-muted text-xs">{company.hq}</span>
        <span className="text-blue text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          View questions <ExternalLink size={11} />
        </span>
      </div>
    </Link>
  );
}
