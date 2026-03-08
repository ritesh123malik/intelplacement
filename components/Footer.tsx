'use client';

import Link from 'next/link';
import {
  BuildingOfficeIcon,
  CalculatorIcon,
  ChartBarIcon,
  HomeIcon,
  BeakerIcon,
  BriefcaseIcon,
  ComputerDesktopIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/companies', label: 'Companies' },
  { href: '/cgpa-calculator', label: 'CGPA' },
  { href: '/spaced-repetition', label: 'Review' },
  { href: '/applications', label: 'Trackers' },
  { href: '/system-design', label: 'System Design' },
  { href: '/quiz', label: 'Quizzes' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white" role="contentinfo">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-display font-bold text-gray-900 tracking-tight">
              placement<span className="text-primary-600">Intel</span>
            </span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer navigation">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center md:text-left">
            Placement preparation for LNMIIT students. Company-wise questions, AI roadmaps, spaced repetition & more.
          </p>
        </div>
      </div>
    </footer>
  );
}
