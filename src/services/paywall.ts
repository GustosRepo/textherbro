/**
 * Paywall & In-App Purchase service.
 *
 * Currently uses AsyncStorage as a local mock for development.
 * When ready for production:
 *   1. npx expo install react-native-purchases
 *   2. Replace the mock functions below with actual RevenueCat calls
 *   3. Set your REVENUECAT_API_KEY below
 *
 * Subscription tiers:
 *   Monthly:  $6.99/mo   → 'premium_monthly'
 *   Annual:   $39.99/yr  → 'premium_annual'  (save 52%)
 */

import { PRICING, PricingTier } from '../config/premiumFeatures';
import { isPremium, setPremiumStatus } from './premium';
import { trackEvent } from './analytics';

// ─── RevenueCat Configuration ───────────────────────────────────────────────

const _REVENUECAT_API_KEY = '__YOUR_REVENUECAT_API_KEY__';

// ─── Paywall Reason ─────────────────────────────────────────────────────────

export type PaywallReason =
  | 'unlimited_suggestions'
  | 'notes_limit'
  | 'special_pack'
  | 'analytics'
  | 'sos_mode'
  | 'saved_lines'
  | 'smart_insights'
  | 'deep_questions'
  | 'multi_partner'
  | 'general';

// ─── Initialize ─────────────────────────────────────────────────────────────

export async function initializeRevenueCat(): Promise<void> {
  // TODO: Replace with actual RevenueCat initialization
  // import Purchases from 'react-native-purchases';
  // Purchases.configure({ apiKey: _REVENUECAT_API_KEY });
  console.log('[Paywall] RevenueCat ready (mock mode)');
}

// ─── Subscription Status ────────────────────────────────────────────────────

export async function checkSubscriptionStatus(): Promise<boolean> {
  // TODO: Replace with RevenueCat check
  // const customerInfo = await Purchases.getCustomerInfo();
  // return customerInfo.entitlements.active['premium'] !== undefined;
  return isPremium();
}

// ─── Purchase ───────────────────────────────────────────────────────────────

export interface PurchaseResult {
  success: boolean;
  message: string;
}

export async function purchasePremium(tier: PricingTier): Promise<PurchaseResult> {
  const product = PRICING[tier];

  try {
    // TODO: Replace with actual RevenueCat purchase
    // const offerings = await Purchases.getOfferings();
    // const pkg = offerings.current?.availablePackages.find(...);
    // const { customerInfo } = await Purchases.purchasePackage(pkg);
    // if (customerInfo.entitlements.active['premium']) { ... }

    // Mock: activate premium locally
    await setPremiumStatus(true);
    await trackEvent('paywall_converted', { tier, price: product.price });
    return {
      success: true,
      message: `Premium activated! (${product.price}/${product.period})`,
    };
  } catch (e) {
    return { success: false, message: 'Purchase failed. Try again.' };
  }
}

// ─── Restore ────────────────────────────────────────────────────────────────

export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    // TODO: Replace with actual RevenueCat restore
    // const customerInfo = await Purchases.restorePurchases();
    // const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;

    const hasPremium = await isPremium();
    if (hasPremium) {
      return { success: true, message: 'Purchases restored! Premium is active.' };
    }
    return { success: false, message: 'No previous purchases found.' };
  } catch {
    return { success: false, message: 'Restore failed. Try again.' };
  }
}

// ─── Paywall Copy ───────────────────────────────────────────────────────────

export function getPaywallCopy(reason: PaywallReason): { title: string; subtitle: string } {
  switch (reason) {
    case 'unlimited_suggestions':
      return {
        title: 'Out of refreshes for today',
        subtitle: 'Upgrade to get unlimited suggestions. Never run out of things to say.',
      };
    case 'notes_limit':
      return {
        title: 'Memory Bank is full',
        subtitle: "Free users can store 10 notes. Upgrade to keep all your intel.",
      };
    case 'special_pack':
      return {
        title: 'Special occasion pack',
        subtitle: 'Birthday, anniversary & holiday packs are a Premium feature.',
      };
    case 'analytics':
      return {
        title: 'Premium insights',
        subtitle: 'Score history, weekly reports, and detailed analytics are Premium.',
      };
    default:
      return {
        title: 'Go Premium',
        subtitle: "Unlock everything. Be the boyfriend she's bragging about.",
      };
  }
}
