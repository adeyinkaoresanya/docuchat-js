// src/events/auth.events.ts
import { appEvents } from '../lib/events';

// ── Define the event names as constants ─────────────
export const AUTH_EVENTS = {
  USER_REGISTERED: 'auth:user-registered',
  USER_LOGGED_IN: 'auth:user-logged-in',
  USER_LOGGED_OUT: 'auth:user-logged-out',
  TOKEN_REFRESHED: 'auth:token-refreshed',
  LOGIN_FAILED: 'auth:login-failed',
} as const;


// ── Register listeners ─────────────────────────────

// Listener 1: Log signups for analytics
appEvents.on(AUTH_EVENTS.USER_REGISTERED, async (user) => {
  try {
    console.info('User registered', {
      userId: user.id,
      email: user.email,
      tier: user.tier,
      registeredAt: new Date().toISOString(),
    });
  } catch (error) {
    // Log but don't crash. This is a side effect.
    console.error('Failed to log signup:', error);
  }
});

// Listener 2: Create a default welcome conversation
appEvents.on(AUTH_EVENTS.USER_REGISTERED, async (user) => {
  try {
    console.info('Welcome conversation pending model creation', {
      userId: user.id,
      title: 'Welcome to DocuChat',
    });
  } catch (error) {
    console.error('Failed to create welcome conversation:', error);
  }
});

// Listener 3: Log login events (useful for security audits)
appEvents.on(AUTH_EVENTS.USER_LOGGED_IN, async (data) => {
  try {
    console.info('User logged in', {
      userId: data.userId,
      deviceInfo: data.deviceInfo,
      loginAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log login:', error);
  }
});

// Listener 4: Track failed login attempts
appEvents.on(AUTH_EVENTS.LOGIN_FAILED, async (data) => {
  try {
    console.warn(
      `Failed login attempt for ${data.email} from ${data.deviceInfo}`
    );
    // In Week 3 we'll add rate limiting based on failed attempts
  } catch (error) {
    console.error('Failed to log failed login:', error);
  }
});

