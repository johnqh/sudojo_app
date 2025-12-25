# Firebase Auth Components Library

## Overview

Create a reusable Firebase Auth component library at `~/0xmail/mail_box_components/packages/auth-components` with full i18n support (all text passed as props).

## Package Structure

```
auth-components/
├── src/
│   ├── index.ts                    # Public exports
│   ├── types.ts                    # All type definitions
│   ├── lib/
│   │   └── cn.ts                   # Tailwind merge utility
│   ├── context/
│   │   └── auth-provider.tsx       # AuthProvider + useAuthStatus hook
│   ├── components/
│   │   ├── auth-modal.tsx          # Modal wrapper
│   │   ├── auth-inline.tsx         # Inline/on-screen version
│   │   ├── auth-action.tsx         # TopBar component (avatar/login btn)
│   │   ├── auth-content.tsx        # Shared auth UI (forms, providers)
│   │   ├── forms/
│   │   │   ├── email-signin-form.tsx
│   │   │   ├── email-signup-form.tsx
│   │   │   └── forgot-password-form.tsx
│   │   └── shared/
│   │       ├── provider-buttons.tsx
│   │       ├── avatar.tsx
│   │       └── user-menu.tsx
│   └── __tests__/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## Implementation Steps

### Step 1: Create Package Skeleton
1. Copy `subscription-components` folder structure to `auth-components`
2. Update `package.json` with name `@sudobility/auth-components`
3. Copy VSCode, ESLint, Prettier configs from mail_box_components root
4. Update CI/CD workflow to include auth-components in matrix

### Step 2: Define Types (`src/types.ts`)

**Text Props (i18n):**
```typescript
interface AuthTexts {
  signInTitle: string;
  createAccount: string;
  resetPassword: string;
  signIn: string;
  signUp: string;
  logout: string;
  login: string;
  continueWithGoogle: string;
  continueWithApple: string;
  continueWithEmail: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  forgotPassword: string;
  noAccount: string;
  haveAccount: string;
  or: string;
  loading: string;
  // ... (20+ keys total)
}

interface AuthErrorTexts {
  'auth/user-not-found': string;
  'auth/wrong-password': string;
  'auth/invalid-credential': string;
  'auth/email-already-in-use': string;
  // ... all Firebase error codes
  default: string;
}
```

**Firebase Config:**
```typescript
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  // optional: storageBucket, messagingSenderId, measurementId
}

type FirebaseAuthConfig =
  | { type: 'config'; config: FirebaseConfig }
  | { type: 'instance'; auth: Auth };  // Use existing Firebase instance
```

**Provider Config:**
```typescript
type AuthProviderType = 'google' | 'apple' | 'email';

interface AuthProvidersConfig {
  providers: AuthProviderType[];
  enableAnonymous?: boolean;
}
```

### Step 3: Implement AuthProvider + useAuthStatus

**Hook API:**
```typescript
function useAuthStatus(): {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;

  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;

  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}
```

**Provider Props:**
```typescript
interface AuthProviderProps {
  children: ReactNode;
  firebaseConfig: FirebaseAuthConfig;
  providerConfig: AuthProvidersConfig;
  texts: AuthTexts;
  errorTexts: AuthErrorTexts;
  callbacks?: {
    onSignIn?: (user: AuthUser) => void;
    onSignOut?: () => void;
    onError?: (error: Error, code?: string) => void;
  };
}
```

### Step 4: Implement AuthModal

```typescript
interface AuthModalProps {
  open?: boolean;              // Controlled mode
  onClose?: () => void;
  initialMode?: 'select' | 'email-signin' | 'email-signup' | 'forgot-password';
  providers?: AuthProviderType[];  // Override enabled providers
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}
```

### Step 5: Implement AuthInline

```typescript
interface AuthInlineProps {
  initialMode?: AuthMode;
  providers?: AuthProviderType[];
  showTitle?: boolean;
  compact?: boolean;
  variant?: 'card' | 'flat' | 'bordered';
  onSuccess?: () => void;
}
```

### Step 6: Implement AuthAction (TopBar Component)

```typescript
interface AuthMenuItem {
  id: string;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  dividerAfter?: boolean;
}

