import { Outlet } from 'react-router-dom';
import useStylesheet from '../../hooks/useStylesheet';
import staffCss from '../../styles/staff.css?url';
import StaffSidebar from './StaffSidebar';
import StaffTopbar from './StaffTopbar';

// The administrative-staff shell: administrative_staff/styles.css + logo.css
// (a verbatim copy, route-mounted because of its body/table/select element
// rules), the sidebar every page carried inline, and the topbar logo.js
// rewrote on DOMContentLoaded. Pages render inside `.main`, exactly where the
// HTML put their header-row and cards.
export default function StaffPortal() {
  useStylesheet(staffCss);
  return (
    <div className="layout staff-portal">
      <StaffSidebar />
      <div className="main">
        <StaffTopbar />
        <Outlet />
      </div>
    </div>
  );
}
