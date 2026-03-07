'use client';

import { HTMLMotionProps, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]';

  const variants = {
    primary:
      'bg-gradient-to-r from-primary-600 to-accent-purple text-white shadow-sm hover:opacity-95 hover:shadow-glow border-0 [text-shadow:0_1px_2px_rgba(0,0,0,0.15)]',
    secondary:
      'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-0',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
