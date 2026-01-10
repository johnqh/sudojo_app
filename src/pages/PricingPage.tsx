import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { useAuthStatus } from "@sudobility/auth-components";
import { useSubscriptionContext } from "@sudobility/subscription-components";
import {
  AppPricingPage,
  type PricingPageLabels,
  type PricingPageFormatters,
  type PricingProduct,
  type FAQItem,
  type EntitlementMap,
  type EntitlementLevels,
} from "@sudobility/building_blocks";
import { getInfoService } from "@sudobility/di";
import { InfoType } from "@sudobility/types";
import { useLocalizedNavigate } from "../hooks/useLocalizedNavigate";

// Package ID to entitlement mapping (from RevenueCat configuration)
const PACKAGE_ENTITLEMENT_MAP: EntitlementMap = {
  premium_yearly: "sudojo_premium",
  premium_monthly: "sudojo_premium",
};

// Entitlement to level mapping (higher = better tier)
const ENTITLEMENT_LEVELS: EntitlementLevels = {
  none: 0,
  sudojo_premium: 1,
};

export default function PricingPage() {
  const { t } = useTranslation();
  const { user, openModal } = useAuthStatus();
  const { products: rawProducts, currentSubscription, purchase } =
    useSubscriptionContext();
  const { navigate } = useLocalizedNavigate();

  const isAuthenticated = !!user;
  const hasActiveSubscription = currentSubscription?.isActive ?? false;

  // Use firebase user ID as subscription user ID (no entities in sudojo)
  const subscriptionUserId = user?.uid;

  // Map products to the format expected by AppPricingPage
  const products: PricingProduct[] = rawProducts.map((p) => ({
    identifier: p.identifier,
    title: p.title,
    price: p.price,
    priceString: p.priceString,
    period: p.period,
  }));

  const handlePlanClick = async (planIdentifier: string) => {
    if (isAuthenticated) {
      // Directly initiate purchase flow
      try {
        const result = await purchase(planIdentifier);
        if (result) {
          getInfoService().show(
            t("subscription.success.title", "Success"),
            t("subscription.success.message", "Subscription activated successfully!"),
            InfoType.SUCCESS,
            3000
          );
          // Navigate to home after successful purchase
          navigate("/");
        }
      } catch (err) {
        getInfoService().show(
          t("common.error", "Error"),
          err instanceof Error
            ? err.message
            : t("subscription.purchase.error", "Failed to complete purchase"),
          InfoType.ERROR,
          5000
        );
      }
    } else {
      openModal();
    }
  };

  const handleFreePlanClick = () => {
    if (isAuthenticated) {
      navigate("/");
    } else {
      openModal();
    }
  };

  // Static feature lists for pricing page
  const getProductFeatures = (packageId: string): string[] => {
    const entitlement = PACKAGE_ENTITLEMENT_MAP[packageId];
    if (entitlement === "sudojo_premium") {
      return [
        t("subscription.features.unlimitedPuzzles", "Unlimited puzzles"),
        t("subscription.features.allDifficulties", "All difficulty levels"),
        t("subscription.features.hints", "Smart hints"),
        t("subscription.features.noAds", "No advertisements"),
        t("subscription.features.statistics", "Detailed statistics"),
      ];
    }
    return [];
  };

  // Build labels object from translations
  const labels: PricingPageLabels = {
    // Header
    title: t("pricing.title", "Go Premium"),
    subtitle: t("pricing.subtitle", "Unlock all features and become a Sudoku master"),

    // Periods
    periodYear: t("subscription.periods.year", "/year"),
    periodMonth: t("subscription.periods.month", "/month"),
    periodWeek: t("subscription.periods.week", "/week"),

    // Billing period toggle
    billingMonthly: t("subscription.billingPeriod.monthly", "Monthly"),
    billingYearly: t("subscription.billingPeriod.yearly", "Yearly"),

    // Free tier
    freeTierTitle: t("pricing.free.name", "Free"),
    freeTierPrice: t("pricing.free.price", "$0"),
    freeTierFeatures: [
      t("subscription.features.dailyPuzzle", "Daily puzzle"),
      t("subscription.features.basicLevels", "Basic difficulty levels"),
      t("subscription.features.techniques", "Technique tutorials"),
    ],

    // Badges
    currentPlanBadge: t("subscription.badges.currentPlan", "Current Plan"),
    mostPopularBadge: t("pricing.badges.mostPopular", "Best Value"),

    // CTA buttons
    ctaLogIn: t("pricing.cta.logIn", "Log in to Continue"),
    ctaTryFree: t("pricing.cta.tryFree", "Try it for Free"),
    ctaUpgrade: t("pricing.cta.upgrade", "Upgrade"),

    // FAQ
    faqTitle: t("pricing.faq.title", "Frequently Asked Questions"),
  };

  // Build formatters object
  const formatters: PricingPageFormatters = {
    formatSavePercent: (percent: number) =>
      t("subscription.savePercent", "Save {{percent}}%", { percent }),
    getProductFeatures,
  };

  // FAQ items
  const faqItems: FAQItem[] = [
    {
      question: t("pricing.faq.q1", "What's included in Premium?"),
      answer: t(
        "pricing.faq.a1",
        "Premium unlocks unlimited puzzles, all difficulty levels, smart hints, and removes advertisements."
      ),
    },
    {
      question: t("pricing.faq.q2", "Can I cancel anytime?"),
      answer: t(
        "pricing.faq.a2",
        "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
      ),
    },
    {
      question: t("pricing.faq.q3", "Is there a free trial?"),
      answer: t(
        "pricing.faq.a3",
        "New subscribers may be eligible for a free trial. Check the subscription options for details."
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-theme-bg-primary">
      <Helmet>
        <title>{t("pricing.meta.title", "Pricing")} | Sudojo</title>
        <meta
          name="description"
          content={t(
            "pricing.meta.description",
            "Sudojo Premium - Unlock unlimited puzzles and all features"
          )}
        />
      </Helmet>
      <AppPricingPage
        products={products}
        isAuthenticated={isAuthenticated}
        hasActiveSubscription={hasActiveSubscription}
        currentProductIdentifier={currentSubscription?.productIdentifier}
        subscriptionUserId={subscriptionUserId}
        labels={labels}
        formatters={formatters}
        entitlementMap={PACKAGE_ENTITLEMENT_MAP}
        entitlementLevels={ENTITLEMENT_LEVELS}
        onPlanClick={handlePlanClick}
        onFreePlanClick={handleFreePlanClick}
        faqItems={faqItems}
      />
    </div>
  );
}
