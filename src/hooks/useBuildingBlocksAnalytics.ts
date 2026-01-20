/**
 * Hook to create analytics tracking callback for building_blocks components.
 * Uses the analyticsService singleton directly.
 */
import { useCallback } from 'react';
import { analyticsService } from '../config/analytics';
import type { AnalyticsTrackingParams } from '@sudobility/building_blocks';

/**
 * Creates an analytics tracking callback compatible with building_blocks components.
 * Use this when rendering building_blocks components that accept an `onTrack` prop.
 *
 * @example
 * ```tsx
 * const onTrack = useBuildingBlocksAnalytics();
 *
 * return (
 *   <AppBreadcrumbs
 *     items={breadcrumbItems}
 *     onTrack={onTrack}
 *   />
 * );
 * ```
 */
export function useBuildingBlocksAnalytics() {
  const onTrack = useCallback((params: AnalyticsTrackingParams) => {
    // Map building_blocks event types to analytics service methods
    switch (params.eventType) {
      case 'button_click':
        analyticsService.trackButtonClick(params.label, {
          component_name: params.componentName,
          ...params.params,
        });
        break;
      case 'link_click':
        analyticsService.trackLinkClick(params.label, params.label, {
          component_name: params.componentName,
          ...params.params,
        });
        break;
      case 'settings_change':
        analyticsService.trackButtonClick(params.label, {
          component_name: params.componentName,
          action_type: 'settings_change',
          ...params.params,
        });
        break;
      case 'subscription_action':
        analyticsService.trackButtonClick(params.label, {
          component_name: params.componentName,
          action_type: 'subscription',
          ...params.params,
        });
        break;
      case 'navigation':
        analyticsService.trackLinkClick(params.label, params.label, {
          component_name: params.componentName,
          navigation_type: 'navigation',
          ...params.params,
        });
        break;
      default:
        // Generic tracking for unknown event types
        analyticsService.trackButtonClick(params.label, {
          component_name: params.componentName,
          action_type: params.eventType,
          ...params.params,
        });
    }
  }, []);

  return onTrack;
}

export default useBuildingBlocksAnalytics;
