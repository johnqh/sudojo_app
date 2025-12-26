import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BreadcrumbBuilder } from '../utils/BreadcrumbBuilder';

/**
 * Custom hook to generate breadcrumbs based on current location
 * @returns Object containing breadcrumb items and utilities
 */
export const useBreadcrumbs = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const breadcrumbBuilder = BreadcrumbBuilder.getInstance();

  // Memoize breadcrumbs with language as dependency to re-compute on language change
  const breadcrumbItems = useMemo(() => {
    return breadcrumbBuilder.getLocalizedBreadcrumbItems(location.pathname, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breadcrumbBuilder, location.pathname, t, i18n.language]);

  const breadcrumbPaths = useMemo(() => {
    return breadcrumbBuilder.localizedBreadcrumbs(location.pathname, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breadcrumbBuilder, location.pathname, t, i18n.language]);

  const currentTitle = useMemo(() => {
    return breadcrumbBuilder.localizedBreadcrumb(location.pathname, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breadcrumbBuilder, location.pathname, t, i18n.language]);

  return {
    items: breadcrumbItems,
    paths: breadcrumbPaths,
    currentTitle,
  };
};
