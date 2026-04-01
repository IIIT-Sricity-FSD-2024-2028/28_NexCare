import { validateInventoryUpdate } from "../../shared/validation.js";

// ---------------- STATE ----------------
let selectedItem = null;
let inventory = [];
let filteredInventory = [];

// ---------------- HELPERS ----------------
function getStatus(qty) {
    return qty < 20 ? "Low Stock" : "In Stock";
}

// ---------------- LOAD DATA ----------------
async function loadInventory() {
    try {
        const res = await fetch("../assets/data/inventory.json");
        inventory = await res.json();
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
                <button class="btn" onclick="editItem(${item.id})">Edit</button>
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
    selectedItem = inventory.find(i => i.id === id);

    if (!selectedItem) return;

    document.getElementById("modal").style.display = "flex";
    document.getElementById("itemName").value = selectedItem.name;
    document.getElementById("quantity").value = selectedItem.qty;
};


window.closeModal = () => {
    document.getElementById("modal").style.display = "none";
};


window.saveItem = () => {
    const qty = document.getElementById("quantity").value;

    // VALIDATION
    const error = validateInventoryUpdate({ qty });

    if (error) {
        alert(error);
        return;
    }

    // UPDATE DATA
    selectedItem.qty = Number(qty);

    closeModal();
    render();
};


// ---------------- EVENTS ----------------
document.getElementById("searchInput")
    ?.addEventListener("input", applySearch);


// ---------------- INIT ----------------
loadInventory();