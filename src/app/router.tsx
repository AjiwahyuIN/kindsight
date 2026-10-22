import {AdminLayout} from '../components/admin/AdminLayout';
import {OrganizationLayout} from '../components/organization/OrganizationLayout';
import {StatusMessage} from '../components/ui/StatusMessage';
import {LoginPage} from '../pages/LoginPage';
import {RequireAdmin} from '../components/auth/RequireAdmin';
import {createBrowserRouter,Navigate,useLocation} from 'react-router';
import {canonicalPath} from '../services/route-paths';
import {AppLayout} from '../layouts/AppLayout';
import {FoundationPage} from '../pages/FoundationPage';
import {LandingPage} from '../pages/LandingPage';
import {NotFoundPage} from '../pages/NotFoundPage';
import {RouteErrorPage} from '../pages/RouteErrorPage';
function Alias(){const{pathname,search,hash}=useLocation();const to=canonicalPath(pathname,search,hash);return to&&to!==pathname+search+hash?<Navigate replace to={to}/>:<main id="main-content" className="container" tabIndex={-1}><NotFoundPage/></main>;}
function FoundationAlias(){const{search,hash}=useLocation();return <Navigate replace to={`/foundation${search}${hash}`}/>;}
export const router=createBrowserRouter([{
 element:<AppLayout/>,errorElement:<RouteErrorPage/>,hydrateFallbackElement:<StatusMessage kind="loading">Loading Kindsight…</StatusMessage>,children:[
  {index:true,element:<LandingPage/>},{path:'foundation',element:<FoundationPage/>},{path:'login',element:<LoginPage key="organization"/>},{path:'admin/login',element:<LoginPage key="platform" role="platform_admin"/>},
  {element:<RequireAdmin role="organization_user"/>,children:[
   {path:'app',element:<OrganizationLayout/>,children:[
    {index:true,element:<Alias/>},
    {path:'dashboard',lazy:async()=>({Component:(await import('../pages/DashboardPage')).DashboardPage})},
    {path:':entity',lazy:async()=>({Component:(await import('../pages/AdminRecordsPage')).AdminRecordsRoute})},
    {path:'*',element:<main id="main-content" className="portal-layout__content" tabIndex={-1}><NotFoundPage/></main>},
   ]},
  ]},
  {element:<RequireAdmin role="platform_admin"/>,children:[{path:'admin',element:<AdminLayout/>,children:[
   {index:true,element:<Navigate to="overview" replace/>},
   {path:'overview',lazy:async()=>({Component:(await import('../pages/AdminOverviewPage')).AdminOverviewPage})},
   {path:'users',lazy:async()=>({Component:(await import('../pages/UsersPage')).UsersPage})},
   {path:'organizations',lazy:async()=>({Component:(await import('../pages/OrganizationsPage')).OrganizationsPage})},
   {path:'demo-requests',lazy:async()=>({Component:(await import('../pages/DemoRequestsPage')).DemoRequestsPage})},
   {path:'content/:section',lazy:async()=>({Component:(await import('../pages/ContentEditorPage')).ContentEditorRoute})},
   {path:'*',element:<NotFoundPage/>},
  ]}]},
  ...['dashboard','dashboard.html','admin/donors','admin/campaigns','admin/donations','admin.html','content.html','login.html'].map(path=>({path,element:<Alias/>})),
  {path:'foundation.html',element:<FoundationAlias/>},{path:'*',element:<NotFoundPage/>},
 ],
}]);
