import { Link, type LinkProps } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { isLanguageSupported, SUPPORTED_LANGUAGES } from '@/i18n';

interface LocalizedLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  state?: Record<string, unknown>;
}

export function LocalizedLink({ to, state, children, ...props }: LocalizedLinkProps) {
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang && isLanguageSupported(lang) ? lang : 'en';

  // If path already starts with language prefix, use as is
  const localizedPath = SUPPORTED_LANGUAGES.some(l => to.startsWith(`/${l}/`) || to === `/${l}`)
    ? to
    : `/${currentLang}${to.startsWith('/') ? to : `/${to}`}`;

  return (
    <Link to={localizedPath} state={state} {...props}>
      {children}
    </Link>
  );
}
