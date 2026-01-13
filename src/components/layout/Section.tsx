import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

/**
 * Section Component
 *
 * The primary building block for page content areas. Provides consistent
 * layout, spacing, and background handling across all pages.
 *
 * Core concept: Section extends full viewport width (for backgrounds),
 * while its inner container is constrained by max-width and has horizontal padding.
 *
 * Usage:
 * ```tsx
 * <Section spacing="3xl" background="surface">
 *   <h2>Section Title</h2>
 *   <p>Content here is automatically wrapped in a constrained container</p>
 * </Section>
 * ```
 */

const sectionVariants = cva('', {
  variants: {
    variant: {
      default: '',
      hero: 'relative overflow-hidden',
      feature: 'bg-white dark:bg-gray-800',
      cta: 'relative overflow-hidden',
      testimonial: 'bg-gray-50 dark:bg-gray-900',
      footer: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 border-t',
    },
    spacing: {
      none: '',
      xs: 'py-2',
      sm: 'py-3',
      md: 'py-4',
      lg: 'py-6',
      xl: 'py-8',
      '2xl': 'py-12',
      '3xl': 'py-16',
      '4xl': 'py-20',
      '5xl': 'py-24',
    },
    background: {
      none: '',
      default: 'bg-[var(--color-bg-secondary)]',
      surface: 'bg-[var(--color-bg-primary)]',
      muted: 'bg-[var(--color-bg-tertiary)]',
      gradient: 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/50 dark:to-purple-900/50',
      'gradient-primary': 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50',
      'gradient-secondary': 'bg-gradient-to-br from-green-50 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50',
      'gradient-tertiary': 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-900',
      'gradient-vibrant': 'bg-gradient-to-br from-blue-800 to-purple-800 dark:from-blue-900 dark:to-purple-900',
    },
  },
  defaultVariants: {
    variant: 'default',
    spacing: '3xl',
    background: 'none',
  },
});

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
} as const;

type MaxWidth = keyof typeof maxWidthClasses;

interface SectionProps extends VariantProps<typeof sectionVariants> {
  children: React.ReactNode;
  /** Additional classes for the outer section element */
  className?: string;
  /** Additional classes for the inner container */
  containerClassName?: string;
  /** Max width of the inner container. Defaults to 7xl (1280px) */
  maxWidth?: MaxWidth;
  /** HTML element to render. Defaults to 'section' */
  as?: keyof React.JSX.IntrinsicElements;
  /** HTML id attribute */
  id?: string;
  /** When true, children render without inner container. Use for custom layouts */
  fullWidth?: boolean;
}

export function Section({
  children,
  variant = 'default',
  spacing = '3xl',
  background = 'none',
  maxWidth = '7xl',
  className,
  containerClassName,
  as: Component = 'section',
  id,
  fullWidth = false,
}: SectionProps) {
  const content = fullWidth ? (
    children
  ) : (
    <div
      className={cn(
        maxWidthClasses[maxWidth],
        'mx-auto px-4 sm:px-6 lg:px-8',
        containerClassName
      )}
    >
      {children}
    </div>
  );

  return React.createElement(
    Component,
    {
      id,
      className: cn(sectionVariants({ variant, spacing, background }), className),
    },
    content
  );
}

export default Section;
