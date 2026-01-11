import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import ScreenContainer from '@/components/layout/ScreenContainer';
import { CONSTANTS } from '@/config/constants';
import { AppTextPage } from '@sudobility/building_blocks';
import type { TextPageContent } from '@sudobility/building_blocks';

export default function TermsPage() {
  const { t } = useTranslation('terms');
  const appName = CONSTANTS.APP_NAME;

  // Build the text content from i18n translations
  const text: TextPageContent = {
    title: t('title', 'Terms of Service'),
    lastUpdated: t('lastUpdated', { date: '{{date}}', defaultValue: 'Last updated: {{date}}' }),
    sections: [
      // Section 1: Acceptance of Terms
      {
        title: t('sections.acceptance.title', 'Acceptance of Terms'),
        content: t('sections.acceptance.content', {
          defaultValue: `By accessing or using ${appName}, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.`,
          appName,
        }),
      },
      // Section 2: Description of Service
      {
        title: t('sections.service.title', 'Description of Service'),
        content: t('sections.service.content', {
          defaultValue: `${appName} is a Sudoku learning application designed to help users master Sudoku solving techniques through progressive learning, daily challenges, and skill-based levels. The service includes free and premium subscription tiers.`,
          appName,
        }),
      },
      // Section 3: User Accounts
      {
        title: t('sections.accounts.title', 'User Accounts'),
        description: t('sections.accounts.description', 'When creating an account, you agree to:'),
        items: t('sections.accounts.items', {
          returnObjects: true,
          defaultValue: [
            'Provide accurate and complete information',
            'Maintain the security of your account credentials',
            'Accept responsibility for all activities under your account',
            'Notify us immediately of any unauthorized access',
          ],
        }) as string[],
      },
      // Section 4: Acceptable Use
      {
        title: t('sections.usage.title', 'Acceptable Use'),
        description: t('sections.usage.description', { defaultValue: `When using ${appName}, you agree not to:`, appName }),
        items: t('sections.usage.items', {
          returnObjects: true,
          defaultValue: [
            'Attempt to circumvent subscription restrictions or access premium features without payment',
            'Use automated systems or bots to interact with the service',
            'Reverse engineer or attempt to extract source code',
            'Share your account credentials with others',
            'Engage in any activity that disrupts the service',
          ],
        }) as string[],
      },
      // Section 5: Subscriptions and Payments
      {
        title: t('sections.subscriptions.title', 'Subscriptions and Payments'),
        content: t('sections.subscriptions.content', {
          defaultValue: 'Premium features require a paid subscription. Subscriptions are billed in advance on a recurring basis. You may cancel at any time, and your subscription will remain active until the end of the current billing period. Refunds are handled according to app store policies.',
        }),
      },
      // Section 6: Intellectual Property
      {
        title: t('sections.ip.title', 'Intellectual Property'),
        content: t('sections.ip.content', {
          defaultValue: `${appName} and its original content, features, and functionality are owned by ${CONSTANTS.COMPANY_NAME} and are protected by international copyright and trademark laws. The Sudoku puzzles, learning techniques, and visual design are proprietary to our service.`,
          appName,
        }),
      },
      // Section 7: Limitation of Liability
      {
        title: t('sections.liability.title', 'Limitation of Liability'),
        content: t('sections.liability.content', {
          defaultValue: `${appName} is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.`,
          appName,
        }),
      },
      // Section 8: Termination
      {
        title: t('sections.termination.title', 'Termination'),
        content: t('sections.termination.content', {
          defaultValue: 'We may terminate or suspend your account at any time for violations of these terms. Upon termination, your right to use the service will immediately cease. You may also delete your account at any time.',
        }),
      },
      // Section 9: Changes to Terms
      {
        title: t('sections.changes.title', 'Changes to Terms'),
        content: t('sections.changes.content', {
          defaultValue: 'We reserve the right to modify these terms at any time. We will notify you of significant changes via email or through the app. Continued use after changes constitutes acceptance of the new terms.',
        }),
      },
    ],
    contact: {
      title: t('sections.contact.title', 'Contact Us'),
      description: t('sections.contact.description', 'For questions about these Terms of Service, please contact us:'),
      info: {
        emailLabel: t('sections.contact.email', 'Email:'),
        email: CONSTANTS.SUPPORT_EMAIL,
        websiteLabel: t('sections.contact.website', 'Website:'),
        websiteUrl: `https://${CONSTANTS.APP_DOMAIN}`,
      },
    },
  };

  return (
    <ScreenContainer>
      <Helmet>
        <title>{t('meta.title', { defaultValue: `Terms of Service - ${appName}`, appName })}</title>
        <meta
          name="description"
          content={t('meta.description', {
            defaultValue: `Terms of Service for ${appName}. Read our terms and conditions.`,
            appName,
          })}
        />
      </Helmet>

      <AppTextPage
        text={text}
        lastUpdatedDate={new Date().toLocaleDateString()}
      />
    </ScreenContainer>
  );
}
