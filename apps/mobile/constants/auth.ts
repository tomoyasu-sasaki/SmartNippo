export const AUTH_CONSTANTS = {
  SCREEN_TITLES: {
    SIGN_UP: 'Create Account',
    SIGN_IN: 'Welcome Back',
  },
  DESCRIPTIONS: {
    SIGN_UP: 'Sign up to start managing your daily reports',
    SIGN_IN: 'Sign in to your account',
  },
  FORM_LABELS: {
    EMAIL: 'Email',
    PASSWORD: 'Password',
  },
  PLACEHOLDERS: {
    EMAIL: 'Enter your email',
    PASSWORD: 'Enter your password',
  },
  BUTTONS: {
    SIGN_UP: 'Sign Up',
    SIGN_IN: 'Sign In',
    LOADING: 'Loading...',
    GOOGLE_AUTH: 'Continue with Google',
  },
  LINKS: {
    HAVE_ACCOUNT: 'Already have an account? ',
    NO_ACCOUNT: "Don't have an account? ",
  },
  ERRORS: {
    REQUIRED_FIELDS: 'Please fill in all fields',
    AUTH_FAILED: 'Authentication failed',
    GOOGLE_AUTH_FAILED: 'Google authentication failed',
  },
  SUCCESS: {
    ACCOUNT_CREATED: 'Account created! Please check your email for verification.',
  },
} as const;
