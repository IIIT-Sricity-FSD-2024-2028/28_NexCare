// ---------------- HTML ESCAPE HELPER ----------------
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ---------------- API HELPER ----------------
function getHospitalId() {
    try {
        const user = JSON.parse(sessionStorage.getItem('nexcare_user_data') || localStorage.getItem('nexcare_user_data') || '{}');
        return user.hospitalId || '';
    } catch { return ''; }
}

function apiGet(path) {
    return window.NexCareAPI.get(path);
}

async function apiRequest(method, path, body) {
    const apiMethod = window.NexCareAPI[method.toLowerCase()];
    if (!apiMethod) throw new Error(`Unsupported method: ${method}`);
    return await apiMethod(path, body);
}

// ---------------- STATE ----------------
let selectedItem = null;
let selectedRestockItem = null;
let selectedUseItem = null;
let modalMode = "edit"; // 'edit' | 'create'
let inventory = [];
let filteredInventory = [];


// ---------------- HELPERS ----------------
function getStatus(qty, minStock = 20) {
    if (qty === 0) return "OUT_OF_STOCK";
    if (qty < minStock * 0.25) return "CRITICAL";
    if (qty < minStock) return "LOW_STOCK";
    return "NORMAL";
}

function getStatusClass(statusText) {
    const s = String(statusText || '').toUpperCase();
    if (s.includes('OUT_OF_STOCK') || s.includes('OUT')) return "overdue";
    if (s.includes('CRITICAL')) return "overdue";
    if (s.includes('LOW_STOCK') || s.includes('LOW')) return "pending";
    return "paid";
}

function normalizeInventoryRow(row) {
    if (!row) return null;
    const qty = Number(row.qty ?? row.quantity ?? 0);
    const minStock = Number(row.minStock ?? 20);
    return {
        id: row.id,
        name: row.name ?? "",
        category: row.category ?? "General",
        location: row.location ?? "General",
        qty: Number.isFinite(qty) ? qty : 0,
        minStock: Number.isFinite(minStock) ? minStock : 20,
        status: row.status ?? getStatus(qty, minStock)
    };
}

// ---------------- LOAD DATA FROM API ----------------
async function loadInventory() {
    try {
        const hid = getHospitalId();
        const hidQuery = hid ? `?hospitalId=${encodeURIComponent(hid)}` : '';
        const resp = await apiGet(`/inventory${hidQuery}`);
        const rows = resp.data || [];
        inventory = rows.map(normalizeInventoryRow).filter(Boolean);
        filteredInventory = [...inventory];
        render();
    } catch (err) {
        console.error("Error loading inventory:", err);
        alert('Failed to load inventory. Please check your connection and try again.');
        const table = document.getElementById("inventoryTable");
        if (table) table.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#dc2626;">Failed to load inventory. Backend may be offline.</td></tr>`;
    }
}

// ---------------- RENDER ----------------
function render() {
    const table = document.getElementById("inventoryTable");
    if (!table) return;

    if (!filteredInventory.length) {
        table.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;">No items found</td></tr>`;
        updateStats();
        return;
    }

    table.innerHTML = filteredInventory.map(item => {
        const statusText = getStatus(item.qty, item.minStock);
        const statusClass = getStatusClass(statusText);
        const safeId = String(item.id).replaceAll("'", "\\'");
        const escapedName = escapeHtml(item.name);
        const escapedCategory = escapeHtml(item.category);
        const escapedId = escapeHtml(item.id);
        const escapedStatusText = escapeHtml(statusText);

        return `
        <tr>
            <td>
                <strong style="color:#1e293b;">${escapedName}</strong>
                <div style="font-size:12px;color:#6b7280;">${escapedCategory} • ${escapedId}</div>
            </td>
            <td>
                <span style="font-size:15px;font-weight:600;">${item.qty}</span>
                <span style="font-size:12px;color:#6b7280;margin-left:4px;">(Min: ${item.minStock})</span>
            </td>
            <td>
                <span class="status ${statusClass}">
                    ${escapedStatusText}
                </span>
            </td>
            <td>
                <div class="actions" style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button class="btn" style="padding:6px 12px;font-size:12px;background:#10b981;" onclick="openRestockModal('${safeId}')">Restock</button>
                    <button class="btn" style="padding:6px 12px;font-size:12px;background:#f59e0b;" onclick="openUseModal('${safeId}')">Use</button>
                    <button class="btn-outline" style="padding:6px 10px;font-size:12px;" onclick="openAuditHistoryModal('${safeId}')">History</button>
                    <button class="btn-outline" style="padding:6px 10px;font-size:12px;color:#dc2626;border-color:#fca5a5;" onclick="deleteItem('${safeId}')">Delete</button>
                </div>
            </td>
        </tr>
    `}).join("");

    updateStats();
}

