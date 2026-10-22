import type { AdminAccount } from '../services/auth-types';
// Public showcase credentials, never a real admin identity or password.
export const demoAdmin: AdminAccount = { id: 'showcase-admin', name: 'Kindsight Admin', email: 'admin@example.test',role:'organization_user',organization:{id:'mock-organization',name:'Mock organization'} };
export const demoPassword = 'KindsightDemo1!';