interface AuthActionProps {
  loginButtonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  avatarSize?: number;
  menuItems?: AuthMenuItem[];  // Custom items above "Disconnect"
  showUserInfo?: boolean;
  dropdownAlign?: 'left' | 'right';
}
```

**Behavior:**
- Not logged in → Shows "Login" button → Opens AuthModal
- Logged in → Shows avatar (photo URL with initials fallback) → Shows dropdown menu
- Dropdown contains: user info, custom menuItems, divider, "Disconnect"

### Step 7: Implement Avatar Component

```typescript
interface AvatarProps {
  user: AuthUser;
  size?: number;
}
```

**Logic:**
1. Try to load `user.photoURL`
2. On error or no URL → Show initials from `displayName` or `email`
3. Initials: First letter of first + last name, or first 2 chars

## Component Interaction Flow

```
AuthProvider (context)
    │
    ├── useAuthStatus hook
    │       ├── user, loading, error state
    │       ├── auth methods (signIn*, signOut, etc.)
    │       └── modal controls (isModalOpen, openModal, closeModal)
    │
    ├── AuthModal ──────────┐
    │                       │
    └── AuthInline ─────────┼──→ AuthContent (shared)
                            │        ├── ProviderButtons (Google, Apple)
                            │        ├── EmailSignInForm
                            │        ├── EmailSignUpForm
                            │        └── ForgotPasswordForm
                            │
    AuthAction ─────────────┘
        ├── Login button → openModal()
        └── Avatar + UserMenu → signOut()
```

## Consumer Usage Example

```tsx
import {
  AuthProvider,
  AuthModal,
  AuthAction,
  useAuthStatus,
} from '@sudobility/auth-components';

function App() {
  const authTexts = {
    signIn: t('auth.signIn'),
    // ... all texts from i18n
  };

  const authErrorTexts = {
    'auth/user-not-found': t('auth.errors.userNotFound'),
    // ... all error texts
  };

  return (
    <AuthProvider
      firebaseConfig={{ type: 'config', config: myFirebaseConfig }}
      providerConfig={{ providers: ['google', 'apple', 'email'] }}
      texts={authTexts}
      errorTexts={authErrorTexts}
    >
      <TopBar>
        <AuthAction
          menuItems={[
            { id: 'profile', label: t('menu.profile'), onClick: goToProfile },
            { id: 'settings', label: t('menu.settings'), onClick: goToSettings, dividerAfter: true },
          ]}
        />
      </TopBar>
      <AuthModal />
    </AuthProvider>
  );
}

// Dedicated login page
function LoginPage() {
  return <AuthInline variant="card" onSuccess={() => navigate('/dashboard')} />;
}
```

## Files to Create/Modify

### New Files (auth-components package)
- `packages/auth-components/package.json`
- `packages/auth-components/tsconfig.json`
- `packages/auth-components/vite.config.ts`
- `packages/auth-components/vitest.config.ts`
- `packages/auth-components/src/index.ts`
- `packages/auth-components/src/types.ts`
- `packages/auth-components/src/lib/cn.ts`
- `packages/auth-components/src/context/auth-provider.tsx`
- `packages/auth-components/src/components/auth-modal.tsx`
- `packages/auth-components/src/components/auth-inline.tsx`
- `packages/auth-components/src/components/auth-action.tsx`
- `packages/auth-components/src/components/auth-content.tsx`
- `packages/auth-components/src/components/forms/email-signin-form.tsx`
- `packages/auth-components/src/components/forms/email-signup-form.tsx`
- `packages/auth-components/src/components/forms/forgot-password-form.tsx`
- `packages/auth-components/src/components/shared/provider-buttons.tsx`
- `packages/auth-components/src/components/shared/avatar.tsx`
- `packages/auth-components/src/components/shared/user-menu.tsx`

### Modified Files
- `.github/workflows/ci-cd.yml` - Add auth-components to matrix

## Reference Files
- `/Users/johnhuang/0xmail/mail_box_components/packages/subscription-components/` - Package template
- `/Users/johnhuang/sudojo/sudojo_app/src/context/AuthContext.tsx` - Auth logic reference
- `/Users/johnhuang/sudojo/sudojo_app/src/components/auth/` - UI component reference

## Dependencies

```json
{
  "peerDependencies": {
    "@heroicons/react": "^2.2.0",
    "@sudobility/components": "^4.0.36",
    "@sudobility/design": "^1.1.14",
    "firebase": "^10.0.0 || ^11.0.0 || ^12.0.0",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```
