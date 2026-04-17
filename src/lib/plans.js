/**
 * Intelligent Plan System — Single Source of Truth
 *
 * Architecture: Feature-First
 *   Feature → Required Plan → Hierarchical Level Check
 *
 * Adding a feature: Add one line to FEATURES.
 * Adding a plan: Add one entry to PLANS, adjust levels.
 */

// ── Plan Hierarchy ──────────────────────────────────────────
export const PLANS = {
  FREE:         { level: 0, label: 'Free' },
  PLUS:         { level: 1, label: 'Plus' },
  CREATOR:      { level: 2, label: 'Creator' },
  CREATOR_PLUS: { level: 3, label: 'Creator Plus' },
};

// ── Feature → Minimum Plan Map ──────────────────────────────
export const FEATURES = {
  SHARE_VAULT:       'FREE',
  PUBLIC_VAULT:      'CREATOR',
  PUBLIC_PROMPTS:    'CREATOR',
  SOCIAL_LINKS:      'CREATOR',
  PUBLIC_PROFILE:    'CREATOR',
  PUBLIC_VIEW:       'CREATOR',
  PREMIUM_FEATURES:  'CREATOR_PLUS',
};

// ── Core Functions ──────────────────────────────────────────

/**
 * Check if user's plan meets or exceeds the required plan level.
 * Normalizes user plan to uppercase, defaults to FREE.
 * Returns false for unrecognized plans.
 */
export function hasMinPlan(user, requiredPlan) {
  const userPlan = (user?.plan || 'FREE').toUpperCase();
  const userEntry = PLANS[userPlan];
  const requiredEntry = PLANS[requiredPlan];

  if (!userEntry || !requiredEntry) return false;

  return userEntry.level >= requiredEntry.level;
}

/**
 * Check if user has access to a specific feature.
 * Returns false if featureKey is not defined in FEATURES.
 */
export function hasFeature(user, featureKey) {
  const requiredPlan = FEATURES[featureKey];
  if (!requiredPlan) return false;

  return hasMinPlan(user, requiredPlan);
}

// ── Named Wrappers (convenience) ────────────────────────────

export const canShareVault       = (user) => hasFeature(user, 'SHARE_VAULT');
export const canSharePublicVault = (user) => hasFeature(user, 'PUBLIC_VAULT');
export const canMakePromptPublic = (user) => hasFeature(user, 'PUBLIC_PROMPTS');
export const canUseSocialLinks   = (user) => hasFeature(user, 'SOCIAL_LINKS');
export const canUsePublicProfile = (user) => hasFeature(user, 'PUBLIC_PROFILE');
export const canUsePublicView    = (user) => hasFeature(user, 'PUBLIC_VIEW');

// ── Plan Info Utility ───────────────────────────────────────

/**
 * Returns structured plan info for UI display.
 */
export function getPlanInfo(user) {
  const key = (user?.plan || 'FREE').toUpperCase();
  const entry = PLANS[key] || PLANS.FREE;
  return { key, label: entry.label, level: entry.level };
}

// ── Default Export ──────────────────────────────────────────

export default {
  PLANS,
  FEATURES,
  hasMinPlan,
  hasFeature,
  canShareVault,
  canSharePublicVault,
  canMakePromptPublic,
  canUseSocialLinks,
  canUsePublicProfile,
  canUsePublicView,
  getPlanInfo,
};
