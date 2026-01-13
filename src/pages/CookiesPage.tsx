import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { CONSTANTS } from '@/config/constants';
import { AppTextPage } from '@sudobility/building_blocks';
import type { TextPageContent } from '@sudobility/building_blocks';

export default function CookiesPage() {
  const { t } = useTranslation('cookies');
  const appName = CONSTANTS.APP_NAME;

  const text: TextPageContent = {
    title: t('title', 'Cookie Policy'),
    lastUpdated: t('lastUpdated', { date: '{{date}}', defaultValue: 'Last updated: {{date}}' }),
    sections: [
      {
        title: t('sections.whatAreCookies.title', 'What Are Cookies'),
        content: t('sections.whatAreCookies.content', {
          defaultValue: 'Cookies are small text files that websites store on your device to remember information about your visit. They are widely used to make websites work efficiently and provide information to site owners.',
        }),
      },
      {
        title: t('sections.ourApproach.title', 'Our Cookie-Free Approach'),
        description: t('sections.ourApproach.description', {
          defaultValue: `${appName} is designed with privacy in mind. We minimize the use of cookies and tracking technologies:`,
          appName,
        }),
        items: t('sections.ourApproach.items', {
          returnObjects: true,
          defaultValue: [
            'No third-party advertising cookies',
            'No cross-site tracking',
            'Minimal use of essential cookies for functionality',
            'Local storage for game progress and preferences',
          ],
        }) as string[],
      },
      {
        title: t('sections.whatWeUse.title', 'What We Use'),
        subsections: [
          {
            title: t('sections.whatWeUse.localStorage.title', 'Local Storage'),
            items: t('sections.whatWeUse.localStorage.items', {
              returnObjects: true,
              defaultValue: [
                'Theme preference (light/dark mode)',
                'Language preference',
                'Game progress and statistics',
                'Puzzle solving history',
                'User settings and preferences',
              ],
            }) as string[],
          },
          {
            title: t('sections.whatWeUse.sessionStorage.title', 'Session Storage'),
            items: t('sections.whatWeUse.sessionStorage.items', {
              returnObjects: true,
              defaultValue: [
                'Current puzzle state',
                'Temporary game data during your session',
              ],
            }) as string[],
          },
        ],
      },
      {
        title: t('sections.thirdParty.title', 'Third-Party Services'),
        description: t('sections.thirdParty.description', {
          defaultValue: 'We use essential third-party services that may use their own cookies:',
        }),
        items: t('sections.thirdParty.items', {
          returnObjects: true,
          defaultValue: [
            'Firebase for authentication and data sync',
            'RevenueCat for subscription management',
            'Analytics (anonymized, no personal tracking)',
          ],
        }) as string[],
      },
      {
        title: t('sections.yourControl.title', 'Your Control'),
        description: t('sections.yourControl.description', {
          defaultValue: 'You have full control over cookies and local storage:',
        }),
        items: t('sections.yourControl.items', {
          returnObjects: true,
          defaultValue: [
            'Clear local storage through your browser settings',
            'Use private/incognito browsing mode',
            'Disable cookies in your browser (may affect functionality)',
            'Delete your account to remove all stored data',
          ],
        }) as string[],
      },
      {
        title: t('sections.changes.title', 'Changes to This Policy'),
        content: t('sections.changes.content', {
          defaultValue: 'We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page.',
        }),
      },
    ],
    contact: {
      title: t('sections.contact.title', 'Questions'),
      description: t('sections.contact.description', 'If you have questions about our cookie practices, please contact us:'),
      info: {
        emailLabel: 'Email:',
        email: CONSTANTS.SUPPORT_EMAIL,
        websiteLabel: 'Website:',
        websiteUrl: `https://${CONSTANTS.APP_DOMAIN}`,
      },
    },
  };

  return (
    <>
      <Helmet>
        <title>{t('meta.title', { defaultValue: `Cookie Policy - ${appName}`, appName })}</title>
        <meta
          name="description"
          content={t('meta.description', {
            defaultValue: `Cookie policy for ${appName}. Learn about our privacy-focused approach.`,
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
