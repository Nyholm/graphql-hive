export const ALLOWED_ENVIRONMENT_VARIABLES = [
  'NODE_ENV',
  'ENVIRONMENT',
  'APP_BASE_URL',
  'GRAPHQL_PUBLIC_ENDPOINT',
  'GRAPHQL_PUBLIC_SUBSCRIPTION_ENDPOINT',
  'GRAPHQL_PUBLIC_ORIGIN',
  'GA_TRACKING_ID',
  'DOCS_URL',
  'STRIPE_PUBLIC_KEY',
  'RELEASE',
  'AUTH_REQUIRE_EMAIL_VERIFICATION',
  'GRAPHQL_PERSISTED_OPERATIONS',
  'ZENDESK_SUPPORT',
  'INTEGRATION_SLACK',
  'AUTH_GITHUB',
  'AUTH_GOOGLE',
  'AUTH_OKTA',
  'AUTH_OKTA_HIDDEN',
  'AUTH_ORGANIZATION_OIDC',
  'SENTRY',
  'SENTRY_DSN',
  'MEMBER_ROLES_DEADLINE',
] as const;

export type AllowedEnvironmentVariables = (typeof ALLOWED_ENVIRONMENT_VARIABLES)[number];
