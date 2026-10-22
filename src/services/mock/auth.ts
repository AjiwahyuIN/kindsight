import { demoAdmin, demoPassword } from '../../data/auth';
import { ServiceError, type ServiceOptions } from '../types';
import type { AdminAccount, SignInInput } from '../auth-types';
const key = 'kindsight.mock-session.v1';
export async function getSession({ signal }: ServiceOptions = {}): Promise<AdminAccount | null> {
  signal?.throwIfAborted();
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const marker = JSON.parse(raw);
    if (marker.version !== 1 || marker.id !== demoAdmin.id || !Number.isFinite(marker.expires) || marker.expires <= Date.now()) {
      sessionStorage.removeItem(key); return null;
    }
    return { ...demoAdmin };
  } catch { throw new ServiceError('Local preview session could not be read. Please retry.', 'SESSION_UNAVAILABLE', 400); }
}
export async function signIn(input: SignInInput): Promise<AdminAccount> {
  if (input.email.trim().toLowerCase() !== demoAdmin.email || input.password !== demoPassword) throw new ServiceError('Email or password is incorrect. Use the demo account shown below.', 'INVALID_CREDENTIALS', 400);
  try { sessionStorage.setItem(key, JSON.stringify({ version: 1, id: demoAdmin.id, expires: Date.now() + 8 * 60 * 60 * 1000 })); }
  catch { throw new ServiceError('Browser storage is unavailable. Enable session storage to use this preview.', 'SESSION_UNAVAILABLE', 400); }
  return { ...demoAdmin };
}
export async function signOut(): Promise<null> {
  try { sessionStorage.removeItem(key); }
  catch { throw new ServiceError('Could not clear your preview session. Please retry.', 'SESSION_UNAVAILABLE', 400); }
  return null;
}
