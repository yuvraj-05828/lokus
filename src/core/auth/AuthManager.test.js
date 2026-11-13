import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/plugin-deep-link', () => ({
  onOpenUrl: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./supabase.js', () => ({
  default: {
    auth: {
      onAuthStateChange: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

import authManager from './AuthManager.js';
import supabase from './supabase.js';

describe('AuthManager OAuth Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authManager, 'pollForAuthCallback').mockImplementation(() => Promise.resolve());
  });

  it('provides a descriptive error when Google provider is not enabled', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: null,
      error: {
        code: 400,
        error_code: 'validation_failed',
        message: 'Unsupported provider: provider is not enabled',
      },
    });

    await expect(authManager.signInWithGoogle()).rejects.toThrow(
      /Google Sign-In is not enabled on the authentication server/
    );
  });

  it('provides a descriptive error when Apple provider is not enabled', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: null,
      error: {
        code: 400,
        error_code: 'validation_failed',
        message: 'Unsupported provider: provider is not enabled',
      },
    });

    await expect(authManager.signInWithApple()).rejects.toThrow(
      /Apple Sign-In is not enabled on the authentication server/
    );
  });

  it('initiates OAuth flow with correct redirect and options', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?...' },
      error: null,
    });

    const result = await authManager.signInWithGoogle();

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://127.0.0.1:9080/auth-callback',
        skipBrowserRedirect: true,
      },
    });
    expect(result.url).toBe('https://accounts.google.com/o/oauth2/v2/auth?...');
  });
});
