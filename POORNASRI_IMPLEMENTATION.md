# NexCare - Poornasri's Implementation Deliverables

**Developer:** Poornasri (`poornasri.n24@iiits.in`)  
**Repository:** [IIIT-Sricity-FSD-2024-2028/28_NexCare](https://github.com/IIIT-Sricity-FSD-2024-2028/28_NexCare)  
**Assigned Phase:** Phase 1  

---

## 1. Summary of Changes Implemented

| Rule # | Requirement | Implementation in Poornasri's Scope |
|:---|:---|:---|
| **#2** | Work Rebalancing | `roSlice` moved to Phase 1; `uiSlice` transferred to Poornasri to back the UI Kit (`useConfirm`, `ConfirmDialog`, `Dialogs`). |
| **#5** | Valid API Endpoints | Only valid endpoints are referenced; eliminated calls to non-existent backend APIs (`Appointments.checkin`, `Appointments.getByPatient`, etc.). |
| **#8** | Serializable Redux State | `confirmDialog.onConfirm` function completely eliminated from Redux store. Handled using an async deferred promise in `useConfirm`. |
| **#10** | Sync Check-in | `patientCheckedIn` implemented as a pure synchronous action (no backend check-in route exists). |
| **#11** | No Duplicated Hierarchy | Hierarchy tree state removed from `roSlice` (handled by shared component, avoiding duplication with `suSlice`). |

---

## 2. Implemented File Structure

```
src/
├── components/
│   ├── common/
│   │   ├── ConfirmDialog.jsx      # Confirmation dialog modal powered by uiSlice
│   │   ├── Dialogs.jsx            # Shared UI Kit (Modal, ToastContainer, Dialogs bundle)
│   │   ├── index.js               # Common exports
│   │   └── useConfirm.js          # Promise-based hook replacing window.confirm
│   └── ro/
│       └── ReceptionQueue.jsx     # Reception Officer daily queue component
└── store/
    ├── index.js                   # Root store registering ui & ro slices + logout reset
    └── slices/
        ├── roSlice.js             # Reception Officer slice (Phase 1)
        └── uiSlice.js             # Global UI state (confirmDialog, modals, toasts)
```

---

## 3. How to Use Poornasri's UI Kit in Any Component

```javascript
import { useConfirm } from '../components/common/useConfirm';

function DeletePatientButton({ patientId }) {
  const { confirm } = useConfirm();

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete Patient Record',
      message: 'This action cannot be undone. Are you sure?',
      confirmText: 'Delete',
      type: 'danger',
    });

    if (ok) {
      // Proceed with delete action
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