// ---------------- STATS ----------------
function updateStats() {
    const totalEl = document.getElementById("totalItems");
    const inStockEl = document.getElementById("inStock");
    const lowStockEl = document.getElementById("lowStock");

    if (totalEl) totalEl.innerText = inventory.length;
    if (inStockEl) inStockEl.innerText = inventory.filter(i => i.qty >= (i.minStock || 20)).length;
    if (lowStockEl) lowStockEl.innerText = inventory.filter(i => i.qty > 0 && i.qty < (i.minStock || 20)).length;
}

// ---------------- SEARCH ----------------
function applySearch() {
    const value = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
    filteredInventory = inventory.filter(i => 
        String(i.name || "").toLowerCase().includes(value) || 
        String(i.category || "").toLowerCase().includes(value) ||
        String(i.id || "").toLowerCase().includes(value)
    );
    render();
}


// ---------------- EDIT / CREATE MODAL ----------------
window.editItem = (id) => {
    selectedItem = inventory.find(i => String(i.id) === String(id));
    if (!selectedItem) return;

    modalMode = "edit";
    document.getElementById("modal").style.display = "flex";
    const title = document.getElementById("modalTitle");
    if (title) title.textContent = "Edit Item";
    document.getElementById("itemName").value = selectedItem.name;
    document.getElementById("itemName").disabled = true;
    document.getElementById("quantity").value = selectedItem.qty;
};

window.openCreateItemModal = () => {
    modalMode = "create";
    selectedItem = null;
    document.getElementById("modal").style.display = "flex";
    const title = document.getElementById("modalTitle");
    if (title) title.textContent = "Add Item";
    const nameEl = document.getElementById("itemName");
    if (nameEl) {
        nameEl.disabled = false;
        nameEl.value = "";
        nameEl.focus();
    }
    const catEl = document.getElementById("itemCategory");
    if (catEl) catEl.value = "";
    const qtyEl = document.getElementById("quantity");
    if (qtyEl) qtyEl.value = "";
    const minEl = document.getElementById("minStock");
    if (minEl) minEl.value = "20";
    const unitEl = document.getElementById("itemUnit");
    if (unitEl) unitEl.value = "";
    const locEl = document.getElementById("itemLocation");
    if (locEl) locEl.value = "";
};

window.closeModal = () => {
    document.getElementById("modal").style.display = "none";
};

window.saveItem = async () => {
    const name = (document.getElementById("itemName")?.value || "").trim();
    const category = (document.getElementById("itemCategory")?.value || "").trim() || "General";
    const qtyVal = document.getElementById("quantity")?.value;
    const minStockVal = document.getElementById("minStock")?.value;
    const unit = (document.getElementById("itemUnit")?.value || "").trim() || "units";
    const location = (document.getElementById("itemLocation")?.value || "").trim() || "Pharmacy";

    if (!name || name.length < 2) {
        alert("Please enter a valid item name (minimum 2 characters).");
        return;
    }

    const qty = Number(qtyVal);
    if (isNaN(qty) || qty < 0 || !Number.isInteger(qty)) {
        alert("Please enter a valid initial quantity (0 or positive integer).");
        return;
    }

    const minStock = Number(minStockVal);
    if (isNaN(minStock) || minStock < 1 || !Number.isInteger(minStock)) {
        alert("Please enter a valid minimum stock threshold (positive integer).");
        return;
    }

    try {
        const resp = await apiRequest('POST', '/inventory', {
            name,
            category,
            quantity: qty,
            minStock: minStock,
            unit,
            location,
            status: getStatus(qty, minStock)
        });

        if (resp && resp.success === false) {
            alert(resp.message || "Failed to create inventory item.");
            return;
        }

        if (window.NexCareStore) {
            window.NexCareStore.logActivity("Create", "Inventory", `Added inventory item: ${name} (Qty: ${qty}, Min: ${minStock})`);
        }

        closeModal();
        await loadInventory(); // Refresh from API
    } catch (err) {
        alert("Failed to create inventory item.");
        console.error(err);
    }
};


