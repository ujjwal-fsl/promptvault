import { useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  hasFeature as _hasFeature,
  canShareVault,
  canSharePublicVault,
  canMakePromptPublic,
  canUseSocialLinks,
  canUsePublicProfile,
  canUsePublicView,
  getPlanInfo,
} from '@/lib/plans';

/**
 * React hook that pre-binds the current user to all plan permission checks.
 *
 * Usage:
 *   const { canShareVault, hasFeature, planInfo } = usePlan();
 *   {canShareVault && <button>Share</button>}
 *   {hasFeature('PUBLIC_VIEW') && <Toggle />}
 */
export function usePlan() {
  const { user } = useAuth();

  return useMemo(() => ({
    // Raw plan info
    plan: user?.plan || 'FREE',
    planInfo: getPlanInfo(user),

    // Generic — use for any feature key
    hasFeature: (featureKey) => _hasFeature(user, featureKey),

    // Named wrappers — pre-evaluated booleans
    canShareVault: canShareVault(user),
    canSharePublicVault: canSharePublicVault(user),
    canMakePromptPublic: canMakePromptPublic(user),
    canUseSocialLinks: canUseSocialLinks(user),
    canUsePublicProfile: canUsePublicProfile(user),
    canUsePublicView: canUsePublicView(user),
  }), [user]);
}
