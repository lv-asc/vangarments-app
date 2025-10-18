import { forwardRef } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', href, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      primary: 'bg-[#00132d] text-[#fff7d7] hover:bg-[#00132d]/90 focus-visible:ring-[#00132d]',
      secondary: 'bg-[#fff7d7] text-[#00132d] hover:bg-[#fff7d7]/80 focus-visible:ring-[#00132d]',
      outline: 'border border-[#00132d]/20 bg-white text-[#00132d] hover:bg-[#fff7d7]/50 focus-visible:ring-[#00132d]',
      ghost: 'text-[#00132d] hover:bg-[#fff7d7]/50 focus-visible:ring-[#00132d]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 text-lg',
    };

    const classes = clsx(
      baseClasses,
      variants[variant],
      sizes[size],
      className
    );

    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button className={classes} ref={ref} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';