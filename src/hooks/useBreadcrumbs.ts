import { useMemo, useSyncExternalStore } from 'react';
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

  // Subscribe to dynamic title changes
  const dynamicTitleVersion = useSyncExternalStore(
    (callback) => breadcrumbBuilder.subscribe(callback),
    () => Date.now(), // Return a new value on each change to trigger re-render
    () => Date.now()
  );

  // Memoize breadcrumbs with language and dynamic titles as dependencies
  const breadcrumbItems = useMemo(() => {
    return breadcrumbBuilder.getLocalizedBreadcrumbItems(location.pathname, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breadcrumbBuilder, location.pathname, t, i18n.language, dynamicTitleVersion]);

  const breadcrumbPaths = useMemo(() => {
    return breadcrumbBuilder.localizedBreadcrumbs(location.pathname, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breadcrumbBuilder, location.pathname, t, i18n.language, dynamicTitleVersion]);

  const currentTitle = useMemo(() => {
    return breadcrumbBuilder.localizedBreadcrumb(location.pathname, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breadcrumbBuilder, location.pathname, t, i18n.language, dynamicTitleVersion]);

  return {
    items: breadcrumbItems,
    paths: breadcrumbPaths,
    currentTitle,
  };
};