window.deleteItem = async (id) => {
    const item = inventory.find(i => String(i.id) === String(id));
    if (!item) return;
    if (!confirm(`Delete "${item.name}"?`)) return;

    try {
        await apiRequest('DELETE', `/inventory/${id}`);
        if (window.NexCareStore) {
            window.NexCareStore.logActivity("Delete", "Inventory", `Deleted inventory item: ${item.name} (${id})`);
        }
    } catch (err) {
        alert("Failed to delete inventory item.");
        console.error(err);
        return;
    }

    await loadInventory();
};

// ---------------- RESTOCK MODAL ----------------
window.openRestockModal = (id) => {
    selectedRestockItem = inventory.find(i => String(i.id) === String(id));
    if (!selectedRestockItem) return;

    const modal = document.getElementById("restockModal");
    if (!modal) return;

    document.getElementById("restockModalTitle").textContent = `Restock ${selectedRestockItem.name}`;
    document.getElementById("restockItemSubtitle").textContent = `Current Stock: ${selectedRestockItem.qty} units (ID: ${selectedRestockItem.id})`;

    document.getElementById("restockQuantity").value = "";
    document.getElementById("restockSupplier").value = "";
    document.getElementById("restockBatch").value = "";
    document.getElementById("restockNotes").value = "";

    modal.style.display = "flex";
    document.getElementById("restockQuantity").focus();
};

window.closeRestockModal = () => {
    const modal = document.getElementById("restockModal");
    if (modal) modal.style.display = "none";
    selectedRestockItem = null;
};

