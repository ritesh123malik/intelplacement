'use client';

import { HTMLMotionProps, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'pink' | 'none';
  hoverEffect?: boolean;
}

export function GlassCard({
  children,
  className,
  glowColor = 'none',
  hoverEffect = true,
  ...props
}: GlassCardProps) {
  const glowMap = {
    blue: 'hover:shadow-[0_4px_14px_-4px_rgba(79,70,229,0.25)]',
    purple: 'hover:shadow-[0_4px_14px_-4px_rgba(124,58,237,0.25)]',
    pink: 'hover:shadow-[0_4px_14px_-4px_rgba(219,39,119,0.25)]',
    none: '',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hoverEffect ? { scale: 1.01, y: -2 } : {}}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-card p-6',
        hoverEffect && 'transition-shadow duration-300',
        glowMap[glowColor],
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
