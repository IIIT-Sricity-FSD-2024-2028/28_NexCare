<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEX CARE - Manage Appointments</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f9fafb;
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* Sidebar Styles */
        .sidebar {
            width: 293px;
            background: white;
            border-right: 2px solid #e5e7eb;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        .logo-container {
            padding: 32px 32px 24px;
            border-bottom: 2.66px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .logo-icon {
            width: 45px;
            height: 45px;
            background: #0066cc;
            border-radius: 7.5px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .logo-icon svg {
            width: 36px;
            height: 36px;
        }

        .logo-text {
            display: flex;
            flex-direction: column;
        }

        .logo-title {
            font-family: 'JetBrains Mono', monospace;
            font-size: 41.25px;
            font-weight: 800;
            line-height: 1;
        }

        .logo-nex {
            color: #0077b6;
        }

        .logo-care {
            color: black;
        }

        .logo-subtitle {
            font-size: 11px;
            color: black;
            margin-top: 2px;
        }

        .nav-menu {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
        }

        .nav-item {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            margin-bottom: 4px;
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.2s;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            gap: 12px;
        }

        .nav-item:hover {
            background: #f3f4f6;
        }

        .nav-item.active {
            background: #eff6ff;
        }

        .nav-item svg {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
        }

        .nav-item.active svg path {
            stroke: #155DFC;
        }

        .nav-item span {
            font-size: 16px;
            font-weight: 500;
            color: #364153;
        }

        .nav-item.active span {
            color: #155DFC;
        }

        .sidebar-footer {
            border-top: 2px solid #e5e7eb;
            padding: 18px 16px;
        }

        /* Main Content */
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .header {
            background: white;
            border-bottom: 2px solid #e5e7eb;
            padding: 16px 24px;
        }

        .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .search-container {
            flex: 1;
            max-width: 500px;
            position: relative;
        }

        .search-input {
            width: 100%;
            height: 36px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 4px 12px 4px 36px;
            font-size: 13px;
            color: #374151;
        }

        .search-icon {
            position: absolute;
            left: 10px;
            top: 10px;
        }

        .user-section {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .notification-btn {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            border: none;
            background: none;
            cursor: pointer;
            position: relative;
        }

        .notification-badge {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 8px;
            height: 8px;
            background: #ef4444;
            border-radius: 50%;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #ececf0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 600;
        }

        .user-details {
            display: flex;
            flex-direction: column;
        }

        .user-name {
            font-size: 13px;
            font-weight: 600;
            color: #0a0a0a;
        }

        .user-role {
            font-size: 11px;
            color: #6b7280;
        }

        /* Content Area */
        .content {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
        }

        .page-header {
            margin-bottom: 20px;
        }

        .page-title {
            font-size: 28px;
            font-weight: 700;
            color: #0a0a0a;
            margin-bottom: 4px;
        }

        .page-subtitle {
            font-size: 13px;
            color: #6b7280;
        }

        /* Action Bar */
        .action-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .search-filter {
            display: flex;
            gap: 12px;
        }

        .table-search {
            position: relative;
        }

        .table-search input {
            width: 300px;
            height: 38px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 4px 12px 4px 36px;
            font-size: 13px;
        }

        .table-search svg {
            position: absolute;
            left: 10px;
            top: 11px;
        }

        .filter-btn {
            padding: 8px 16px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #374151;
        }

        .filter-btn:hover {
            background: #f9fafb;
        }

        .new-appointment-btn {
            padding: 10px 20px;
            background: #0a0a0a;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .new-appointment-btn:hover {
            background: #1a1a1a;
        }

        /* Appointments Table */
        .appointments-table {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            max-height: calc(100vh - 280px);
        }

        .table-wrapper {
            overflow-y: auto;
            flex: 1;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: #f9fafb;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        th {
            padding: 12px 16px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e5e7eb;
            background: #f9fafb;
        }

        td {
            padding: 16px;
            font-size: 13px;
            color: #374151;
            border-bottom: 1px solid #f3f4f6;
        }

        tbody tr:hover {
            background: #f9fafb;
        }

        /* Custom Scrollbar */
        .table-wrapper::-webkit-scrollbar {
            width: 8px;
        }

        .table-wrapper::-webkit-scrollbar-track {
            background: #f1f1f1;
        }

        .table-wrapper::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
        }

        .table-wrapper::-webkit-scrollbar-thumb:hover {
            background: #555;
        }

        .patient-info {
            display: flex;
            flex-direction: column;
        }

        .patient-name {
            font-weight: 600;
            color: #0a0a0a;
            margin-bottom: 2px;
        }

        .patient-id {
            font-size: 11px;
            color: #9ca3af;
        }

        .appointment-time {
            display: flex;
            flex-direction: column;
        }

        .appointment-date {
            font-weight: 500;
            color: #0a0a0a;
            margin-bottom: 2px;
        }

        .appointment-hour {
            font-size: 11px;
            color: #6b7280;
        }

        .status-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            display: inline-block;
            text-align: center;
        }

        .status-completed {
            background: #d1fae5;
            color: #065f46;
        }

        .status-progress {
            background: #dbeafe;
            color: #1e40af;
        }

        .status-waiting {
            background: #fef3c7;
            color: #92400e;
        }

        .status-scheduled {
            background: #ede9fe;
            color: #6b21a8;
        }

        .status-cancelled {
            background: #fee2e2;
            color: #991b1b;
        }

        .action-buttons {
            display: flex;
            gap: 8px;
        }

        .action-btn {
            width: 32px;
            height: 32px;
            border: 1px solid #e5e7eb;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .action-btn:hover {
            background: #f9fafb;
            border-color: #d1d5db;
        }

        .action-btn svg {
            width: 16px;
            height: 16px;
        }

        /* Modal Styles */
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        }

        .modal-overlay.active {
            display: flex;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        .modal {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .modal-header {
            padding: 24px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-title {
            font-size: 20px;
            font-weight: 700;
            color: #0a0a0a;
        }

        .modal-close {
            width: 32px;
            height: 32px;
            border: none;
            background: none;
            cursor: pointer;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-close:hover {
            background: #f3f4f6;
        }

        .modal-body {
            padding: 24px;
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .form-group.full-width {
            grid-column: 1 / -1;
        }

        .form-label {
            font-size: 13px;
            font-weight: 600;
            color: #374151;
        }

        .form-input, .form-select, .form-textarea {
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            color: #0a0a0a;
            transition: border-color 0.2s;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: #0066cc;
        }

        .form-textarea {
            resize: vertical;
            min-height: 80px;
        }

        .modal-footer {
            padding: 20px 24px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        .btn-secondary {
            padding: 10px 20px;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            color: #374151;
        }

        .btn-secondary:hover {
            background: #f9fafb;
        }

        .btn-primary {
            padding: 10px 20px;
            background: #0a0a0a;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }

        .btn-primary:hover {
            background: #1a1a1a;
        }

        /* Edit Modal Specific */
        .appointment-details {
            background: #f9fafb;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .detail-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
        }

        .detail-value {
            font-size: 13px;
            color: #0a0a0a;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="logo-container">
            <div class="logo-icon">
                <svg fill="none" viewBox="0 0 36 36">
                    <path d="M33 18H29.28C28.6245 17.9986 27.9865 18.212 27.4637 18.6075C26.9409 19.0029 26.562 19.5588 26.385 20.19L22.86 32.73C22.8373 32.8079 22.7899 32.8763 22.725 32.925C22.6601 32.9737 22.5811 33 22.5 33C22.4189 33 22.3399 32.9737 22.275 32.925C22.2101 32.8763 22.1627 32.8079 22.14 32.73L13.86 3.27C13.8373 3.19211 13.7899 3.12368 13.725 3.075C13.6601 3.02632 13.5811 3 13.5 3C13.4189 3 13.3399 3.02632 13.275 3.075C13.2101 3.12368 13.1627 3.19211 13.14 3.27L9.615 15.81C9.4387 16.4387 9.06207 16.9928 8.5423 17.388C8.02252 17.7833 7.38798 17.9981 6.735 18H3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="logo-text">
                <div class="logo-title">
                    <span class="logo-nex">NEX</span><span class="logo-care">CARE</span>
                </div>
                <div class="logo-subtitle">Administrative staff portal</div>
            </div>
        </div>

        <nav class="nav-menu">
            <button class="nav-item">
                <svg fill="none" viewBox="0 0 20 20">
                    <path d="M7.5 2.5H3.33333C2.8731 2.5 2.5 2.8731 2.5 3.33333V9.16667C2.5 9.6269 2.8731 10 3.33333 10H7.5C7.96024 10 8.33333 9.6269 8.33333 9.16667V3.33333C8.33333 2.8731 7.96024 2.5 7.5 2.5Z" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16.6667 2.5H12.5C12.0398 2.5 11.6667 2.8731 11.6667 3.33333V5.83333C11.6667 6.29357 12.0398 6.66667 12.5 6.66667H16.6667C17.1269 6.66667 17.5 6.29357 17.5 5.83333V3.33333C17.5 2.8731 17.1269 2.5 16.6667 2.5Z" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16.6667 10H12.5C12.0398 10 11.6667 10.3731 11.6667 10.8333V16.6667C11.6667 17.1269 12.0398 17.5 12.5 17.5H16.6667C17.1269 17.5 17.5 17.1269 17.5 16.6667V10.8333C17.5 10.3731 17.1269 10 16.6667 10Z" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7.5 13.3333H3.33333C2.8731 13.3333 2.5 13.7064 2.5 14.1667V16.6667C2.5 17.1269 2.8731 17.5 3.33333 17.5H7.5C7.96024 17.5 8.33333 17.1269 8.33333 16.6667V14.1667C8.33333 13.7064 7.96024 13.3333 7.5 13.3333Z" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Dashboard</span>
            </button>

            <button class="nav-item active">
                <svg fill="none" viewBox="0 0 19.0312 20">
                    <path d="M6.34375 2.07031V5.24219" stroke="#155DFC" stroke-width="1.58594" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12.6875 2.07031V5.24219" stroke="#155DFC" stroke-width="1.58594" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M15.0664 3.65625H3.96484C3.08895 3.65625 2.37891 4.3663 2.37891 5.24219V16.3438C2.37891 17.2196 3.08895 17.9297 3.96484 17.9297H15.0664C15.9423 17.9297 16.6523 17.2196 16.6523 16.3438V5.24219C16.6523 4.3663 15.9423 3.65625 15.0664 3.65625Z" stroke="#155DFC" stroke-width="1.58594" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2.37891 8.41406H16.6523" stroke="#155DFC" stroke-width="1.58594" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Manage Appointments</span>
            </button>

            <button class="nav-item">
                <svg fill="none" viewBox="0 0 17.4836 17.4836">
                    <path d="M11.6557 15.2993V13.8424C11.6557 13.0696 11.3487 12.3284 10.8022 11.7819C10.2557 11.2355 9.51457 10.9285 8.74175 10.9285H4.37086C3.59804 10.9285 2.85687 11.2355 2.31041 11.7819C1.76394 12.3284 1.45694 13.0696 1.45694 13.8424V15.2993" stroke="#364153" stroke-width="1.45696" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6.55631 8.01453C8.16562 8.01453 9.47023 6.70992 9.47023 5.1006C9.47023 3.49129 8.16562 2.18668 6.55631 2.18668C4.94699 2.18668 3.64238 3.49129 3.64238 5.1006C3.64238 6.70992 4.94699 8.01453 6.55631 8.01453Z" stroke="#364153" stroke-width="1.45696" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M11.6551 8.01453L13.1121 9.47149L16.026 6.55757" stroke="#364153" stroke-width="1.45696" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Patient Check-in</span>
            </button>

            <button class="nav-item">
                <svg fill="none" viewBox="0 0 19.9922 19.9922">
                    <path d="M1.66602 3.33203V16.6602" stroke="#364153" stroke-width="1.66602" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M1.66602 6.66406H16.6602C17.102 6.66406 17.5258 6.83959 17.8382 7.15203C18.1506 7.46447 18.3262 7.88822 18.3262 8.33008V16.6602" stroke="#364153" stroke-width="1.66602" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M1.66602 14.1611H18.3262" stroke="#364153" stroke-width="1.66602" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M4.99805 6.66406V14.1611" stroke="#364153" stroke-width="1.66602" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Bed Allocation</span>
            </button>

            <button class="nav-item">
                <svg fill="none" viewBox="0 0 20 20">
                    <path d="M9.16667 18.1083C9.42003 18.2546 9.70744 18.3316 10 18.3316C10.2926 18.3316 10.58 18.2546 10.8333 18.1083L16.6667 14.775C16.9198 14.6289 17.13 14.4187 17.2763 14.1657C17.4225 13.9127 17.4997 13.6256 17.5 13.3333V6.66667C17.4997 6.3744 17.4225 6.08734 17.2763 5.8343C17.13 5.58126 16.9198 5.37114 16.6667 5.225L10.8333 1.89167C10.58 1.74539 10.2926 1.66838 10 1.66838C9.70744 1.66838 9.42003 1.74539 9.16667 1.89167L3.33333 5.225C3.08022 5.37114 2.86998 5.58126 2.72372 5.8343C2.57745 6.08734 2.5003 6.3744 2.5 6.66667V13.3333C2.5003 13.6256 2.57745 13.9127 2.72372 14.1657C2.86998 14.4187 3.08022 14.6289 3.33333 14.775L9.16667 18.1083Z" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10 18.3333V10" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2.74167 5.83333L10 10L17.2583 5.83333" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6.25 3.55833L13.75 7.85" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Inventory</span>
            </button>

            <button class="nav-item">
                <svg fill="none" viewBox="0 0 20 20">
                    <path d="M13.3333 17.5V15.8333C13.3333 14.9493 12.9821 14.1014 12.357 13.4763C11.7319 12.8512 10.8841 12.5 10 12.5H5C4.11595 12.5 3.2681 12.8512 2.64298 13.4763C2.01786 14.1014 1.66667 14.9493 1.66667 15.8333V17.5" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7.5 9.16667C9.34095 9.16667 10.8333 7.67428 10.8333 5.83333C10.8333 3.99238 9.34095 2.5 7.5 2.5C5.65905 2.5 4.16667 3.99238 4.16667 5.83333C4.16667 7.67428 5.65905 9.16667 7.5 9.16667Z" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18.3333 17.5V15.8333C18.3328 15.0948 18.087 14.3773 17.6345 13.7936C17.182 13.2099 16.5484 12.793 15.8333 12.6083" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M13.3333 2.60833C14.0503 2.79192 14.6859 3.20892 15.1397 3.79359C15.5935 4.37827 15.8399 5.09736 15.8399 5.8375C15.8399 6.57764 15.5935 7.29673 15.1397 7.88141C14.6859 8.46608 14.0503 8.88308 13.3333 9.06667" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Staff Scheduling</span>
            </button>

            <button class="nav-item">
                <svg fill="none" viewBox="0 0 19.9922 19.9922">
                    <path d="M12.4951 1.66602H4.99805C4.55619 1.66602 4.13243 1.84154 3.82 2.15398C3.50756 2.46642 3.33203 2.89018 3.33203 3.33203V16.6602C3.33203 17.102 3.50756 17.5258 3.82 17.8382C4.13243 18.1506 4.55619 18.3262 4.99805 18.3262H14.9941C15.436 18.3262 15.8598 18.1506 16.1722 17.8382C16.4846 17.5258 16.6602 17.102 16.6602 16.6602V5.83105L12.4951 1.66602Z" stroke="#364153" stroke-width="1.66602" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M11.6621 1.66602V4.99805C11.6621 5.4399 11.8376 5.86366 12.1501 6.1761C12.4625 6.48854 12.8863 6.66406 13.3281 6.66406H16.6602" stroke="#364153" stroke-width="1.66602" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8.33008 7.49707H6.66406" stroke="#364153" stroke-width="1.66602" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M13.3281 10.8291H6.66406" stroke="#364153" stroke-width="1.66602" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M13.3281 14.1611H6.66406" stroke="#364153" stroke-width="1.66602" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Generate Bill</span>
            </button>

            <button class="nav-item">
                <svg fill="none" viewBox="0 0 19.9922 19.9922">
                    <path d="M17.4932 12.4951C17.4932 12.937 17.3176 13.3607 17.0052 13.6732C16.6928 13.9856 16.269 14.1611 15.8271 14.1611H5.83105L2.49902 17.4932V4.16504C2.49902 3.72318 2.67455 3.29943 2.98699 2.98699C3.29943 2.67455 3.72318 2.49902 4.16504 2.49902H15.8271C16.269 2.49902 16.6928 2.67455 17.0052 2.98699C17.3176 3.29943 17.4932 3.72318 17.4932 4.16504V12.4951Z" stroke="#364153" stroke-width="1.66602" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Feedback</span>
            </button>
        </nav>

        <div class="sidebar-footer">
            <button class="nav-item">
                <svg fill="none" viewBox="0 0 20 20">
                    <path d="M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M13.3333 14.1667L17.5 10L13.3333 5.83333" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M17.5 10H7.5" stroke="#364153" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Logout</span>
            </button>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Header -->
        <header class="header">
            <div class="header-content">
                <div class="search-container">
                    <svg class="search-icon" width="16" height="16" fill="none" viewBox="0 0 16 16">
                        <circle cx="7" cy="7" r="5" stroke="#9ca3af" stroke-width="1.5"/>
                        <path d="M11 11l3 3" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <input type="text" class="search-input" placeholder="Search patients, appointments, or records...">
                </div>
                <div class="user-section">
                    <button class="notification-btn">
                        <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                            <path d="M15 6.66667C15 5.34058 14.4732 4.06881 13.5355 3.13113C12.5979 2.19345 11.3261 1.66667 10 1.66667C8.67392 1.66667 7.40215 2.19345 6.46447 3.13113C5.52678 4.06881 5 5.34058 5 6.66667C5 12.5 2.5 14.1667 2.5 14.1667H17.5C17.5 14.1667 15 12.5 15 6.66667Z" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M11.4417 17.5C11.2952 17.7526 11.0849 17.9622 10.8319 18.1079C10.5789 18.2537 10.292 18.3304 10 18.3304C9.70802 18.3304 9.42115 18.2537 9.16815 18.1079C8.91515 17.9622 8.70484 17.7526 8.55835 17.5" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span class="notification-badge"></span>
                    </button>
                    <div class="user-info">
                        <div class="avatar">AD</div>
                        <div class="user-details">
                            <div class="user-name">Admin User</div>
                            <div class="user-role">Administrator</div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Content -->
        <div class="content">
            <div class="page-header">
                <h1 class="page-title">Manage Appointments</h1>
                <p class="page-subtitle">View and manage all patient appointments</p>
            </div>

            <div class="action-bar">
                <div class="search-filter">
                    <div class="table-search">
                        <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                            <circle cx="7" cy="7" r="5" stroke="#9ca3af" stroke-width="1.5"/>
                            <path d="M11 11l3 3" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        <input type="text" id="searchTable" placeholder="Search by patient name, ID, or doctor...">
                    </div>
                    <button class="filter-btn">
                        <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                            <path d="M2 4h12M4 8h8M6 12h4" stroke="#374151" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        All Status
                    </button>
                    <button class="filter-btn">
                        <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                            <rect x="3" y="3" width="10" height="10" rx="2" stroke="#374151" stroke-width="1.5"/>
                            <path d="M3 6h10M6 3v3M10 3v3" stroke="#374151" stroke-width="1.5"/>
                        </svg>
                        All Department
                    </button>
                </div>
                <button class="new-appointment-btn" onclick="openNewAppointmentModal()">
                    <span style="font-size: 18px; line-height: 1;">+</span>
                    New Appointment
                </button>
            </div>

            <div class="appointments-table">
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Appointment ID</th>
                                <th>Patient</th>
                                <th>Doctor</th>
                                <th>Department</th>
                                <th>Date & Time</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="appointmentsTableBody">
                            <!-- Data will be populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <!-- New Appointment Modal -->
    <div class="modal-overlay" id="newAppointmentModal">
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">New Appointment</h2>
                <button class="modal-close" onclick="closeModal('newAppointmentModal')">
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                        <path d="M15 5L5 15M5 5l10 10" stroke="#374151" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="newAppointmentForm" onsubmit="handleNewAppointment(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Patient Name</label>
                            <input type="text" class="form-input" placeholder="Enter patient name" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Patient ID</label>
                            <input type="text" class="form-input" placeholder="PT0000" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Doctor</label>
                            <select class="form-select" required>
                                <option value="">Select doctor</option>
                                <option value="Dr. Robert Smith">Dr. Robert Smith</option>
                                <option value="Dr. Emily Williams">Dr. Emily Williams</option>
                                <option value="Dr. James Brown">Dr. James Brown</option>
                                <option value="Dr. Maria Martinez">Dr. Maria Martinez</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Department</label>
                            <select class="form-select" required>
                                <option value="">Select department</option>
                                <option value="Cardiology">Cardiology</option>
                                <option value="Orthopedics">Orthopedics</option>
                                <option value="Neurology">Neurology</option>
                                <option value="General Medicine">General Medicine</option>
                                <option value="Pediatrics">Pediatrics</option>
                                <option value="Dermatology">Dermatology</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Time</label>
                            <input type="time" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Appointment Type</label>
                            <select class="form-select" required>
                                <option value="">Select type</option>
                                <option value="Follow-up">Follow-up</option>
                                <option value="Consultation">Consultation</option>
                                <option value="Initial Visit">Initial Visit</option>
                                <option value="Check-up">Check-up</option>
                                <option value="Vaccination">Vaccination</option>
                                <option value="Surgery Consultation">Surgery Consultation</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <select class="form-select" required>
                                <option value="Scheduled">Scheduled</option>
                                <option value="Completed">Completed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Waiting">Waiting</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label class="form-label">Notes (Optional)</label>
                            <textarea class="form-textarea" placeholder="Add any additional notes here..."></textarea>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal('newAppointmentModal')">Cancel</button>
                <button class="btn-primary" onclick="document.getElementById('newAppointmentForm').requestSubmit()">Create Appointment</button>
            </div>
        </div>
    </div>

    <!-- Edit Appointment Modal -->
    <div class="modal-overlay" id="editAppointmentModal">
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">Edit Appointment</h2>
                <button class="modal-close" onclick="closeModal('editAppointmentModal')">
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                        <path d="M15 5L5 15M5 5l10 10" stroke="#374151" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="appointment-details" id="editAppointmentDetails">
                    <!-- Details will be populated by JavaScript -->
                </div>
                <form id="editAppointmentForm" onsubmit="handleEditAppointment(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="editStatus" required>
                                <option value="Scheduled">Scheduled</option>
                                <option value="Completed">Completed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Waiting">Waiting</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">New Date (Optional)</label>
                            <input type="date" class="form-input" id="editDate">
                        </div>
                        <div class="form-group full-width">
                            <label class="form-label">Notes</label>
                            <textarea class="form-textarea" id="editNotes" placeholder="Add notes about this appointment..."></textarea>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal('editAppointmentModal')">Cancel</button>
                <button class="btn-primary" onclick="document.getElementById('editAppointmentForm').requestSubmit()">Save Changes</button>
            </div>
        </div>
    </div>

    <!-- View Appointment Modal -->
    <div class="modal-overlay" id="viewAppointmentModal">
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">Appointment Details</h2>
                <button class="modal-close" onclick="closeModal('viewAppointmentModal')">
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                        <path d="M15 5L5 15M5 5l10 10" stroke="#374151" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="appointment-details" id="viewAppointmentDetails">
                    <!-- Details will be populated by JavaScript -->
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal('viewAppointmentModal')">Close</button>
                <button class="btn-primary" onclick="editFromView()">Edit Appointment</button>
            </div>
        </div>
    </div>

    <script>
        // Sample appointments data
        let appointments = [
            {
                id: 'APT001',
                patient: 'Sarah Johnson',
                patientId: 'PT2301',
                doctor: 'Dr. Robert Smith',
                department: 'Cardiology',
                date: '2026-03-08',
                time: '09:00 AM',
                type: 'Follow-up',
                status: 'Completed'
            },
            {
                id: 'APT002',
                patient: 'Michael Chen',
                patientId: 'PT2302',
                doctor: 'Dr. Emily Williams',
                department: 'Orthopedics',
                date: '2026-03-08',
                time: '10:30 AM',
                type: 'Consultation',
                status: 'In Progress'
            },
            {
                id: 'APT003',
                patient: 'Emily Davis',
                patientId: 'PT2303',
                doctor: 'Dr. James Brown',
                department: 'Neurology',
                date: '2026-03-08',
                time: '01:30 PM',
                type: 'Initial Visit',
                status: 'Waiting'
            },
            {
                id: 'APT004',
                patient: 'Robert Wilson',
                patientId: 'PT2304',
                doctor: 'Dr. Maria Martinez',
                department: 'General Medicine',
                date: '2026-03-09',
                time: '09:00 AM',
                type: 'Check-up',
                status: 'Scheduled'
            },
            {
                id: 'APT005',
                patient: 'Lisa Anderson',
                patientId: 'PT2305',
                doctor: 'Dr. David Lee',
                department: 'Pediatrics',
                date: '2026-03-09',
                time: '02:30 PM',
                type: 'Vaccination',
                status: 'Scheduled'
            },
            {
                id: 'APT006',
                patient: 'James Taylor',
                patientId: 'PT2306',
                doctor: 'Dr. Sarah Thompson',
                department: 'Dermatology',
                date: '2026-03-09',
                time: '03:00 PM',
                type: 'Consultation',
                status: 'Scheduled'
            },
            {
                id: 'APT007',
                patient: 'Maria Garcia',
                patientId: 'PT2307',
                doctor: 'Dr. Robert Smith',
                department: 'Cardiology',
                date: '2026-03-10',
                time: '11:00 AM',
                type: 'Follow-up',
                status: 'Scheduled'
            },
            {
                id: 'APT008',
                patient: 'David Brown',
                patientId: 'PT2308',
                doctor: 'Dr. Emily Williams',
                department: 'Orthopedics',
                date: '2026-03-10',
                time: '11:30 AM',
                type: 'Surgery Consultation',
                status: 'Cancelled'
            }
        ];

        let currentEditingAppointment = null;

        // Render appointments table
        function renderAppointments(data = appointments) {
            const tbody = document.getElementById('appointmentsTableBody');
            tbody.innerHTML = '';

            data.forEach(apt => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${apt.id}</td>
                    <td>
                        <div class="patient-info">
                            <div class="patient-name">${apt.patient}</div>
                            <div class="patient-id">${apt.patientId}</div>
                        </div>
                    </td>
                    <td>${apt.doctor}</td>
                    <td>${apt.department}</td>
                    <td>
                        <div class="appointment-time">
                            <div class="appointment-date">${apt.date}</div>
                            <div class="appointment-hour">${apt.time}</div>
                        </div>
                    </td>
                    <td>${apt.type}</td>
                    <td><span class="status-badge status-${apt.status.toLowerCase().replace(' ', '')}">${apt.status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn" onclick="viewAppointment('${apt.id}')" title="View">
                                <svg fill="none" viewBox="0 0 16 16">
                                    <circle cx="8" cy="8" r="2" stroke="#374151" stroke-width="1.5"/>
                                    <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="#374151" stroke-width="1.5"/>
                                </svg>
                            </button>
                            <button class="action-btn" onclick="editAppointment('${apt.id}')" title="Edit">
                                <svg fill="none" viewBox="0 0 16 16">
                                    <path d="M11.333 2A1.886 1.886 0 0114 4.667l-9 9-3.667.666.667-3.666 9-9z" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button class="action-btn" onclick="deleteAppointment('${apt.id}')" title="Delete">
                                <svg fill="none" viewBox="0 0 16 16">
                                    <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Modal functions
        function openModal(modalId) {
            document.getElementById(modalId).classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        function openNewAppointmentModal() {
            document.getElementById('newAppointmentForm').reset();
            openModal('newAppointmentModal');
        }

        function viewAppointment(id) {
            const apt = appointments.find(a => a.id === id);
            if (!apt) return;

            const detailsDiv = document.getElementById('viewAppointmentDetails');
            detailsDiv.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Appointment ID</span>
                    <span class="detail-value">${apt.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Patient</span>
                    <span class="detail-value">${apt.patient} (${apt.patientId})</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Doctor</span>
                    <span class="detail-value">${apt.doctor}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Department</span>
                    <span class="detail-value">${apt.department}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date & Time</span>
                    <span class="detail-value">${apt.date} at ${apt.time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type</span>
                    <span class="detail-value">${apt.type}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status</span>
                    <span class="detail-value"><span class="status-badge status-${apt.status.toLowerCase().replace(' ', '')}">${apt.status}</span></span>
                </div>
            `;
            currentEditingAppointment = id;
            openModal('viewAppointmentModal');
        }

        function editAppointment(id) {
            const apt = appointments.find(a => a.id === id);
            if (!apt) return;

            const detailsDiv = document.getElementById('editAppointmentDetails');
            detailsDiv.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Appointment ID</span>
                    <span class="detail-value">${apt.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Patient</span>
                    <span class="detail-value">${apt.patient} (${apt.patientId})</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Doctor</span>
                    <span class="detail-value">${apt.doctor}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Current Date & Time</span>
                    <span class="detail-value">${apt.date} at ${apt.time}</span>
                </div>
            `;

            document.getElementById('editStatus').value = apt.status;
            document.getElementById('editDate').value = '';
            document.getElementById('editNotes').value = '';
            
            currentEditingAppointment = id;
            openModal('editAppointmentModal');
        }

        function editFromView() {
            closeModal('viewAppointmentModal');
            if (currentEditingAppointment) {
                editAppointment(currentEditingAppointment);
            }
        }

        function deleteAppointment(id) {
            if (confirm('Are you sure you want to delete this appointment?')) {
                appointments = appointments.filter(a => a.id !== id);
                renderAppointments();
                alert('Appointment deleted successfully');
            }
        }

        // Handle new appointment form submission
        function handleNewAppointment(e) {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            
            // Generate new appointment ID
            const newId = 'APT' + String(appointments.length + 1).padStart(3, '0');
            
            // Create new appointment object
            const newAppointment = {
                id: newId,
                patient: form.elements[0].value,
                patientId: form.elements[1].value,
                doctor: form.elements[2].value,
                department: form.elements[3].value,
                date: form.elements[4].value,
                time: form.elements[5].value,
                type: form.elements[6].value,
                status: form.elements[7].value
            };
            
            appointments.unshift(newAppointment);
            renderAppointments();
            closeModal('newAppointmentModal');
            alert('New appointment created successfully!');
        }

        // Handle edit appointment form submission
        function handleEditAppointment(e) {
            e.preventDefault();
            const apt = appointments.find(a => a.id === currentEditingAppointment);
            if (!apt) return;

            const newStatus = document.getElementById('editStatus').value;
            const newDate = document.getElementById('editDate').value;
            
            apt.status = newStatus;
            if (newDate) apt.date = newDate;
            
            renderAppointments();
            closeModal('editAppointmentModal');
            alert('Appointment updated successfully!');
        }

        // Search functionality
        document.getElementById('searchTable').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredAppointments = appointments.filter(apt => 
                apt.patient.toLowerCase().includes(searchTerm) ||
                apt.patientId.toLowerCase().includes(searchTerm) ||
                apt.doctor.toLowerCase().includes(searchTerm) ||
                apt.id.toLowerCase().includes(searchTerm) ||
                apt.department.toLowerCase().includes(searchTerm)
            );
            renderAppointments(filteredAppointments);
        });

        // Close modal when clicking outside
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal(this.id);
                }
            });
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', function() {
                const text = this.querySelector('span').textContent;
                if (text === 'Logout') {
                    if (confirm('Are you sure you want to logout?')) {
                        alert('Logged out successfully');
                    }
                } else if (text !== 'Manage Appointments') {
                    alert(`Navigating to: ${text}`);
                }
            });
        });

        // Initialize
        renderAppointments();
    </script>
</body>
</html>
