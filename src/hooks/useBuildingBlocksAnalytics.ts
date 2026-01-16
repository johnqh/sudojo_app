/**
 * Hook to create analytics tracking callback for building_blocks components.
 * This integrates the building_blocks onTrack interface with Firebase Analytics.
 */
import { useCallback } from 'react';
import { useFirebaseAnalytics } from './useFirebaseAnalytics';
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
  const analytics = useFirebaseAnalytics();

  const onTrack = useCallback(
    (params: AnalyticsTrackingParams) => {
      // Map building_blocks event types to Firebase Analytics events
      switch (params.eventType) {
        case 'button_click':
          analytics.trackButtonClick({
            button_text: params.label,
            component_name: params.componentName,
            ...params.params,
          });
          break;
        case 'link_click':
          analytics.trackLinkClick({
            link_text: params.label,
            component_name: params.componentName,
            ...params.params,
          });
          break;
        case 'settings_change':
          analytics.trackButtonClick({
            button_text: params.label,
            component_name: params.componentName,
            action_type: 'settings_change',
            ...params.params,
          });
          break;
        case 'subscription_action':
          analytics.trackButtonClick({
            button_text: params.label,
            component_name: params.componentName,
            action_type: 'subscription',
            ...params.params,
          });
          break;
        case 'navigation':
          analytics.trackLinkClick({
            link_text: params.label,
            component_name: params.componentName,
            navigation_type: 'navigation',
            ...params.params,
          });
          break;
        default:
          // Generic tracking for unknown event types
          analytics.trackButtonClick({
            button_text: params.label,
            component_name: params.componentName,
            action_type: params.eventType,
            ...params.params,
          });
      }
    },
    [analytics]
  );

  return onTrack;
}

export default useBuildingBlocksAnalytics;
