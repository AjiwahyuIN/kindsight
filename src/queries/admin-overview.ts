import {useQuery} from '@tanstack/react-query';
import {usePrivateScope} from './auth';
import {getAdminOverview} from '../services/admin-overview';
export function useAdminOverview(){const scope=usePrivateScope('platform_admin');return useQuery({queryKey:[...scope.key,'admin','overview'],queryFn:({signal})=>getAdminOverview({signal}),enabled:scope.enabled});}
