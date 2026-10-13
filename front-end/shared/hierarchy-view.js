/* ─────────────────────────────────────────────────────────────────────────────
   Organisation hierarchy — shared renderer.

   The Admin and the Regional Officer see the *same* view of a *different*
   subtree. The backend decides which subtree from the token, so this file draws
   whatever it is handed and never filters: if a hospital reaches the browser,
   the caller was entitled to it.

   The page must provide:
     #scopeBanner   the visibility notice
     #scopeCounts   the count tiles
     #treeRoot      where the tree is drawn
     #treeSearch    (optional) a filter box
   ───────────────────────────────────────────────────────────────────────────── */

let hierarchyTree = null;
let hierarchyScope = null;
let treeFilter = '';

/** Node types that start collapsed — anything below a hospital. */
const COLLAPSED_BELOW = ['hospital'];

async function loadHierarchy() {
    try {
        const [treeRes, scopeRes] = await Promise.all([
            window.NexCareAPI.Hierarchy.getTree(),
            window.NexCareAPI.Hierarchy.getScope(),
        ]);

        if (!scopeRes.success) throw new Error(scopeRes.message);
        hierarchyScope = scopeRes.data;
        renderScope();

        if (!treeRes.success) throw new Error(treeRes.message);
        hierarchyTree = treeRes.data;
        renderTree();
    } catch (err) {
        console.error('Hierarchy load failed:', err);
        setHTML('treeRoot', `<p class="empty" style="color:#B91C1C;">
            Could not load the hierarchy. Check that the backend is running.</p>`);
    }
}

function renderScope() {
    const s = hierarchyScope;
    setHTML('scopeBanner', `
        <div class="note scope">
            <strong>Your visibility: ${esc(s.rootLabel)}.</strong>
            ${esc(s.description)}
            ${s.seesAllHospitals
                ? ''
                : ` You can act on ${s.hospitalIds.length} hospital${s.hospitalIds.length === 1 ? '' : 's'}:
                    <code>${s.hospitalIds.map(esc).join('</code>, <code>')}</code>.`}
        </div>
    `);

    const c = s.counts || {};
    const tiles = [
        ['Hospitals', c.hospitals],
        ['Hospital managers', c.managers],
        ['Administrative staff', c.staff],
        ['Doctors', c.doctors],
        ['Ambulance crew', c.ambulance],
    ];
    // Regions and patients are platform-level facts — meaningless on a
    // regional or hospital scope, so they are only shown when they apply.
    if (s.level === 0) {
        tiles.unshift(['Regions', c.regions]);
        tiles.push(['Patients', c.patients]);
    }

    setHTML('scopeCounts', tiles.map(([label, value]) => `
        <div class="kpi">
            <p class="label">${esc(label)}</p>
            <p class="value">${value ?? 0}</p>
        </div>
    `).join(''));
}

function renderTree() {
    if (!hierarchyTree) return;
    const html = nodeHtml(hierarchyTree, 0);
    setHTML('treeRoot', html || '<p class="empty">Nothing in your scope yet.</p>');
}

/**
 * One node and its subtree. Rendered as nested <details> so expand/collapse is
 * the browser's job — no state to keep in sync, and it stays keyboard-navigable.
 */
function nodeHtml(node, depth) {
    if (treeFilter && !subtreeMatches(node)) return '';

    const kids = (node.children || [])
        .map(child => nodeHtml(child, depth + 1))
        .filter(Boolean)
        .join('');

    const label = `
        <span class="node-type ${esc(node.type)}">${esc(typeLabel(node.type))}</span>
        <span class="node-label">${esc(node.label)}</span>
        ${node.sublabel ? `<span class="node-sub">${esc(node.sublabel)}</span>` : ''}
        ${node.status ? `<span class="pill ${esc(node.status)}">${esc(String(node.status).replace(/_/g, ' '))}</span>` : ''}
        ${metaChips(node)}
    `;

    if (!kids) {
        return `<div class="node leaf" style="--depth:${depth}">${label}</div>`;
    }

    // A filtered search should show what it found, not make you dig for it.
    const open = treeFilter || !COLLAPSED_BELOW.includes(node.type) ? ' open' : '';
    return `
        <details class="node branch" style="--depth:${depth}"${open}>
            <summary>${label}</summary>
            <div class="node-children">${kids}</div>
        </details>
    `;
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
    return chips.map(c => `<span class="chip">${esc(c)}</span>`).join('');
}

function typeLabel(type) {
    return { platform: 'Platform', region: 'Region', hospital: 'Hospital',
             department: 'Dept', user: 'Person' }[type] || type;
}

/** Keep a node if it or anything beneath it matches the filter. */
function subtreeMatches(node) {
    const hay = `${node.label} ${node.sublabel || ''} ${node.role || ''} ${(node.meta || {}).email || ''}`.toLowerCase();
    if (hay.includes(treeFilter)) return true;
    return (node.children || []).some(subtreeMatches);
}

function wireHierarchySearch() {
    const box = document.getElementById('treeSearch');
    if (!box) return;
    box.addEventListener('input', event => {
        treeFilter = event.target.value.trim().toLowerCase();
        renderTree();
    });
}
