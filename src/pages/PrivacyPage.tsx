import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { CONSTANTS } from '@/config/constants';
import { AppTextPage } from '@sudobility/building_blocks';
import type { TextPageContent } from '@sudobility/building_blocks';

export default function PrivacyPage() {
  const { t } = useTranslation('privacy');
  const appName = CONSTANTS.APP_NAME;

  // Build the text content from i18n translations
  const text: TextPageContent = {
    title: t('title', 'Privacy Policy'),
    lastUpdated: t('lastUpdated', { date: '{{date}}', defaultValue: 'Last updated: {{date}}' }),
    sections: [
      // Introduction
      {
        title: t('sections.introduction.title', 'Introduction'),
        content: t('sections.introduction.content', {
          defaultValue: `Welcome to ${appName}. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our Sudoku learning application.`,
          appName,
        }),
      },
      // Information We Collect
      {
        title: t('sections.collection.title', 'Information We Collect'),
        subsections: [
          {
            title: t('sections.collection.youProvide.title', 'Information You Provide'),
            items: t('sections.collection.youProvide.items', {
              returnObjects: true,
              defaultValue: [
                'Account information (email address, name)',
                'Game progress and statistics',
                'Preferences and settings',
                'Payment information (processed securely by our payment provider)',
              ],
            }) as string[],
          },
          {
            title: t('sections.collection.automatic.title', 'Information Collected Automatically'),
            items: t('sections.collection.automatic.items', {
              returnObjects: true,
              defaultValue: [
                'Device and browser information',
                'IP address and location data',
                'Usage patterns and analytics',
                'Game performance metrics',
              ],
            }) as string[],
          },
        ],
      },
      // How We Use
      {
        title: t('sections.usage.title', 'How We Use Your Information'),
        description: t('sections.usage.description', 'We use the information we collect to:'),
        items: t('sections.usage.items', {
          returnObjects: true,
          defaultValue: [
            'Provide and improve our Sudoku learning experience',
            'Track your progress and personalize difficulty levels',
            'Process subscriptions and payments',
            'Send important updates about the service',
            'Analyze usage patterns to enhance our techniques and puzzles',
          ],
        }) as string[],
      },
      // Information Sharing
      {
        title: t('sections.sharing.title', 'Information Sharing'),
        description: t('sections.sharing.description', 'We may share your information in the following circumstances:'),
        items: t('sections.sharing.items', {
          returnObjects: true,
          defaultValue: [
            'With service providers who assist in our operations',
            'When required by law or legal process',
            'To protect our rights and safety',
            'With your consent',
          ],
        }) as string[],
      },
      // Data Security
      {
        title: t('sections.security.title', 'Data Security'),
        description: t('sections.security.description', 'We implement appropriate security measures:'),
        items: t('sections.security.items', {
          returnObjects: true,
          defaultValue: [
            'Encryption of data in transit and at rest',
            'Regular security assessments',
            'Access controls and authentication',
            'Secure cloud infrastructure',
          ],
        }) as string[],
      },
      // Data Retention
      {
        title: t('sections.retention.title', 'Data Retention'),
        content: t('sections.retention.content', {
          defaultValue: 'We retain your personal information for as long as your account is active or as needed to provide you services. Your game progress is stored to enable seamless learning across sessions. You can request deletion of your account and associated data at any time.',
        }),
      },
      // Privacy Rights
      {
        title: t('sections.rights.title', 'Your Privacy Rights'),
        description: t('sections.rights.description', 'You have the right to:'),
        items: t('sections.rights.items', {
          returnObjects: true,
          defaultValue: [
            'Access your personal information',
            'Correct inaccurate data',
            'Request deletion of your data',
            'Export your game progress',
            'Opt out of marketing communications',
          ],
        }) as string[],
      },
      // International Transfers
      {
        title: t('sections.transfers.title', 'International Data Transfers'),
        content: t('sections.transfers.content', {
          defaultValue: 'Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.',
        }),
      },
      // Children's Privacy
      {
        title: t('sections.children.title', "Children's Privacy"),
        content: t('sections.children.content', {
          defaultValue: 'Our service is designed for users of all ages. We do not knowingly collect personal information from children under 13 without parental consent.',
        }),
      },
      // Cookies
      {
        title: t('sections.cookies.title', 'Cookies and Local Storage'),
        content: t('sections.cookies.content', {
          defaultValue: 'We use essential cookies and local storage to maintain your session, save your game progress, and remember your preferences. We do not use third-party tracking cookies for advertising purposes.',
        }),
      },
      // Changes
      {
        title: t('sections.changes.title', 'Changes to This Policy'),
        content: t('sections.changes.content', {
          defaultValue: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.',
        }),
      },
    ],
    contact: {
      title: t('sections.contact.title', 'Contact Us'),
      description: t('sections.contact.description', 'If you have any questions about this Privacy Policy, please contact us:'),
      info: {
        emailLabel: t('sections.contact.email', 'Email:'),
        email: CONSTANTS.SUPPORT_EMAIL,
        websiteLabel: t('sections.contact.website', 'Website:'),
        websiteUrl: `https://${CONSTANTS.APP_DOMAIN}`,
        dpoLabel: t('sections.contact.dpo', 'Data Protection Officer:'),
        dpoEmail: CONSTANTS.SUPPORT_EMAIL,
      },
      gdprNotice: {
        title: t('sections.contact.gdprTitle', 'GDPR Rights'),
        content: t('sections.contact.gdprContent', {
          defaultValue: 'If you are in the European Union, you have additional rights under GDPR including the right to lodge a complaint with a supervisory authority.',
        }),
      },
    },
  };

  return (
    <>
      <Helmet>
        <title>{t('meta.title', { defaultValue: `Privacy Policy - ${appName}`, appName })}</title>
        <meta
          name="description"
          content={t('meta.description', {
            defaultValue: `Privacy policy for ${appName}. Learn how we collect, use, and protect your data.`,
            appName,
          })}
        />
      </Helmet>

      <AppTextPage
        text={text}
        lastUpdatedDate={new Date().toLocaleDateString()}
      />
    </>
  );
}