window.submitRestock = async () => {
    if (!selectedRestockItem) return;

    const qtyInput = document.getElementById("restockQuantity");
    const quantityToAdd = Number(qtyInput.value);

    if (!quantityToAdd || quantityToAdd <= 0 || !Number.isInteger(quantityToAdd)) {
        alert("Please enter a valid positive integer quantity to add.");
        qtyInput.focus();
        return;
    }

    const supplier = document.getElementById("restockSupplier").value.trim() || undefined;
    const batchNumber = document.getElementById("restockBatch").value.trim() || undefined;
    const notes = document.getElementById("restockNotes").value.trim() || undefined;

    // Extract current user ID from token
    let userId = "ADMIN";
    try {
        const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
        if (token) {
            const raw = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = decodeURIComponent(atob(raw).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const payload = JSON.parse(json);
            userId = payload.sub || payload.id || payload.email || "ADMIN";
        }
    } catch (e) {}

    try {
        const resp = await apiRequest('PATCH', `/inventory/${selectedRestockItem.id}/restock`, {
            quantity: quantityToAdd,
            supplier,
            batchNumber,
            notes,
            restockedBy: userId
        });

        if (resp && resp.success === false) {
            alert(resp.message || "Failed to restock item.");
            return;
        }

        if (window.NexCareStore) {
            window.NexCareStore.logActivity("Restock", "Inventory", `Restocked ${selectedRestockItem.name}: +${quantityToAdd} units (new total: ${selectedRestockItem.qty + quantityToAdd})`);
        }

        closeRestockModal();
        await loadInventory(); // Refresh data from API
    } catch (err) {
        console.error("Restock error:", err);
        alert("Failed to restock item. Please check network/backend.");
    }
};

// ---------------- USE / CONSUME STOCK MODAL ----------------
window.openUseModal = (id) => {
    selectedUseItem = inventory.find(i => String(i.id) === String(id));
    if (!selectedUseItem) return;

    if (selectedUseItem.qty <= 0) {
        alert(`"${selectedUseItem.name}" is currently Out of Stock.`);
        return;
    }

    const modal = document.getElementById("useModal");
    if (!modal) return;

    document.getElementById("useModalTitle").textContent = `Use / Consume ${selectedUseItem.name}`;
    document.getElementById("useItemSubtitle").textContent = `Available Stock: ${selectedUseItem.qty} units (ID: ${selectedUseItem.id})`;

    const qtyInput = document.getElementById("useQuantity");
    qtyInput.value = "";
    qtyInput.max = selectedUseItem.qty;
    document.getElementById("useNotes").value = "";

    modal.style.display = "flex";
    qtyInput.focus();
};

window.closeUseModal = () => {
    const modal = document.getElementById("useModal");
    if (modal) modal.style.display = "none";
    selectedUseItem = null;
};

window.submitUse = async () => {
    if (!selectedUseItem) return;

    const qtyInput = document.getElementById("useQuantity");
    const quantityToUse = Number(qtyInput.value);

    if (!quantityToUse || quantityToUse <= 0 || !Number.isInteger(quantityToUse)) {
        alert("Please enter a valid positive integer quantity to consume.");
        qtyInput.focus();
        return;
    }

    if (quantityToUse > selectedUseItem.qty) {
        alert(`Cannot use ${quantityToUse} units. Only ${selectedUseItem.qty} units available.`);
        qtyInput.focus();
        return;
    }

    const notes = document.getElementById("useNotes").value.trim() || undefined;

    try {
        const resp = await apiRequest('PATCH', `/inventory/${selectedUseItem.id}/use`, {
            quantity: quantityToUse,
            notes
        });

        if (resp && resp.success === false) {
            alert(resp.message || "Failed to consume item.");
            return;
        }

        if (window.NexCareStore) {
            window.NexCareStore.logActivity("Use", "Inventory", `Used ${selectedUseItem.name}: -${quantityToUse} units (remaining: ${selectedUseItem.qty - quantityToUse})`);
        }

        closeUseModal();
        await loadInventory(); // Refresh data from API
    } catch (err) {
        console.error("Use/Consume error:", err);
        alert("Failed to consume item. Please check network/backend.");
    }
};

// ---------------- RESTOCKING HISTORY / AUDIT TRAIL MODAL ----------------

window.openAuditHistoryModal = async (id) => {
    const item = inventory.find(i => String(i.id) === String(id));
    const modal = document.getElementById("auditModal");
    if (!modal) return;

    const title = document.getElementById("auditModalTitle");
    const subtitle = document.getElementById("auditModalSubtitle");
    const tableBody = document.getElementById("auditHistoryTable");

    if (title) title.textContent = item ? `Audit Trail: ${item.name}` : "Item Audit Trail";
    if (subtitle) subtitle.textContent = item ? `Item ID: ${item.id} | Current Stock: ${item.qty} units` : `Item ID: ${id}`;
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#6b7280;">Loading audit history...</td></tr>`;

    modal.style.display = "flex";

    try {
        const resp = await apiGet(`/inventory/audit/${id}`);
        const logs = resp.data || [];

        if (!logs.length) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:#6b7280;">No audit records found for this item yet.</td></tr>`;
            return;
        }

        tableBody.innerHTML = logs.map(entry => {
            const isRestock = entry.action === 'restock';
            const badgeClass = isRestock ? 'paid' : 'pending';
            const actionLabel = isRestock ? 'RESTOCK' : 'USE';
            const dateStr = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A';
            const diff = (entry.quantityAfter ?? 0) - (entry.quantityBefore ?? 0);
            const changeStr = diff >= 0 ? `+${diff}` : `${diff}`;
            const changeColor = diff >= 0 ? '#16a34a' : '#dc2626';
            const escapedDateStr = escapeHtml(dateStr);
            const escapedUserId = escapeHtml(entry.userId || 'ADMIN');
            const escapedNotes = escapeHtml(entry.notes || '-');

            return `
                <tr>
                    <td style="font-size:12px;white-space:nowrap;color:#4b5563;">${escapedDateStr}</td>
                    <td>
                        <span class="status ${badgeClass}" style="font-size:11px;font-weight:600;">${actionLabel}</span>
                    </td>
                    <td style="font-weight:500;">${Number(entry.quantityBefore ?? 0)}</td>
                    <td style="font-weight:700;color:${changeColor};">${changeStr}</td>
                    <td style="font-weight:600;color:#1e293b;">${Number(entry.quantityAfter ?? 0)}</td>
                    <td style="font-size:12px;color:#6b7280;">${escapedUserId}</td>
                    <td style="font-size:12px;color:#6b7280;">${escapedNotes}</td>
                </tr>
            `;
        }).join("");

    } catch (err) {
        console.error("Failed to load audit trail:", err);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#dc2626;">Failed to load audit history.</td></tr>`;
    }
};

