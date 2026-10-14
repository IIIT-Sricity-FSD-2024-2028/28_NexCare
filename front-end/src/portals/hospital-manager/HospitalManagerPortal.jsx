import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import useStylesheet from '../../hooks/useStylesheet';
import hmCss from '../../styles/hospital-manager.css?url';
import { HmProvider, useHm } from './HmContext';
import HmSidebar from './HmSidebar';
import { RegistrationSuccessModal, StaffRegisterModal } from './StaffRegistration';
import RenewalModal from './RenewalModal';

// hospital_manager/dashboard.html: one page whose twelve #sections were
// switched by switchTab(); each is a nested route now. The shell keeps the
// sidebar, the top header (title per section), the subscription warning
// banner and the two header-launched modals.
//
// switchTab() wrote the titles into `.dashboard-header h1` / `.header-desc`,
// selectors that do not exist in the HTML (the header is #pageTitle /
// #pageSubtitle), so the HTML page said "Hospital Overview" on every tab.
// The SPA shows the titles the table intended.
export const TITLES = {
  overview: { title: 'Hospital Operations Overview', subtitle: 'Real-time operational summary and metrics.' },
  leaves: { title: 'Doctor Leave Approvals', subtitle: 'Review, approve, or reject leave requests.' },
  schedules: { title: 'Schedule Approvals', subtitle: 'Hospital roster verification.' },
  staff: { title: 'Hospital Staff Directory', subtitle: 'Manage medical and administrative personnel.' },
  setup: { title: 'Registration, Setup & Assets', subtitle: 'Configure hospital infrastructure, register staff, view assets, and manage inventory.' },
  'inventory-approvals': { title: 'Inventory Requisitions', subtitle: 'Approve or reject stock requests.' },
  ambulance: { title: 'Ambulance Fleet Status', subtitle: 'Fleet readiness and emergency dispatch.' },
  subscription: { title: 'Subscription & License', subtitle: 'Hospital license and renewal management.' },
  revenue: { title: 'Revenue & Collections', subtitle: 'Collections and unpaid balance tracking.' },
  supervision: { title: 'Staff Supervision', subtitle: 'Desk and operational accountability.' },
  support: { title: 'Regional Support Tickets', subtitle: 'Escalations and compliance.' },
  feedback: { title: 'Patient Feedback & Issues', subtitle: 'Patient issue resolution.' },
};

const COLLAPSE_KEY = 'nexcare_sidebar_collapsed';
const isMobile = () => window.innerWidth < 768;

/** toggleSidebar() / closeMobileSidebar() / restoreSidebar() — the body classes dashboard.css keys on. */
function useSidebarState() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return !isMobile() && localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    document.body.classList.toggle('mobile-sidebar-open', mobileOpen);
    return () => { document.body.classList.remove('sidebar-collapsed', 'mobile-sidebar-open'); };
  }, [collapsed, mobileOpen]);

  const toggle = useCallback(() => {
    if (isMobile()) { setMobileOpen((o) => !o); return; }
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* ignore */ }
      return !c;
    });
  }, []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  return { toggle, closeMobile };
}

function SubscriptionBanner() {
  const { subscription: sub, openRenewalModal } = useHm();
  if (!sub) return null;
  const icon = <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
  let body = null;
  if (sub.warningLevel === 'expired') {
    body = (
      <div className="alert-banner alert-banner-expired">
        <div className="alert-banner-content">{icon}<div><strong>Hospital Registration Expired:</strong> Your NexCare subscription ended on {sub.subscriptionExpiryDate}. Please renew immediately to maintain active hospital services.</div></div>
        <button type="button" className="alert-btn alert-btn-danger" onClick={openRenewalModal}>Renew Subscription (12 Months)</button>
      </div>
    );
  } else if (sub.warningLevel === 'urgent_7') {
    body = (
      <div className="alert-banner alert-banner-urgent">
        <div className="alert-banner-content">{icon}<div><strong>URGENT: Registration Renewal Due:</strong> Only {sub.daysRemaining} day{sub.daysRemaining === 1 ? '' : 's'} remaining before your hospital license expires on {sub.subscriptionExpiryDate}.</div></div>
        <button type="button" className="alert-btn alert-btn-warning" onClick={openRenewalModal}>Renew License Now</button>
      </div>
    );
  } else if (sub.warningLevel === 'warning_30') {
    body = (
      <div className="alert-banner alert-banner-warning">
        <div className="alert-banner-content">{icon}<div><strong>Renewal Notice:</strong> Your NexCare annual registration expires in {sub.daysRemaining} days ({sub.subscriptionExpiryDate}).</div></div>
        <button type="button" className="alert-btn alert-btn-warning" onClick={openRenewalModal}>Renew (+12 Months)</button>
      </div>
    );
  }
  if (!body) return null;
  return <div className="alert-banner-container">{body}</div>;
}

function Shell() {
  const { pathname } = useLocation();
  const { openStaffModal } = useHm();
  const { toggle, closeMobile } = useSidebarState();
  const slug = pathname.split('/').filter(Boolean)[1] || 'overview';
  const heading = TITLES[slug] || TITLES.overview;

  return (
    <div className="layout hm-portal">
      <HmSidebar onNavigate={closeMobile} />
      <div className="sidebar-overlay" onClick={closeMobile} />

      <main className="main-content">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <button type="button" className="btn-icon" onClick={toggle} title="Toggle Sidebar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', marginTop: 4 }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <div className="header-title">
              <h1>{heading.title}</h1>
              <p>{heading.subtitle}</p>
            </div>
          </div>
          <div className="header-actions">
            <button type="button" className="btn-primary" onClick={openStaffModal}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              <span>+ Register Staff</span>
            </button>
            <span className="status-pill status-active">● Hospital Manager Online</span>
          </div>
        </header>

        <SubscriptionBanner />

        <section className="tab-content active-tab" key={slug}>
          <Outlet />
        </section>
      </main>

      <StaffRegisterModal />
      <RegistrationSuccessModal />
      <RenewalModal />
    </div>
  );
}

export default function HospitalManagerPortal() {
  useStylesheet(hmCss);
  return (
    <HmProvider>
      <Shell />
    </HmProvider>
  );
}
