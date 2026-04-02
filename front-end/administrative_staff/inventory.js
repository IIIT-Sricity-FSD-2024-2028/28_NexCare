import { validateInventoryUpdate } from "./validation.js";

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

function readFromUniversalDb() {
    if (!window.NexCareDB) return null;
    const rows = window.NexCareDB.getTable("inventory") || [];
    return rows.map(normalizeInventoryRow).filter(Boolean);
}

function writeInventoryRowToDb(item) {
    if (!window.NexCareDB) return;
    window.NexCareDB.updateRow("inventory", item.id, {
        name: item.name,
        quantity: item.qty,
        status: getStatus(item.qty)
    });
}

// ---------------- LOAD DATA ----------------
async function loadInventory() {
    try {
        const dbInventory = readFromUniversalDb();
        if (dbInventory && dbInventory.length) {
            inventory = dbInventory;
        } else {
            // Fallback to static JSON for older builds
            const res = await fetch("./inventory.json");
            inventory = (await res.json()).map(normalizeInventoryRow).filter(Boolean);
        }
        filteredInventory = [...inventory];
        render();
    } catch (err) {
        console.error("Error loading inventory:", err);
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

    document.getElementById("inStock").innerText =
        inventory.filter(i => i.qty >= 20).length;

    document.getElementById("lowStock").innerText =
        inventory.filter(i => i.qty < 20).length;
}


// ---------------- SEARCH ----------------
function applySearch() {
    const value = document.getElementById("searchInput")?.value.toLowerCase() || "";

    filteredInventory = inventory.filter(i =>
        i.name.toLowerCase().includes(value)
    );

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


window.saveItem = () => {
    const name = (document.getElementById("itemName").value || "").trim();
    const qty = document.getElementById("quantity").value;

    // VALIDATION
    const error = validateInventoryUpdate({ qty });

    if (error) {
        alert(error);
        return;
    }

    if (modalMode === "create") {
        if (name.length < 2) {
            alert("Item name is required.");
            return;
        }

        const newItem = {
            id: window.NexCareDB ? window.NexCareDB.generateId("INV") : Date.now(),
            name,
            qty: Number(qty)
        };

        inventory.unshift(newItem);
        if (window.NexCareDB) {
            window.NexCareDB.addRow("inventory", {
                id: newItem.id,
                name: newItem.name,
                category: "General",
                quantity: newItem.qty,
                status: getStatus(newItem.qty)
            });
            if (window.NexCareStore) {
                window.NexCareStore.logActivity("Create", "Inventory", `Added inventory item: ${newItem.name} (${newItem.qty})`);
            }
        }
    } else {
        // UPDATE DATA
        if (!selectedItem) return;
        selectedItem.qty = Number(qty);

        if (window.NexCareDB) {
            writeInventoryRowToDb(selectedItem);
            if (window.NexCareStore) {
                window.NexCareStore.logActivity("Update", "Inventory", `Updated inventory item: ${selectedItem.name} (${selectedItem.qty})`);
            }
        }
    }

    closeModal();
    applySearch(); // keeps current filter while refreshing view
    render();
};

window.deleteItem = (id) => {
    const item = inventory.find(i => String(i.id) === String(id));
    if (!item) return;

    if (!confirm(`Delete "${item.name}"?`)) return;

    inventory = inventory.filter(i => String(i.id) !== String(id));
    filteredInventory = filteredInventory.filter(i => String(i.id) !== String(id));

    if (window.NexCareDB) {
        window.NexCareDB.deleteRow("inventory", item.id);
        if (window.NexCareStore) {
            window.NexCareStore.logActivity("Delete", "Inventory", `Deleted inventory item: ${item.name} (${item.id})`);
        }
    }

    render();
};


// ---------------- EVENTS ----------------
document.getElementById("searchInput")
    ?.addEventListener("input", applySearch);


// ---------------- INIT ----------------
loadInventory();