window.closeAuditModal = () => {
    const modal = document.getElementById("auditModal");
    if (modal) modal.style.display = "none";
};

// ---------------- REQUISITION & PURCHASING MANAGEMENT ----------------
let currentPurchaseTargetReq = null;
let allRequisitionsCache = [];

async function loadRequisitions() {
    const tableBody = document.getElementById("requisitionsTable");
    if (!tableBody) return;

    try {
        const hid = getHospitalId();
        const hidQuery = hid ? `?hospitalId=${encodeURIComponent(hid)}` : '';
        const resp = await apiGet(`/inventory/requirements${hidQuery}`);
        const reqs = resp.data || [];
        allRequisitionsCache = reqs;

        if (!reqs.length) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#6b7280;">No requisition requests raised yet.</td></tr>`;
            return;
        }

        tableBody.innerHTML = reqs.map(r => {
            const isApproved = (r.status || '').toUpperCase() === 'APPROVED';
            const isPending = (r.status || '').toUpperCase() === 'PENDING' || (r.status || '').toUpperCase() === 'PENDING_APPROVAL';
            const isPurchasing = (r.status || '').toUpperCase() === 'PURCHASE_IN_PROGRESS';
            const isPurchased = (r.status || '').toUpperCase() === 'PURCHASED';
            const isRestocked = (r.status || '').toUpperCase() === 'RESTOCKED' || (r.status || '').toUpperCase() === 'FULFILLED';
            const isRejected = (r.status || '').toUpperCase() === 'REJECTED';

            let statusBadge = 'pending';
            let displayStatus = 'PENDING APPROVAL';
            if (isApproved) { statusBadge = 'paid'; displayStatus = 'APPROVED'; }
            else if (isPurchasing) { statusBadge = 'pending'; displayStatus = 'PURCHASE IN PROGRESS'; }
            else if (isPurchased) { statusBadge = 'paid'; displayStatus = 'PURCHASED'; }
            else if (isRestocked) { statusBadge = 'paid'; displayStatus = 'RESTOCKED'; }
            else if (isRejected) { statusBadge = 'overdue'; displayStatus = 'REJECTED'; }

            let auditDetails = '';
            if (isApproved) {
                auditDetails = `<div style="font-size:11px; color:#059669; margin-top:2px;">Approved by ${escapeHtml(r.approvedByName || 'Manager')}</div>`;
                if (r.managerRemarks) {
                    auditDetails += `<div style="font-size:10.5px; color:#475569;">"${escapeHtml(r.managerRemarks)}"</div>`;
                }
            } else if (isPurchasing) {
                auditDetails = `<div style="font-size:11px; color:#0284c7; margin-top:2px;">Vendor: <strong>${escapeHtml(r.supplier || 'Vendor')}</strong></div>
                                <div style="font-size:10.5px; color:#64748B;">Inv: ${escapeHtml(r.invoiceNumber || 'PO-PENDING')} | Cost: ₹${Number(r.finalCost || r.estimatedCost || 0).toLocaleString('en-IN')}</div>`;
            } else if (isPurchased) {
                auditDetails = `<div style="font-size:11px; color:#7c3aed; margin-top:2px;">Purchased by Admin Staff</div>
                                <div style="font-size:10.5px; color:#64748B;">Awaiting delivery receipt & restock</div>`;
            } else if (isRestocked) {
                auditDetails = `<div style="font-size:11px; color:#16a34a; margin-top:2px;">✓ Restocked (+${Number(r.quantityPurchased || r.requestedQuantity)} ${escapeHtml(r.unit || 'units')})</div>
                                <div style="font-size:10.5px; color:#64748B;">Stock level updated in central inventory</div>`;
            } else if (isRejected) {
                auditDetails = `<div style="font-size:11px; color:#DC2626; margin-top:2px;"><strong>Reason:</strong> ${escapeHtml(r.rejectionReason || 'Rejected by Hospital Manager')}</div>`;
            }

            let actionHtml = `<span style="font-size:12px; color:#94A3B8;">Awaiting Manager Review</span>`;
            const safeReqId = String(r.id).replaceAll("'", "\\'");

            if (isApproved) {
                actionHtml = `<button class="btn" style="padding:5px 10px; font-size:12px; background:#2563EB;" onclick="openStartPurchaseModal('${safeReqId}')">Start Purchase</button>`;
            } else if (isPurchasing) {
                actionHtml = `<button class="btn" style="padding:5px 10px; font-size:12px; background:#7c3aed;" onclick="markPurchased('${safeReqId}')">Mark Purchased</button>`;
            } else if (isPurchased) {
                actionHtml = `<button class="btn" style="padding:5px 10px; font-size:12px; background:#10b981;" onclick="markRestocked('${safeReqId}')">Mark Restocked</button>`;
            } else if (isRestocked) {
                actionHtml = `<span style="font-size:12px; color:#16a34a; font-weight:700;">Completed</span>`;
            } else if (isRejected) {
                actionHtml = `<span style="font-size:12px; color:#dc2626;">Closed</span>`;
            }

            return `
                <tr>
                    <td><strong>${escapeHtml(r.id)}</strong></td>
                    <td>
                        <strong>${escapeHtml(r.itemName)}</strong>
                        <div style="font-size:11px; color:#64748B;">${escapeHtml(r.category || 'General')}</div>
                    </td>
                    <td><strong>${Number(r.requestedQuantity || 0)}</strong> ${escapeHtml(r.unit || 'units')}</td>
                    <td>${escapeHtml(r.department || 'General')}</td>
                    <td><span class="status ${r.priority === 'URGENT' ? 'overdue' : (r.priority === 'HIGH' ? 'pending' : 'paid')}">${escapeHtml(r.priority || 'MEDIUM')}</span></td>
                    <td>
                        <span class="status ${statusBadge}">${displayStatus}</span>
                        ${auditDetails}
                    </td>
                    <td>
                        ${actionHtml}
                    </td>
                </tr>
            `;
        }).join("");

    } catch (err) {
        console.error("Failed to load requisitions:", err);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#dc2626;">Failed to load requisitions.</td></tr>`;
    }
}

