'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import {
  HomeIcon,
  BuildingOfficeIcon,
  CalculatorIcon,
  ClockIcon,
  ChartBarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BriefcaseIcon,
  ComputerDesktopIcon,
  BeakerIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMoreOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMoreOpen(false);
    }

    function onPointerDown(e: MouseEvent) {
      if (!moreRef.current) return;
      if (moreRef.current.contains(e.target as Node)) return;
      setMoreOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const primaryLinks = useMemo(
    () => [
      { href: '/', label: 'Home', icon: HomeIcon },
      { href: '/companies', label: 'Companies', icon: BuildingOfficeIcon },
      { href: '/cgpa-calculator', label: 'CGPA', icon: CalculatorIcon },
      { href: '/spaced-repetition', label: 'Review', icon: ClockIcon },
    ],
    []
  );

  const moreLinks = useMemo(
    () => [
      { href: '/applications', label: 'Trackers', icon: BriefcaseIcon },
      { href: '/system-design', label: 'System Design', icon: ComputerDesktopIcon },
      { href: '/quiz', label: 'Quizzes', icon: BeakerIcon },
      // Keep leaderboard accessible without crowding the main row
      { href: '/leaderboard', label: 'Leaderboard', icon: ChartBarIcon },
    ],
    []
  );

  const allLinks = useMemo(() => [...primaryLinks, ...moreLinks], [primaryLinks, moreLinks]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap ${
          active ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
        }`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" aria-hidden />
        <span>{label}</span>
      </Link>
    );
  };

  const DropdownLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
        isActive(href) ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
      }`}
      role="menuitem"
    >
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50" role="navigation" aria-label="Main navigation">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-display font-bold bg-gradient-to-r from-primary-600 to-accent-purple bg-clip-text text-transparent tracking-tight whitespace-nowrap"
            aria-label="placementintel home"
          >
            placementintel
          </Link>

          {/* Desktop Navigation - Compact */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center min-w-0">
            {primaryLinks.map((l) => (
              <NavLink key={l.href} href={l.href} label={l.label} icon={l.icon} />
            ))}

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap ${
                  moreOpen ? 'bg-gray-50 text-primary-700' : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
                }`}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
              >
                <span>More</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} aria-hidden />
              </button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                    role="menu"
                    aria-label="More links"
                  >
                    {moreLinks.map((l) => (
                      <DropdownLink key={l.href} href={l.href} label={l.label} icon={l.icon} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-2 whitespace-nowrap">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-700 hover:bg-gray-50 transition min-h-[44px]"
                  aria-label="Profile"
                >
                  <UserCircleIcon className="w-5 h-5 flex-shrink-0" aria-hidden />
                  <span>{user.email?.split('@')[0]}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition min-h-[44px]"
                  aria-label="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" aria-hidden />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-primary-700 px-2 py-2 rounded-lg min-h-[44px] flex items-center">
                  Sign In
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary" size="sm" className="rounded-lg px-4">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-50 border border-gray-200 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" aria-hidden /> : <Bars3Icon className="w-6 h-6" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 bg-white"
          >
            <div className="max-w-container mx-auto px-4 sm:px-6 py-3 space-y-1">
              {allLinks.map((l) => {
                const Icon = l.icon;
                const active = isActive(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition min-h-[44px] ${
                      active ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50 hover:text-primary-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" aria-hidden />
                    <span>{l.label}</span>
                  </Link>
                );
              })}

              <div className="border-t border-gray-200 mt-3 pt-3 space-y-2">
                {user ? (
                  <>
                    <Link href="/profile" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">
                      <UserCircleIcon className="w-5 h-5 flex-shrink-0" aria-hidden />
                      <span>Profile ({user.email?.split('@')[0]})</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleSignOut()}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-700 hover:bg-red-50 font-medium text-left"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" aria-hidden />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/auth/login">
                      <Button variant="secondary" className="w-full rounded-lg">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button variant="primary" className="w-full rounded-lg">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
