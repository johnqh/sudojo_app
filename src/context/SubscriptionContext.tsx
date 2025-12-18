import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type {
  Purchases,
  PurchasesConfig,
  Package,
  CustomerInfo,
  PurchaseParams,
  Offerings,
} from '@revenuecat/purchases-js';
import { useAuth } from './AuthContext';

// Dynamic import for RevenueCat SDK (loaded only when needed)
let RevenueCatSDK: typeof import('@revenuecat/purchases-js') | null = null;
const loadRevenueCatSDK = async () => {
  if (!RevenueCatSDK) {
    RevenueCatSDK = await import('@revenuecat/purchases-js');
  }
  return RevenueCatSDK;
};

export interface Product {
  identifier: string;
  productId?: string;
  price: string;
  priceString: string;
  title: string;
  description: string;
  period?: string;
  introPrice?: string;
  introPricePeriod?: string;
  freeTrialPeriod?: string;
}

export interface Subscription {
  isActive: boolean;
  expirationDate?: Date;
  purchaseDate?: Date;
  productIdentifier?: string;
  willRenew?: boolean;
}

export interface SubscriptionContextType {
  subscription: Subscription;
  availableProducts: Product[];
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  purchaseProduct: (identifier: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refresh: () => Promise<void>;
  getPackageByIdentifier: (identifier: string) => Package | undefined;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Get RevenueCat API key from environment
const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || '';

// Development mode flag
const IS_DEVELOPMENT = !REVENUECAT_API_KEY || REVENUECAT_API_KEY === 'your_revenuecat_api_key_here';

// Helper function to convert RevenueCat package to our Product interface
const convertPackageToProduct = (pkg: Package): Product => {
  const product = pkg.rcBillingProduct;
  const subscriptionOption = product?.defaultSubscriptionOption;

  return {
    identifier: pkg.identifier,
    productId: product?.identifier || undefined,
    price: product?.currentPrice?.amountMicros
      ? (product.currentPrice.amountMicros / 1000000).toFixed(2)
      : '0',
    priceString: product?.currentPrice?.formattedPrice || '$0',
    title: product?.title || pkg.identifier,
    description: product?.description || '',
    period: product?.normalPeriodDuration || undefined,
    introPrice: subscriptionOption?.introPrice?.price?.formattedPrice || undefined,
    introPricePeriod: subscriptionOption?.introPrice?.periodDuration || undefined,
    freeTrialPeriod: subscriptionOption?.trial?.periodDuration || undefined,
  };
};

// Helper function to parse CustomerInfo into Subscription
const parseCustomerInfo = (customerInfo: CustomerInfo): Subscription => {
  const hasActiveEntitlement = Object.keys(customerInfo.entitlements.active).length > 0;
  const activeEntitlement = Object.values(customerInfo.entitlements.active)[0];

  if (hasActiveEntitlement && activeEntitlement) {
    return {
      isActive: true,
      expirationDate: activeEntitlement.expirationDate
        ? new Date(activeEntitlement.expirationDate)
        : undefined,
      purchaseDate: activeEntitlement.latestPurchaseDate
        ? new Date(activeEntitlement.latestPurchaseDate)
        : undefined,
      productIdentifier: activeEntitlement.productIdentifier,
      willRenew: activeEntitlement.willRenew,
    };
  }

  return { isActive: false };
};

// Store purchases instance globally
let purchasesInstance: Purchases | null = null;

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription>({ isActive: false });
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [currentOffering, setCurrentOffering] = useState<Offerings['current'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initialize RevenueCat with Firebase user ID
   */
  const initialize = useCallback(async (): Promise<void> => {
    if (!user) return;
    if (isInitialized && purchasesInstance) return;

    try {
      setIsLoading(true);
      setError(null);

      if (IS_DEVELOPMENT) {
        console.warn('[Subscription] RevenueCat API key not configured. Subscription features disabled.');
        setAvailableProducts([]);
        setSubscription({ isActive: false });
      } else {
        const SDK = await loadRevenueCatSDK();

        const config: PurchasesConfig = {
          apiKey: REVENUECAT_API_KEY,
          appUserId: user.uid,
        };

        purchasesInstance = SDK.Purchases.configure(config);

        // Set email attribute if available
        if (user.email && purchasesInstance) {
          try {
            await purchasesInstance.setAttributes({ email: user.email });
          } catch (emailError) {
            console.warn('[Subscription] Failed to set email attribute:', emailError);
          }
        }

        // Fetch offerings and customer info
        await Promise.all([fetchOfferings(), fetchCustomerInfo()]);
      }

      setIsInitialized(true);
    } catch (err) {
      console.error('[Subscription] Error initializing RevenueCat:', err);
      setError('Failed to initialize subscription service');
      setSubscription({ isActive: false });
      setAvailableProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isInitialized]);

  /**
   * Fetch available offerings from RevenueCat
   */
  const fetchOfferings = async (): Promise<void> => {
    if (!purchasesInstance) return;

    try {
      const offerings: Offerings = await purchasesInstance.getOfferings();

      if (offerings.current) {
        setCurrentOffering(offerings.current);
        const products = offerings.current.availablePackages.map(convertPackageToProduct);
        setAvailableProducts(products);
      } else {
        setError('No subscription plans available');
      }
    } catch (err) {
      console.error('[Subscription] Error fetching offerings:', err);
      setError('Failed to load subscription plans');
    }
  };

  /**
   * Fetch customer info from RevenueCat
   */
  const fetchCustomerInfo = async (): Promise<void> => {
    if (!purchasesInstance) return;

    try {
      const info = await purchasesInstance.getCustomerInfo();
      const sub = parseCustomerInfo(info);
      setSubscription(sub);
    } catch (err) {
      console.error('[Subscription] Error fetching customer info:', err);
      setError('Failed to load subscription status');
    }
  };

  /**
   * Refresh subscription status
   */
  const refresh = async (): Promise<void> => {
    if (IS_DEVELOPMENT) return;

    try {
      setError(null);
      await fetchCustomerInfo();
      await fetchOfferings();
    } catch (err) {
      console.error('[Subscription] Error refreshing:', err);
      setError('Failed to refresh subscription status');
    }
  };

  /**
   * Purchase a subscription product
   */
  const purchaseProduct = async (identifier: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      if (IS_DEVELOPMENT) {
        // Simulate a successful purchase in development
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSubscription({
          isActive: true,
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          purchaseDate: new Date(),
          productIdentifier: identifier,
          willRenew: true,
        });
        return true;
      }

      if (!purchasesInstance) {
        throw new Error('Subscription service not initialized');
      }

      const packageToPurchase = getPackageByIdentifier(identifier);
      if (!packageToPurchase) {
        throw new Error(`Package not found: ${identifier}`);
      }

      const purchaseParams: PurchaseParams = {
        rcPackage: packageToPurchase,
        ...(user?.email ? { customerEmail: user.email } : {}),
      };

      const result = await purchasesInstance.purchase(purchaseParams);
      const sub = parseCustomerInfo(result.customerInfo);
      setSubscription(sub);

      return sub.isActive;
    } catch (err) {
      console.error('[Subscription] Error purchasing:', err);

      if (err && typeof err === 'object' && 'errorCode' in err) {
        const errorCode = (err as { errorCode: number }).errorCode;
        switch (errorCode) {
          case 1:
            setError('Purchase cancelled');
            break;
          case 2:
            setError('Store problem occurred. Please try again later.');
            break;
          case 3:
            setError('Purchase not allowed on this device');
            break;
          case 7:
            setError('Network error. Please check your connection.');
            break;
          default:
            setError('Purchase failed. Please try again.');
        }
      } else {
        setError('An unexpected error occurred');
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Restore previous purchases
   */
  const restorePurchases = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      if (IS_DEVELOPMENT) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setError('No previous purchases found');
        return false;
      }

      if (!purchasesInstance) {
        throw new Error('Subscription service not initialized');
      }

      const customerInfo = await purchasesInstance.getCustomerInfo();
      const sub = parseCustomerInfo(customerInfo);
      setSubscription(sub);

      if (sub.isActive) {
        return true;
      } else {
        setError('No previous purchases found.');
        return false;
      }
    } catch (err) {
      console.error('[Subscription] Error restoring:', err);
      setError('Failed to restore purchases. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get a package by its identifier
   */
  const getPackageByIdentifier = (identifier: string): Package | undefined => {
    if (!currentOffering) return undefined;
    return currentOffering.availablePackages.find(pkg => pkg.identifier === identifier);
  };

  // Auto-initialize when user is available
  useEffect(() => {
    if (user && !user.isAnonymous) {
      initialize();
    } else {
      // Reset state when user is not available or is anonymous
      setSubscription({ isActive: false });
      setAvailableProducts([]);
      setIsInitialized(false);
      purchasesInstance = null;
    }
  }, [user, initialize]);

  const value: SubscriptionContextType = {
    subscription,
    availableProducts,
    isLoading,
    error,
    initialize,
    purchaseProduct,
    restorePurchases,
    refresh,
    getPackageByIdentifier,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
