/**
 * Centralized Cross-Tab Authentication Synchronization Channel.
 *
 * Coordinates authentication state changes (such as logout, session expiration,
 * and login) across multiple open browser tabs using the BroadcastChannel API,
 * with a resilient localStorage fallback for restricted or legacy environments.
 */

export const AUTH_CHANNEL_NAME = 'inspect:auth-sync' as const;

export const AUTH_SYNC_EVENTS = {
  LOGOUT: 'AUTH_LOGOUT',
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  LOGIN: 'AUTH_LOGIN',
} as const;

export type AuthSyncEventType =
  (typeof AUTH_SYNC_EVENTS)[keyof typeof AUTH_SYNC_EVENTS];

export interface AuthSyncPayload {
  id: string;
  type: AuthSyncEventType;
  timestamp: number;
}

const STORAGE_SYNC_KEY = 'inspect:auth-sync-event';

let channelInstance: BroadcastChannel | null = null;
let lastProcessedId: string | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }

  if (!channelInstance) {
    try {
      channelInstance = new BroadcastChannel(AUTH_CHANNEL_NAME);
    } catch {
      channelInstance = null;
    }
  }

  return channelInstance;
}

/**
 * Generate a unique event identifier to prevent duplicate processing
 * when both BroadcastChannel and storage events fire in the same tab.
 */
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Broadcast an authentication event to all other open tabs.
 */
export function broadcastAuthEvent(type: AuthSyncEventType): void {
  if (typeof window === 'undefined') return;

  const payload: AuthSyncPayload = {
    id: generateEventId(),
    type,
    timestamp: Date.now(),
  };

  // Primary mechanism: BroadcastChannel (instantaneous, modern)
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage(payload);
    } catch {
      // Fall through to storage fallback if postMessage encounters an error
    }
  }

  // Fallback / Cross-Context: localStorage event (triggers only in other tabs)
  try {
    localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(payload));
  } catch {
    // Gracefully handle private browsing or quota restrictions
  }
}

/**
 * Subscribe to authentication events broadcast by other tabs.
 * Automatically deduplicates messages if both BroadcastChannel and storage fire.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToAuthEvents(
  onEvent: (payload: AuthSyncPayload) => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handlePayload = (payload: AuthSyncPayload | null | undefined) => {
    if (!payload?.id || !payload?.type) return;

    // Validate type against known sync events
    const validTypes = Object.values(AUTH_SYNC_EVENTS);
    if (!validTypes.includes(payload.type)) return;

    // Deduplicate in case both BroadcastChannel and storage event fire for the same event
    if (payload.id === lastProcessedId) {
      return;
    }
    lastProcessedId = payload.id;

    onEvent(payload);
  };

  const onBroadcastMessage = (event: MessageEvent<AuthSyncPayload>) => {
    handlePayload(event?.data);
  };

  const onStorageChange = (event: StorageEvent) => {
    if (event.key !== STORAGE_SYNC_KEY || !event.newValue) return;
    try {
      const data = JSON.parse(event.newValue) as AuthSyncPayload;
      handlePayload(data);
    } catch {
      // Ignore malformed JSON
    }
  };

  const channel = getBroadcastChannel();
  if (channel) {
    channel.addEventListener('message', onBroadcastMessage);
  }

  window.addEventListener('storage', onStorageChange);

  return () => {
    if (channel) {
      channel.removeEventListener('message', onBroadcastMessage);
    }
    window.removeEventListener('storage', onStorageChange);
  };
}
