import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { useAuthStatus } from "@sudobility/auth-components";
import { useSubscriptionContext } from "@sudobility/subscription-components";
import {
  AppPricingPage,
  type PricingPageLabels,
  type PricingPageFormatters,
  type FAQItem,
} from "@sudobility/building_blocks";
import { getInfoService } from "@sudobility/di";
import { InfoType } from "@sudobility/types";
import { useLocalizedNavigate } from "../hooks/useLocalizedNavigate";
import { useBuildingBlocksAnalytics } from "../hooks/useBuildingBlocksAnalytics";

// Offer ID for subscription_lib hooks
const OFFER_ID = import.meta.env.VITE_REVENUECAT_OFFER_ID;

// Package ID to entitlement mapping (for feature lookup)
const PACKAGE_ENTITLEMENT_MAP: Record<string, string> = {
  premium_yearly: "sudojo_premium",
  premium_monthly: "sudojo_premium",
};

export default function PricingPage() {
  const { t } = useTranslation();
  const { user, openModal } = useAuthStatus();
  const { purchase } = useSubscriptionContext();
  const { navigate } = useLocalizedNavigate();
  const onTrack = useBuildingBlocksAnalytics();

  const isAuthenticated = !!user;

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
    <>
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
        offerId={OFFER_ID}
        isAuthenticated={isAuthenticated}
        labels={labels}
        formatters={formatters}
        onPlanClick={handlePlanClick}
        onFreePlanClick={handleFreePlanClick}
        faqItems={faqItems}
        onTrack={onTrack}
      />
    </>
  );
}
