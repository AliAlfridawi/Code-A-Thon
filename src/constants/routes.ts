export const SIGN_IN_ROUTE = '/sign-in';
export const SIGN_UP_ROUTE = '/sign-up';
export const ONBOARDING_ROUTE = '/onboarding';
export const USER_DASHBOARD_ROUTE = '/my-dashboard';
export const USER_DASHBOARD_ROUTE_SEGMENT = USER_DASHBOARD_ROUTE.slice(1);
export const MEMBERS_ROUTE = '/members';
export const MESSAGES_ROUTE = '/messages';
export const HELP_ROUTE = '/help';

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
