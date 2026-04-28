import React from 'react';
import { cn } from '../utils';

type BadgeVariant = 'default' | 'outline' | 'secondary' | 'accent' | 'success';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge = ({ children, variant = 'default', className }: BadgeProps) => {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    outline: "border-border text-muted-foreground",
    secondary: "bg-secondary text-secondary-foreground border-border",
    accent: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    success: "bg-green-500/10 text-green-500 border-green-500/20"
  };

  return (
    <span className={cn(
      "text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};