window.openReqModal = () => {
    const modal = document.getElementById("reqModal");
    if (modal) {
        document.getElementById("reqItemName").value = "";
        document.getElementById("reqCategory").value = "";
        document.getElementById("reqQuantity").value = "";
        document.getElementById("reqUnit").value = "units";
        document.getElementById("reqEstimatedCost").value = "";
        document.getElementById("reqReason").value = "";
        modal.style.display = "flex";
    }
};

window.closeReqModal = () => {
    const modal = document.getElementById("reqModal");
    if (modal) modal.style.display = "none";
};

window.submitRequisition = async () => {
    const itemName = document.getElementById("reqItemName")?.value.trim();
    const category = document.getElementById("reqCategory")?.value.trim();
    const department = document.getElementById("reqDept")?.value;
    const requestedQuantity = Number(document.getElementById("reqQuantity")?.value);
    const unit = document.getElementById("reqUnit")?.value.trim() || 'units';
    const priority = document.getElementById("reqPriority")?.value || 'MEDIUM';
    const estimatedCost = Number(document.getElementById("reqEstimatedCost")?.value) || 0;
    const reason = document.getElementById("reqReason")?.value.trim();

    if (!itemName || !category || !requestedQuantity || requestedQuantity <= 0 || !reason) {
        alert("Please fill in all required fields (Item Name, Category, Requested Quantity, and Reason).");
        return;
    }

    try {
        const payload = {
            itemName,
            category,
            department,
            requestedQuantity,
            unit,
            priority,
            estimatedCost,
            reason
        };

        const resp = await apiRequest('POST', '/inventory/requirements', payload);
        if (resp.success) {
            alert("Inventory requirement submitted to Hospital Manager for approval!");
            window.closeReqModal();
            loadRequisitions();
        } else {
            alert(resp.message || "Failed to submit requirement.");
        }
    } catch (err) {
        console.error("Error creating requirement:", err);
        alert("Error submitting requirement. Please try again.");
    }
};

