/**
 * API context hook for sudojo_app
 *
 * Re-exports the generic useApi from building_blocks/firebase.
 * This provides: networkClient, baseUrl, token, userId, isReady, isLoading, refreshToken, testMode
 */
export { useApi, type ApiContextValue } from '@sudobility/building_blocks/firebase';
