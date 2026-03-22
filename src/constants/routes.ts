export const ROOT_ROUTE = '/';
export const SIGN_IN_ROUTE = '/sign-in';
export const SIGN_UP_ROUTE = '/sign-up';
export const ONBOARDING_ROUTE = '/onboarding';
export const USER_DASHBOARD_ROUTE = '/my-dashboard';
export const USER_DASHBOARD_ROUTE_SEGMENT = USER_DASHBOARD_ROUTE.slice(1);
export const ADMIN_PAIRING_ROUTE = '/admin-pairing';
export const PAIRING_ROUTE = '/pairing';
export const SETTINGS_ROUTE = '/settings';
export const MEMBERS_ROUTE = '/members';
export const MESSAGES_ROUTE = '/messages';
export const HELP_ROUTE = '/help';
export const ADMIN_EMAIL = 'alfridawiali@gmail.com';

export function isAdminEmail(email?: string | null) {
  return email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function getDefaultSignedInRoute(email?: string | null) {
  return isAdminEmail(email) ? ROOT_ROUTE : USER_DASHBOARD_ROUTE;
}

export function buildMemberProfileRoute(memberId: string) {
  return `${MEMBERS_ROUTE}/${memberId}`;
}

export function buildMessagesRoute(options?: {
  pairingId?: string;
  conversationId?: string;
}) {
  if (!options?.pairingId && !options?.conversationId) {
    return MESSAGES_ROUTE;
  }

  const searchParams = new URLSearchParams();

  if (options.pairingId) {
    searchParams.set('pairing', options.pairingId);
  }

  if (options.conversationId) {
    searchParams.set('conversation', options.conversationId);
  }

  return `${MESSAGES_ROUTE}?${searchParams.toString()}`;
}
