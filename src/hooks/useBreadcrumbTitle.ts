import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BreadcrumbBuilder } from '../utils/BreadcrumbBuilder';

/**
 * Hook to set a dynamic breadcrumb title for the current page.
 * The title will be cleared when the component unmounts.
 *
 * @param title - The title to display in the breadcrumb, or undefined to use default
 *
 * @example
 * ```tsx
 * // In a level detail page:
 * const { data: levelData } = useSudojoLevel(...);
 * useBreadcrumbTitle(levelData?.data?.title);
 * ```
 */
export function useBreadcrumbTitle(title: string | undefined): void {
  const location = useLocation();
  const breadcrumbBuilder = BreadcrumbBuilder.getInstance();

  useEffect(() => {
    if (title) {
      breadcrumbBuilder.setDynamicTitle(location.pathname, title);
    }

    return () => {
      breadcrumbBuilder.clearDynamicTitle(location.pathname);
    };
  }, [breadcrumbBuilder, location.pathname, title]);
}
