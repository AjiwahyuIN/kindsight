import {Outlet} from 'react-router';
import {DashboardHeader} from '../dashboard/DashboardHeader';
import '../../styles/pages/_dashboard-shell.scss';
import '../../styles/pages/_dashboard-react.scss';
import '../../styles/pages/_admin.scss';
import '../../styles/pages/_organization.scss';
export function OrganizationLayout(){return <div className="dashboard-shell portal-layout" lang="en"><DashboardHeader/><Outlet/></div>;}
