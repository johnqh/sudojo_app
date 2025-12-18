import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, Button, Heading, Text } from '@sudobility/components';
import { useSubscription, type Product } from '@/context/SubscriptionContext';
import { SubscriptionTile } from './SubscriptionTile';

interface SubscriptionPaywallProps {
  title?: string;
  message?: string;
  onSuccess?: () => void;
  onDismiss?: () => void;
}

// Helper to get period display name
const getPeriodDisplayName = (period: string | undefined): string => {
  switch (period) {
    case 'P1M':
      return 'month';
    case 'P3M':
      return '3 months';
    case 'P6M':
      return '6 months';
    case 'P1Y':
      return 'year';
    default:
      return 'period';
  }
};

// Helper to determine if a plan is "best value"
const isBestValuePlan = (product: Product): boolean => {
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
    availableProducts,
    isLoading,
    error,
    purchaseProduct,
    restorePurchases,
    initialize,
  } = useSubscription();

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Initialize subscription service
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auto-select annual plan if available
  useEffect(() => {
    if (availableProducts.length > 0 && !selectedProductId) {
      const annualPlan = availableProducts.find(p => isBestValuePlan(p));
      setSelectedProductId(annualPlan?.identifier || availableProducts[0].identifier);
    }
  }, [availableProducts, selectedProductId]);

  const handlePurchase = async () => {
    if (!selectedProductId) return;

    setIsPurchasing(true);
    const success = await purchaseProduct(selectedProductId);
    setIsPurchasing(false);

    if (success) {
      onSuccess?.();
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    const success = await restorePurchases();
    setIsPurchasing(false);

    if (success) {
      onSuccess?.();
    }
  };

  const features = getPlanFeatures(t);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          {/* Header */}
          <div className="text-center mb-6">
            <Heading level={2} size="xl" className="mb-2">
              {title || t('subscription.title')}
            </Heading>
            <Text color="muted">
              {message || t('subscription.message')}
            </Text>
          </div>

          {/* Loading State */}
          {isLoading && availableProducts.length === 0 && (
            <div className="text-center py-8">
              <Text color="muted">{t('common.loading')}</Text>
            </div>
          )}

          {/* Subscription Tiles */}
          {availableProducts.length > 0 && (
            <div
              className="grid gap-4 mb-6"
              style={{
                gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 240px), 1fr))`,
              }}
            >
              {availableProducts.map(product => {
                const isBestValue = isBestValuePlan(product);
                return (
                  <SubscriptionTile
                    key={product.identifier}
                    id={product.identifier}
                    title={product.title}
                    price={product.priceString}
                    period={product.period}
                    periodDisplayName={getPeriodDisplayName(product.period)}
                    features={features}
                    isSelected={selectedProductId === product.identifier}
                    onSelect={() => setSelectedProductId(product.identifier)}
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
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <Text className="text-red-600 dark:text-red-400">{error}</Text>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {onDismiss && (
              <Button
                variant="outline"
                onClick={onDismiss}
                disabled={isPurchasing}
                className="sm:flex-shrink-0"
              >
                {t('common.cancel')}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleRestore}
              disabled={isPurchasing || isLoading}
              className="sm:flex-shrink-0"
            >
              {t('subscription.restorePurchase')}
            </Button>

            <Button
              onClick={handlePurchase}
              disabled={!selectedProductId || isPurchasing || isLoading}
              className="flex-1"
            >
              {isPurchasing ? t('common.loading') : t('subscription.subscribe')}
            </Button>
          </div>

          {/* Terms */}
          <Text size="xs" color="muted" className="text-center mt-4">
            {t('subscription.terms')}
          </Text>
        </CardContent>
      </Card>
    </div>
  );
};
