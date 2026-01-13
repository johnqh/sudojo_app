import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStatus } from "@sudobility/auth-components";
import { getFirebaseAuth } from "@sudobility/auth_lib";
import { LoginPage as LoginPageComponent } from "@sudobility/building_blocks";
import { CONSTANTS } from "../config/constants";
import { Section } from "@/components/layout/Section";

function LoginPage() {
  const { user, loading } = useAuthStatus();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const auth = getFirebaseAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate(`/${lang || "en"}`, { replace: true });
    }
  }, [user, loading, navigate, lang]);

  if (loading) {
    return (
      <Section spacing="5xl" className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </Section>
    );
  }

  if (!auth) {
    return (
      <Section spacing="5xl" className="min-h-[60vh] flex items-center justify-center">
        <p className="text-red-600">Firebase not configured</p>
      </Section>
    );
  }

  return (
    <Section spacing="none" fullWidth>
      <LoginPageComponent
        appName={CONSTANTS.APP_NAME}
        logo={<img src="/logo.png" alt={CONSTANTS.APP_NAME} className="h-12" />}
        auth={auth}
        onSuccess={() => navigate(`/${lang || "en"}`, { replace: true })}
      />
    </Section>
  );
}

export default LoginPage;
