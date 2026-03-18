/**
 * Paywall & In-App Purchase service — RevenueCat implementation.
 *
 * Product IDs (must match App Store Connect exactly):
 *   Monthly:  'premium_monthly'   $4.99/mo
 *   Annual:   'premium_annual'    $29.99/yr  (save 50%)
 *
 * Setup:
 *   1. Replace REVENUECAT_API_KEY below with your key from app.revenuecat.com
 *   2. Create products in App Store Connect then add them to a RevenueCat Offering
 *   3. Run pod install after adding react-native-purchases
 */

import { PRICING, PricingTier } from '../config/premiumFeatures';
import { isPremium, setPremiumStatus } from './premium';
import { trackEvent } from './analytics';

// ─── RevenueCat Configuration ───────────────────────────────────────────────

// ⚠️  Replace with your key from https://app.revenuecat.com → Project → API Keys
export const REVENUECAT_API_KEY: string = 'appl_HESqzhchdJRpLJGPGwMREFOFfjg';

const IS_CONFIGURED = REVENUECAT_API_KEY !== '__YOUR_REVENUECAT_API_KEY__';

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
  if (!IS_CONFIGURED) {
    console.log('[Paywall] RevenueCat not yet configured — running in mock mode');
    return;
  }
  try {
    const Purchases = (await import('react-native-purchases')).default;
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    console.log('[Paywall] RevenueCat initialized');
  } catch (e) {
    console.warn('[Paywall] RevenueCat init failed:', e);
  }
}

// ─── Subscription Status ────────────────────────────────────────────────────

export async function checkSubscriptionStatus(): Promise<boolean> {
  if (!IS_CONFIGURED) return isPremium();
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const customerInfo = await Purchases.getCustomerInfo();
    const active = customerInfo.entitlements.active['premium'] !== undefined;
    await setPremiumStatus(active);
    return active;
  } catch {
    return isPremium();
  }
}

// ─── Purchase ───────────────────────────────────────────────────────────────

export interface PurchaseResult {
  success: boolean;
  message: string;
}

export async function purchasePremium(tier: PricingTier): Promise<PurchaseResult> {
  const product = PRICING[tier];
  const productId = product.id;

  if (!IS_CONFIGURED) {
    // Mock mode for development
    await setPremiumStatus(true);
    await trackEvent('paywall_converted', { tier, price: product.price });
    return { success: true, message: `Premium activated! (${product.price}/${product.period})` };
  }

  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      (p) => p.product.identifier === productId,
    );
    if (!pkg) {
      return { success: false, message: 'Product not found. Try again later.' };
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const active = customerInfo.entitlements.active['premium'] !== undefined;
    if (active) {
      await setPremiumStatus(true);
      await trackEvent('paywall_converted', { tier, price: product.price });
      return { success: true, message: `Premium activated! You're all set 👑` };
    }
    return { success: false, message: 'Purchase incomplete. Please try again.' };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, message: 'Purchase cancelled.' };
    return { success: false, message: 'Purchase failed. Please try again.' };
  }
}

// ─── Restore ────────────────────────────────────────────────────────────────

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!IS_CONFIGURED) {
    const hasPremium = await isPremium();
    if (hasPremium) return { success: true, message: 'Purchases restored! Premium is active.' };
    return { success: false, message: 'No previous purchases found.' };
  }
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const customerInfo = await Purchases.restorePurchases();
    const active = customerInfo.entitlements.active['premium'] !== undefined;
    if (active) {
      await setPremiumStatus(true);
      return { success: true, message: 'Purchases restored! Premium is active 👑' };
    }
    return { success: false, message: 'No active subscription found.' };
  } catch {
    return { success: false, message: 'Restore failed. Please try again.' };
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
