import { getSession } from './auth';
import { ServiceError } from '../types';
export async function requireMockAdmin() { if (!await getSession()) throw new ServiceError('Your demo session has ended. Sign in again.', 'UNAUTHENTICATED', 401); }
