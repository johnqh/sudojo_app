import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSubscriptionContext } from "@sudobility/subscription-components";
import { useAuthStatus } from "@sudobility/auth-components";
import {
  AppSubscriptionsPage,
  type SubscriptionPageLabels,
  type SubscriptionPageFormatters,
} from "@sudobility/building_blocks";
import { getInfoService } from "@sudobility/di";
import { InfoType } from "@sudobility/types";

// Package ID to entitlement mapping (from RevenueCat configuration)
const PACKAGE_ENTITLEMENT_MAP: Record<string, string> = {
  premium_yearly: "sudojo_premium",
  premium_monthly: "sudojo_premium",
};

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const { user } = useAuthStatus();
  const subscriptionContext = useSubscriptionContext();

  // Use firebase user ID as subscription user ID (no entities in sudojo)
  const subscriptionUserId = user?.uid;

  const handlePurchaseSuccess = () => {
    getInfoService().show(
      t("subscription.success.title", "Success"),
      t("subscription.success.message", "Subscription activated successfully!"),
      InfoType.SUCCESS,
      3000
    );
  };

  const handleRestoreSuccess = () => {
    getInfoService().show(
      t("subscription.restore.title", "Restored"),
      t("subscription.restore.message", "Purchases restored successfully!"),
      InfoType.SUCCESS,
      3000
    );
  };

  const handleError = (title: string, message: string) => {
    getInfoService().show(title, message, InfoType.ERROR, 5000);
  };

  const handleWarning = (title: string, message: string) => {
    getInfoService().show(title, message, InfoType.WARNING, 5000);
  };

  // Memoize labels to prevent unnecessary re-renders
  const labels: SubscriptionPageLabels = useMemo(
    () => ({
      title: t("subscription.title", "Subscription"),
      errorTitle: t("common.error", "Error"),
      purchaseError: t("subscription.purchase.error", "Failed to complete purchase"),
      restoreError: t("subscription.restore.error", "Failed to restore purchases"),
      restoreNoPurchases: t("subscription.restore.noPurchases", "No purchases to restore"),

      // Periods
      periodYear: t("subscription.periods.year", "/year"),
      periodMonth: t("subscription.periods.month", "/month"),
      periodWeek: t("subscription.periods.week", "/week"),

      // Billing period toggle
      billingMonthly: t("subscription.billingPeriod.monthly", "Monthly"),
      billingYearly: t("subscription.billingPeriod.yearly", "Yearly"),

      // Rate limits
      unlimited: t("subscription.unlimited", "Unlimited"),
      unlimitedRequests: t("subscription.unlimitedPuzzles", "Unlimited puzzles"),

      // Current status
      currentStatusLabel: t("subscription.currentStatus.label", "Current Status"),
      statusActive: t("subscription.currentStatus.active", "Premium Member"),
      statusInactive: t("subscription.currentStatus.inactive", "Free Plan"),
      statusInactiveMessage: t(
        "subscription.currentStatus.inactiveMessage",
        "Upgrade to unlock all puzzles and features"
      ),
      labelPlan: t("subscription.currentStatus.plan", "Plan"),
      labelPremium: t("subscription.currentStatus.premium", "Premium"),
      labelExpires: t("subscription.currentStatus.expires", "Expires"),
      labelWillRenew: t("subscription.currentStatus.willRenew", "Will Renew"),
      labelMonthlyUsage: t("subscription.currentStatus.monthlyUsage", "Monthly Usage"),
      labelDailyUsage: t("subscription.currentStatus.dailyUsage", "Daily Usage"),
      yes: t("common.yes", "Yes"),
      no: t("common.no", "No"),

      // Buttons
      buttonSubscribe: t("subscription.subscribe", "Subscribe"),
      buttonPurchasing: t("common.loading", "Processing..."),
      buttonRestore: t("subscription.restorePurchase", "Restore Purchases"),
      buttonRestoring: t("subscription.restoring", "Restoring..."),

      // Empty states
      noProducts: t("subscription.noProducts", "No subscription products available"),
      noProductsForPeriod: t(
        "subscription.noProductsForPeriod",
        "No products available for this billing period"
      ),

      // Free tier
      freeTierTitle: t("subscription.freeTier.title", "Free"),
      freeTierPrice: t("subscription.freeTier.price", "$0"),
      freeTierFeatures: [
        t("subscription.features.dailyPuzzle", "Daily puzzle"),
        t("subscription.features.basicLevels", "Basic difficulty levels"),
        t("subscription.features.techniques", "Technique tutorials"),
      ],

      // Badges
      currentPlanBadge: t("subscription.badges.currentPlan", "Current Plan"),
    }),
    [t]
  );

  // Memoize formatters to prevent unnecessary re-renders
  const formatters: SubscriptionPageFormatters = useMemo(
    () => ({
      formatHourlyLimit: (limit: string) =>
        t("subscription.rateLimits.hourly", "{{limit}}/hour", { limit }),
      formatDailyLimit: (limit: string) =>
        t("subscription.rateLimits.daily", "{{limit}}/day", { limit }),
      formatMonthlyLimit: (limit: string) =>
        t("subscription.rateLimits.monthly", "{{limit}}/month", { limit }),
      formatTrialDays: (count: number) =>
        t("subscription.trial.days", "{{count}} day free trial", { count }),
      formatTrialWeeks: (count: number) =>
        t("subscription.trial.weeks", "{{count}} week free trial", { count }),
      formatTrialMonths: (count: number) =>
        t("subscription.trial.months", "{{count}} month free trial", { count }),
      formatSavePercent: (percent: number) =>
        t("subscription.savePercent", "Save {{percent}}%", { percent }),
      formatIntroNote: (price: string) =>
        t("subscription.introNote", "Then {{price}}", { price }),
    }),
    [t]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <AppSubscriptionsPage
        subscription={subscriptionContext}
        subscriptionUserId={subscriptionUserId}
        labels={labels}
        formatters={formatters}
        packageEntitlementMap={PACKAGE_ENTITLEMENT_MAP}
        onPurchaseSuccess={handlePurchaseSuccess}
        onRestoreSuccess={handleRestoreSuccess}
        onError={handleError}
        onWarning={handleWarning}
      />
    </div>
  );
}
