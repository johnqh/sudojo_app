import { extractLanguageFromPath, removeLanguageFromPath } from './languageRouting';

export interface BreadcrumbPath {
  title: string;
  path: string;
}

export class BreadcrumbBuilder {
  private static instance: BreadcrumbBuilder;

  private constructor() {}

  public static getInstance(): BreadcrumbBuilder {
    if (!BreadcrumbBuilder.instance) {
      BreadcrumbBuilder.instance = new BreadcrumbBuilder();
    }
    return BreadcrumbBuilder.instance;
  }

  /**
   * Path to translation key mapping
   */
  private readonly pathTranslationKeys: Record<string, string> = {
    // Root paths
    '': 'breadcrumbs.home',
    '/': 'breadcrumbs.home',
    '/daily': 'breadcrumbs.daily',
    '/enter': 'breadcrumbs.enter',
    '/levels': 'breadcrumbs.levels',
    '/techniques': 'breadcrumbs.techniques',
    '/settings': 'breadcrumbs.settings',
  };

  /**
   * Get localized breadcrumb title for a path
   */
  public localizedBreadcrumb(path: string, t: (key: string) => string): string {
    const pathWithoutLang = removeLanguageFromPath(path);

    let normalizedPath = pathWithoutLang;
    if (normalizedPath !== '/' && normalizedPath.endsWith('/')) {
      normalizedPath = normalizedPath.replace(/\/+$/, '');
    }
    normalizedPath = normalizedPath.toLowerCase();

    // Check for exact match first
    const translationKey = this.pathTranslationKeys[normalizedPath];
    if (translationKey) {
      return t(translationKey);
    }

    // Handle dynamic routes like /levels/:levelId or /techniques/:techniqueId
    const segments = normalizedPath.split('/').filter(Boolean);
    if (segments.length >= 2) {
      const parentPath = `/${segments[0]}`;
      const parentKey = this.pathTranslationKeys[parentPath];
      if (parentKey) {
        // For nested routes, return the dynamic segment (e.g., level ID, technique name)
        return segments[segments.length - 1];
      }
    }

    return normalizedPath;
  }

  /**
   * Build complete breadcrumb trail for a path
   */
  public localizedBreadcrumbs(
    path: string | undefined,
    t: (key: string) => string
  ): BreadcrumbPath[] {
    if (!path) return [];

    let cleanPath = path;
    if (cleanPath !== '/' && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.replace(/\/+$/, '');
    }

    const lang = extractLanguageFromPath(cleanPath);
    const pathWithoutLang = removeLanguageFromPath(cleanPath);

    // If we're at the home page, return Home only
    if (!pathWithoutLang || pathWithoutLang === '/') {
      return [
        {
          title: t('breadcrumbs.home'),
          path: lang ? `/${lang}` : '/',
        },
      ];
    }

    const segments = pathWithoutLang.split('/').filter(Boolean);
    const result: BreadcrumbPath[] = [];

    // Always start with Home
    result.push({
      title: t('breadcrumbs.home'),
      path: lang ? `/${lang}` : '/',
    });

    // Build up the path for each segment
    let currentPath = lang ? `/${lang}` : '';
    for (const segment of segments) {
      currentPath += `/${segment}`;
      const title = this.localizedBreadcrumb(currentPath, t);
      result.push({
        title,
        path: currentPath,
      });
    }

    return result;
  }

  /**
   * Get breadcrumb items formatted for BreadcrumbSection component
   */
  public getLocalizedBreadcrumbItems(path: string, t: (key: string) => string) {
    const breadcrumbs = this.localizedBreadcrumbs(path, t);

    return breadcrumbs.map((breadcrumb, index) => ({
      label: breadcrumb.title,
      href: index === breadcrumbs.length - 1 ? undefined : breadcrumb.path,
      current: index === breadcrumbs.length - 1,
    }));
  }
}
