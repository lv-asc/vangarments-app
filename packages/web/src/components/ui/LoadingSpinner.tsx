// @ts-nocheck
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'bars';
  color?: 'primary' | 'secondary' | 'white';
}

export function LoadingSpinner({
  size = 'md',
  className = '',
  variant = 'default',
  color = 'primary'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colorClasses = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    white: 'border-background',
  };

  if (variant === 'dots') {
    return <LoadingDots size={size} className={className} color={color} />;
  }

  if (variant === 'pulse') {
    return <LoadingPulse size={size} className={className} color={color} />;
  }

  if (variant === 'bars') {
    return <LoadingBars size={size} className={className} color={color} />;
  }

  return (
    <motion.div
      className={cn(
        'animate-spin rounded-full border-b-2',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  );
}

function LoadingDots({ size, className, color }: Omit<LoadingSpinnerProps, 'variant'>) {
  const sizeClasses = {
    sm: 'h-1 w-1',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  };

  const colorClasses = {
    primary: 'bg-pink-600',
    secondary: 'bg-purple-600',
    white: 'bg-white',
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            'rounded-full',
            sizeClasses[size!],
            colorClasses[color!]
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

function LoadingPulse({ size, className, color }: Omit<LoadingSpinnerProps, 'variant'>) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colorClasses = {
    primary: 'bg-pink-600',
    secondary: 'bg-purple-600',
    white: 'bg-white',
  };

  return (
    <motion.div
      className={cn(
        'rounded-full',
        sizeClasses[size!],
        colorClasses[color!],
        className
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
      }}
    />
  );
}

function LoadingBars({ size, className, color }: Omit<LoadingSpinnerProps, 'variant'>) {
  const heightClasses = {
    sm: 'h-4',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
  };

  const colorClasses = {
    primary: 'bg-pink-600',
    secondary: 'bg-purple-600',
    white: 'bg-white',
  };

  return (
    <div className={cn('flex items-end space-x-1', className)}>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={cn(
            'w-1 rounded-sm',
            heightClasses[size!],
            colorClasses[color!]
          )}
          animate={{
            scaleY: [1, 0.3, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

interface LoadingPageProps {
  message?: string;
  submessage?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'bars';
}

export function LoadingPage({
  message = 'Carregando...',
  submessage,
  variant = 'default'
}: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <LoadingSpinner size="lg" variant={variant} className="mx-auto mb-4" />
        <motion.p
          className="text-gray-900 font-medium mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {message}
        </motion.p>
        {submessage && (
          <motion.p
            className="text-gray-600 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {submessage}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'bars';
}

export function LoadingOverlay({
  isVisible,
  message = 'Carregando...',
  variant = 'default'
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg p-6 text-center shadow-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <LoadingSpinner size="lg" variant={variant} className="mx-auto mb-4" />
        <p className="text-gray-900 font-medium">{message}</p>
      </motion.div>
    </motion.div>
  );
}