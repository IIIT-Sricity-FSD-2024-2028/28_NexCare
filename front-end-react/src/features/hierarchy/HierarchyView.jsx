import { useEffect, useMemo, useState } from 'react';
import { Hierarchy } from '../../api';
import { PageHeader } from '../../components/ui';
import './hierarchy.css';

/**
 * Organisation hierarchy — the port of front-end/shared/hierarchy-view.js.
 *
 * The Superuser and the Regional Officer see the *same* view of a *different*
 * subtree. The backend decides which subtree from the token, so this component
 * draws whatever it is handed and never filters: if a hospital reaches the
 * browser, the caller was entitled to it.
 *
 * The page supplies the heading and description (the HTML page-header); the
 * search box, the scope banner, the count tiles and the tree are all here.
 */

/** Node types that start collapsed — anything below a hospital. */
const COLLAPSED_BELOW = ['hospital'];

const TYPE_LABELS = { platform: 'Platform', region: 'Region', hospital: 'Hospital', department: 'Dept', user: 'Person' };

function typeLabel(type) {
  return TYPE_LABELS[type] || type;
}

function metaChips(node) {
  const m = node.meta || {};
  const chips = [];
  if (node.type === 'hospital') {
    chips.push(`${m.headcount || 0} staff`);
    chips.push(`${m.doctors || 0} doctors`);
    chips.push(`${m.availableBeds || 0}/${m.totalBeds || 0} beds free`);
    if (!m.assignedManagerId) chips.push('no regional officer');
  } else if (node.type === 'region') {
    chips.push(`${m.hospitals || 0} hospitals`);
    if (Array.isArray(m.cities) && m.cities.length) chips.push(m.cities.join(' · '));
  } else if (node.type === 'platform') {
    chips.push(`${m.regions || 0} regions`);
    chips.push(`${m.hospitals || 0} hospitals`);
    chips.push(`${m.staff || 0} staff`);
    chips.push(`${m.patients || 0} patients`);
  } else if (node.type === 'user' && m.email) {
    chips.push(m.email);
  }
  return chips;
}

/** Keep a node if it or anything beneath it matches the filter. */
function subtreeMatches(node, filter) {
  const hay = `${node.label} ${node.sublabel || ''} ${node.role || ''} ${(node.meta || {}).email || ''}`.toLowerCase();
  if (hay.includes(filter)) return true;
  return (node.children || []).some((c) => subtreeMatches(c, filter));
}

function NodeLabel({ node }) {
  return (
    <>
      <span className={`node-type ${node.type}`}>{typeLabel(node.type)}</span>
      <span className="node-label">{node.label}</span>
      {node.sublabel && <span className="node-sub">{node.sublabel}</span>}
      {node.status && <span className={`pill ${node.status}`}>{String(node.status).replace(/_/g, ' ')}</span>}
      {metaChips(node).map((c, i) => <span className="chip" key={i}>{c}</span>)}
    </>
  );
}

/**
 * One node and its subtree. Rendered as nested <details> so expand/collapse is
 * the browser's job — no state to keep in sync, and it stays keyboard-navigable.
 */
function Node({ node, depth, filter }) {
  if (filter && !subtreeMatches(node, filter)) return null;

  const kids = (node.children || []).filter((c) => !filter || subtreeMatches(c, filter));
  if (!kids.length) {
    return <div className="node leaf" style={{ '--depth': depth }}><NodeLabel node={node} /></div>;
  }

  // A filtered search should show what it found, not make you dig for it.
  const open = Boolean(filter) || !COLLAPSED_BELOW.includes(node.type);
  return (
    <details className="node branch" style={{ '--depth': depth }} open={open}>
      <summary><NodeLabel node={node} /></summary>
      <div className="node-children">
        {kids.map((child, i) => <Node key={child.id || `${child.type}-${child.label}-${i}`} node={child} depth={depth + 1} filter={filter} />)}
      </div>
    </details>
  );
}

function ScopeBanner({ scope }) {
  const ids = scope.hospitalIds || [];
  return (
    <div className="note scope">
      <strong>Your visibility: {scope.rootLabel}.</strong>{' '}
      {scope.description}
      {!scope.seesAllHospitals && (
        <>
          {' '}You can act on {ids.length} hospital{ids.length === 1 ? '' : 's'}:{' '}
          {ids.map((id, i) => <span key={id}>{i > 0 && ', '}<code>{id}</code></span>)}.
        </>
      )}
    </div>
  );
}

function ScopeCounts({ scope }) {
  const c = scope.counts || {};
  const tiles = [
    ['Hospitals', c.hospitals],
    ['Hospital managers', c.managers],
    ['Administrative staff', c.staff],
    ['Doctors', c.doctors],
    ['Ambulance crew', c.ambulance],
  ];
  // Regions and patients are platform-level facts — meaningless on a
  // regional or hospital scope, so they are only shown when they apply.
  if (scope.level === 0) {
    tiles.unshift(['Regions', c.regions]);
    tiles.push(['Patients', c.patients]);
  }
  return (
    <div className="kpi-grid">
      {tiles.map(([label, value]) => (
        <div className="kpi" key={label}>
          <p className="label">{label}</p>
          <p className="value">{value ?? 0}</p>
        </div>
      ))}
    </div>
  );
}

export default function HierarchyView({ heading, description }) {
  const [tree, setTree] = useState(null);
  const [scope, setScope] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const filter = useMemo(() => search.trim().toLowerCase(), [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [treeRes, scopeRes] = await Promise.all([Hierarchy.getTree(), Hierarchy.getScope()]);
        if (cancelled) return;
        setScope(scopeRes.data);
        setTree(treeRes.data);
      } catch (err) {
        console.error('Hierarchy load failed:', err);
        if (!cancelled) setError('Could not load the hierarchy. Check that the backend is running.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="hierarchy-view">
      <PageHeader title={heading} subtitle={description}>
        <input
          id="treeSearch"
          placeholder="Find a hospital, department or person…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ height: 38, border: '1px solid #E5E7EB', borderRadius: 8, padding: '0 12px', fontSize: 13, minWidth: 280 }}
        />
      </PageHeader>

      <div id="scopeBanner">{scope && <ScopeBanner scope={scope} />}</div>
      {scope && <ScopeCounts scope={scope} />}

      <div className="panel">
        <div className="panel-head">
          <h2>Everything below you</h2>
          <span className="hint">You see your own node and its subtree — nothing above it, nothing beside it</span>
        </div>
        <div className="panel-body" id="treeRoot">
          {error
            ? <p className="empty" style={{ color: '#B91C1C' }}>{error}</p>
            : !tree
              ? 'Loading…'
              : (filter && !subtreeMatches(tree, filter))
                ? <p className="empty">Nothing in your scope yet.</p>
                : <Node node={tree} depth={0} filter={filter} />}
        </div>
      </div>
    </div>
  );
}
