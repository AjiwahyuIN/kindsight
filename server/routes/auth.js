import { Router } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import { hashPassword, verifyPassword } from '../auth/password.js';

export const cookieName = 'kindsight_session';
export const tokenHash = token => createHash('sha256').update(token).digest('hex');
const sessionAge = 8 * 60 * 60 * 1000;
// Compute an equally costly password check for unknown/inactive users.
const dummyPassword = hashPassword(randomBytes(32).toString('hex'));

function readToken(request) {
  const entry = (request.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`));
  const value = entry?.slice(cookieName.length + 1);
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value) ? value : null;
}

export function createAuth({ repository, origins, secureCookie = false, loginLimit = 10 }) {
  const router = Router();
  const cookieOptions = { httpOnly: true, secure: secureCookie, sameSite: 'strict', path: '/' };
  const publicUser = user => ({id:user.id,email:user.email,name:user.name,role:user.role,organization:user.role==='organization_user'?{id:user.organization_id,name:user.organization_name}:null});
  const error = (response, status, code, message) => response.status(status).json({ error: { code, message } });
  const protectType = type => (request, response, next) => {
    if (!origins.includes(request.get('origin')) || request.get('X-Kindsight-Request') !== '1' || !request.is(type)) {
      return error(response, 403, 'REQUEST_REJECTED', 'Request origin or security headers are invalid.');
    }
    next();
  };
  const protectMutation=protectType('application/json');
  const protectUpload=protectType('multipart/form-data');
  const requireSession = async (request, response, next) => {
    const token = readToken(request);
    if (!token) return error(response, 401, 'UNAUTHENTICATED', 'Please sign in to continue.');
    try {
      const admin = await repository.findSession(tokenHash(token));
      if (!admin) {
        response.clearCookie(cookieName, cookieOptions);
        return error(response, 401, 'UNAUTHENTICATED', 'Your session has expired. Please sign in again.');
      }
      request.user = publicUser(admin);
      next();
    } catch (cause) { next(cause); }
  };
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: loginLimit, standardHeaders: 'draft-8', legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (request, response) => error(response, 429, 'LOGIN_LIMIT', 'Too many sign-in attempts. Please try again later.'),
  });
  router.post('/login', protectMutation, limiter, async (request, response) => {
    const { email, password } = request.body || {};
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || password.length < 1 || password.length > 128) {
      return error(response, 400, 'INVALID_CREDENTIALS_INPUT', 'Enter a valid email and password.');
    }
    const admin = await repository.findAdmin(email.trim().toLowerCase());
    const available=admin?.active && (admin.role==='platform_admin' || (admin.role==='organization_user' && admin.organization_active));
    const valid = await verifyPassword(password, available ? admin.password_hash : await dummyPassword);
    if (!available || !valid) return error(response, 401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    await repository.pruneSessions();
    const token = randomBytes(32).toString('hex');
    const saved=await repository.saveSession({ hash: tokenHash(token), adminId: admin.id, expiresAt: new Date(Date.now() + sessionAge) });
    if(!saved)return error(response,401,'INVALID_CREDENTIALS','Email or password is incorrect.');
    const previous = readToken(request);
    if (previous) await repository.deleteSession(tokenHash(previous));
    response.cookie(cookieName, token, { ...cookieOptions, maxAge: sessionAge });
    response.json({ data: { user: publicUser(admin) } });
  });
  router.get('/me', requireSession, (request, response) => response.json({ data: { user: request.user } }));
  router.post('/logout', protectMutation, async (request, response) => {
    const token = readToken(request);
    if (token) await repository.deleteSession(tokenHash(token));
    response.clearCookie(cookieName, cookieOptions);
    response.status(204).end();
  });
  const requireRole=role=>(request,response,next)=>request.user?.role===role && (role!=='organization_user'||request.user.organization?.id)?next():error(response,403,'FORBIDDEN','This account cannot access this workspace.');
  return {router,requireSession,requireRole,protectMutation,protectUpload};
}
