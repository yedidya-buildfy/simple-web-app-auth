import { ReactNode } from 'react';

interface BadgeWithDotProps {
  children: ReactNode;
  color?: 'success' | 'error' | 'warning' | 'info';
  type?: 'modern' | 'classic';
  size?: 'sm' | 'md' | 'lg';
}

export function BadgeWithDot({
  children,
  color = 'success',
  type = 'modern',
  size = 'sm'
}: BadgeWithDotProps) {
  const colorClasses = {
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  const dotColorClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colorClasses[color]} ${sizeClasses[size]}`}
    >
      <span className={`rounded-full ${dotColorClasses[color]} ${dotSizeClasses[size]}`} />
      {children}
    </span>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-green-500/10 text-green-500',
    secondary: 'bg-gray-500/10 text-gray-400',
    outline: 'border border-gray-700 text-gray-400',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
}
