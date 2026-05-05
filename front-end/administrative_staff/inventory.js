import { validateInventoryUpdate } from "./validation.js";

// ---------------- API HELPER ----------------
function apiGet(path) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).then(r => r.json());
}

function apiRequest(method, path, body) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    }).then(r => r.json());
}

// ---------------- STATE ----------------
let selectedItem = null;
let modalMode = "edit"; // 'edit' | 'create'
let inventory = [];
let filteredInventory = [];

// ---------------- HELPERS ----------------
function getStatus(qty) {
    return qty < 20 ? "Low Stock" : "In Stock";
}

function normalizeInventoryRow(row) {
    if (!row) return null;
    const qty = Number(row.qty ?? row.quantity ?? 0);
    return {
        id: row.id,
        name: row.name ?? "",
        qty: Number.isFinite(qty) ? qty : 0
    };
}

// ---------------- LOAD DATA FROM API ----------------
async function loadInventory() {
    try {
        const resp = await apiGet('/inventory');
        const rows = resp.data || [];
        inventory = rows.map(normalizeInventoryRow).filter(Boolean);
        filteredInventory = [...inventory];
        render();
    } catch (err) {
        console.error("Error loading inventory:", err);
        const table = document.getElementById("inventoryTable");
        if (table) table.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#dc2626;">Failed to load inventory. Backend may be offline.</td></tr>`;
    }
}

// ---------------- RENDER ----------------
function render() {
    const table = document.getElementById("inventoryTable");
    if (!table) return;

    if (!filteredInventory.length) {
        table.innerHTML = `<tr><td colspan="4">No items found</td></tr>`;
        updateStats();
        return;
    }

    table.innerHTML = filteredInventory.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>
                <span class="status ${item.qty < 20 ? "pending" : "paid"}">
                    ${getStatus(item.qty)}
                </span>
            </td>
            <td>
                <div class="actions">
                    <button class="btn" onclick="editItem('${String(item.id).replaceAll("'", "\\'")}')">Edit</button>
                    <button class="btn-outline" onclick="deleteItem('${String(item.id).replaceAll("'", "\\'")}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join("");

    updateStats();
}

// ---------------- STATS ----------------
function updateStats() {
    document.getElementById("totalItems").innerText = inventory.length;
    document.getElementById("inStock").innerText = inventory.filter(i => i.qty >= 20).length;
    document.getElementById("lowStock").innerText = inventory.filter(i => i.qty < 20).length;
}

// ---------------- SEARCH ----------------
function applySearch() {
    const value = document.getElementById("searchInput")?.value.toLowerCase() || "";
    filteredInventory = inventory.filter(i => i.name.toLowerCase().includes(value));
    render();
}

// ---------------- MODAL ----------------
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
    nameEl.disabled = false;
    nameEl.value = "";
    document.getElementById("quantity").value = "";
    nameEl.focus();
};

window.closeModal = () => {
    document.getElementById("modal").style.display = "none";
};

window.saveItem = async () => {
    const name = (document.getElementById("itemName").value || "").trim();
    const qty = document.getElementById("quantity").value;

    const error = validateInventoryUpdate({ qty });
    if (error) { alert(error); return; }

    if (modalMode === "create") {
        if (name.length < 2) { alert("Item name is required."); return; }

        try {
            const resp = await apiRequest('POST', '/inventory', {
                name,
                category: "General",
                quantity: Number(qty),
                status: getStatus(Number(qty))
            });
            if (window.NexCareStore) {
                window.NexCareStore.logActivity("Create", "Inventory", `Added inventory item: ${name} (${qty})`);
            }
        } catch (err) {
            alert("Failed to create inventory item.");
            console.error(err);
            return;
        }
    } else {
        if (!selectedItem) return;

        try {
            await apiRequest('PUT', `/inventory/${selectedItem.id}`, {
                name: selectedItem.name,
                quantity: Number(qty),
                status: getStatus(Number(qty))
            });
            if (window.NexCareStore) {
                window.NexCareStore.logActivity("Update", "Inventory", `Updated inventory item: ${selectedItem.name} (${qty})`);
            }
        } catch (err) {
            alert("Failed to update inventory item.");
            console.error(err);
            return;
        }
    }

    closeModal();
    await loadInventory(); // Refresh from API
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

// ---------------- EVENTS ----------------
document.getElementById("searchInput")?.addEventListener("input", applySearch);

// ---------------- INIT ----------------
loadInventory();