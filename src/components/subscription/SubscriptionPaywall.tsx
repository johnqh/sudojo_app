import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Heading, Text, Card, CardContent } from '@sudobility/components';
import {
  useSubscriptionContext,
  SubscriptionLayout,
  SubscriptionTile,
  type SubscriptionProduct,
} from '@sudobility/subscription-components';

interface SubscriptionPaywallProps {
  title?: string;
  message?: string;
  onSuccess?: () => void;
  onDismiss?: () => void;
}

// Helper to get period display label
const getPeriodLabel = (period: string | undefined, t: (key: string) => string): string => {
  switch (period) {
    case 'P1M':
      return `/${t('subscription.periods.month')}`;
    case 'P3M':
      return `/${t('subscription.periods.quarter')}`;
    case 'P6M':
      return `/${t('subscription.periods.halfYear')}`;
    case 'P1Y':
      return `/${t('subscription.periods.year')}`;
    default:
      return '';
  }
};

// Helper to determine if a plan is "best value"
const isBestValuePlan = (product: SubscriptionProduct): boolean => {
  return product.period === 'P1Y' || product.identifier.includes('annual') || product.identifier.includes('yearly');
};

// Helper to get features for a plan
const getPlanFeatures = (t: (key: string) => string): string[] => {
  return [
    t('subscription.features.unlimitedPuzzles'),
    t('subscription.features.allDifficulties'),
    t('subscription.features.hints'),
    t('subscription.features.noAds'),
  ];
};

export const SubscriptionPaywall: React.FC<SubscriptionPaywallProps> = ({
  title,
  message,
  onSuccess,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const {
    products,
    isLoading,
    error,
    purchase,
    restore,
  } = useSubscriptionContext();

  // Compute default product ID (prefer annual/best value plan)
  const defaultProductId = useMemo(() => {
    if (products.length === 0) return null;
    const annualPlan = products.find(p => isBestValuePlan(p));
    return annualPlan?.identifier || products[0].identifier;
  }, [products]);

  const [userSelectedProductId, setUserSelectedProductId] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Use user selection if set, otherwise use default
  const selectedProductId = userSelectedProductId ?? defaultProductId;

  const handlePurchase = async () => {
    if (!selectedProductId) return;

    setIsPurchasing(true);
    const success = await purchase(selectedProductId);
    setIsPurchasing(false);

    if (success) {
      onSuccess?.();
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    const success = await restore();
    setIsPurchasing(false);

    if (success) {
      onSuccess?.();
    }
  };

  const features = getPlanFeatures(t);

  // Loading state when no products yet
  if (isLoading && products.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <Heading level={2} size="xl" className="mb-2">
                {title || t('subscription.title')}
              </Heading>
              <Text color="muted">
                {message || t('subscription.message')}
              </Text>
            </div>
            <div className="text-center py-8">
              <Text color="muted">{t('common.loading')}</Text>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <SubscriptionLayout
        title={title || t('subscription.title')}
        headerContent={
          <div className="text-center mb-6">
            <Text color="muted">
              {message || t('subscription.message')}
            </Text>
          </div>
        }
        primaryAction={{
          label: isPurchasing ? t('common.loading') : t('subscription.subscribe'),
          onClick: handlePurchase,
          disabled: !selectedProductId || isPurchasing || isLoading,
          loading: isPurchasing,
        }}
        secondaryAction={{
          label: t('subscription.restorePurchase'),
          onClick: handleRestore,
          disabled: isPurchasing || isLoading,
        }}
        error={error}
        footerContent={
          onDismiss ? (
            <div className="mt-4">
              <button
                onClick={onDismiss}
                disabled={isPurchasing}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {t('common.cancel')}
              </button>
            </div>
          ) : undefined
        }
      >
        {products.map(product => {
          const isBestValue = isBestValuePlan(product);
          return (
            <SubscriptionTile
              key={product.identifier}
              id={product.identifier}
              title={product.title}
              price={product.priceString}
              periodLabel={getPeriodLabel(product.period, t)}
              features={features}
              isSelected={selectedProductId === product.identifier}
              onSelect={() => setUserSelectedProductId(product.identifier)}
              isBestValue={isBestValue}
              topBadge={
                isBestValue
                  ? { text: t('subscription.bestValue'), color: 'purple' }
                  : undefined
              }
              discountBadge={
                isBestValue
                  ? { text: t('subscription.savePercent', { percent: '50' }), isBestValue: true }
                  : undefined
              }
            />
          );
        })}
      </SubscriptionLayout>

      {/* Terms */}
      <Text size="xs" color="muted" className="text-center mt-4">
        {t('subscription.terms')}
      </Text>
    </div>
  );
};