// ---------------- PURCHASING WORKFLOW ACTIONS ----------------
window.openStartPurchaseModal = (reqId) => {
    const req = allRequisitionsCache.find(r => String(r.id) === String(reqId));
    if (!req) return;

    currentPurchaseTargetReq = req;
    document.getElementById('purchaseModalTitle').textContent = `Initiate Purchase: ${req.itemName}`;
    document.getElementById('purchaseModalSubtitle').textContent = `Requisition #${req.id} • Approved Qty: ${req.requestedQuantity} ${req.unit}`;

    document.getElementById('purchaseSupplier').value = req.supplier || 'MedTech Surgicals Pvt. Ltd.';
    document.getElementById('purchaseInvoice').value = req.invoiceNumber || `PO-${req.department.slice(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('purchaseQuantity').value = req.requestedQuantity || 100;
    document.getElementById('purchaseCost').value = req.estimatedCost || 9500;
    document.getElementById('purchaseNotes').value = req.purchaseNotes || '';

    const modal = document.getElementById('startPurchaseModal');
    if (modal) modal.style.display = 'flex';
};

window.closeStartPurchaseModal = () => {
    const modal = document.getElementById('startPurchaseModal');
    if (modal) modal.style.display = 'none';
    currentPurchaseTargetReq = null;
};

window.submitStartPurchase = async () => {
    if (!currentPurchaseTargetReq) return;

    const supplier = document.getElementById('purchaseSupplier')?.value.trim();
    const invoiceNumber = document.getElementById('purchaseInvoice')?.value.trim();
    const purchaseDate = document.getElementById('purchaseDate')?.value;
    const quantityPurchased = Number(document.getElementById('purchaseQuantity')?.value);
    const finalCost = Number(document.getElementById('purchaseCost')?.value);
    const purchaseNotes = document.getElementById('purchaseNotes')?.value.trim();

    if (!supplier || !invoiceNumber || !quantityPurchased || quantityPurchased <= 0) {
        alert('Please provide supplier name, invoice/PO number, and valid purchase quantity.');
        return;
    }

    try {
        const resp = await apiRequest('PATCH', `/inventory/requirements/${currentPurchaseTargetReq.id}/start-purchase`, {
            supplier,
            invoiceNumber,
            purchaseDate,
            quantityPurchased,
            finalCost,
            purchaseNotes
        });

        if (resp.success) {
            alert(`Purchase details recorded for ${currentPurchaseTargetReq.itemName}! Status updated to Purchase in Progress.`);
            window.closeStartPurchaseModal();
            await loadRequisitions();
        } else {
            alert(resp.message || 'Failed to record purchase details.');
        }
    } catch (err) {
        console.error('Error starting purchase:', err);
        alert('Error recording purchase details.');
    }
};

window.markPurchased = async (reqId) => {
    if (!confirm('Confirm marking this item as purchased from the vendor?')) return;

    try {
        const resp = await apiRequest('PATCH', `/inventory/requirements/${reqId}/mark-purchased`, {});
        if (resp.success) {
            alert('Item marked as Purchased. Next step: Mark Restocked once delivered to hospital.');
            await loadRequisitions();
        } else {
            alert(resp.message || 'Failed to update requirement status.');
        }
    } catch (err) {
        console.error('Error marking purchased:', err);
        alert('Error updating status.');
    }
};

window.markRestocked = async (reqId) => {
    if (!confirm('Confirm goods received and restocked into central hospital inventory? This will automatically increase the stock quantity.')) return;

    try {
        const resp = await apiRequest('PATCH', `/inventory/requirements/${reqId}/mark-restocked`, {});
        if (resp.success) {
            alert('Requirement marked as RESTOCKED! Central inventory item quantity has been automatically updated.');
            await loadRequisitions();
            await loadInventory(); // Auto refresh stock table and stats!
        } else {
            alert(resp.message || 'Failed to restock item.');
        }
    } catch (err) {
        console.error('Error marking restocked:', err);
        alert('Error updating status and restocking.');
    }
};

// ---------------- EVENTS ----------------
document.getElementById("searchInput")?.addEventListener("input", applySearch);

// ---------------- INIT ----------------
loadInventory();
loadRequisitions();

