# Lakoo SaaS - Client Application 🚀

Lakoo SaaS Client is the frontend application for a sophisticated, multi-tenant Enterprise Resource Planning (ERP) platform designed for Small and Medium Enterprises (SMEs). Built with modern web technologies, it provides a highly responsive, secure, and intuitive dashboard for managing retail operations, inventory, finances, and business intelligence.

---

## 🌟 Key Features

### 🛒 Point of Sale (POS)
- **Stateful Cart**: Manages multiple items with real-time total calculation and tax integration.
- **Payment Flow**: Support for varied payment methods including Cash, Bank Transfer, and QRIS.
- **Receipts**: Automatic print-ready receipt generation upon successful transaction.
- **Offline Resilience**: Caches products for faster searching and resilience during slow network connections.

### 📦 Inventory Management
- **Cataloging**: Comprehensive UI for managing SKUs, Pricing (HPP/Sell Price), and Stock Units.
- **Stock Guard**: Visual indicators highlighting low-stock items based on custom minimum thresholds.
- **Data Operations**: Interfaces for bulk importing and exporting product data via CSV.
- **Real-time Sync**: Instant stock deduction syncing across multiple cashier sessions.

### 💼 Financial Ledger
- **Audit View**: Paginated and filterable lists of all income and expenses.
- **Real-time Metrics**: Visual dashboard calculating active Balance, Total Income, and Total Expenses.
- **PDF Reports**: Export professional balance sheets and financial statements for accounting purposes.

### 🤖 AI-Powered Analytics
- **Sales Insights**: Interactive charts showing rolling revenue and performance trends over time.
- **Demand Projection**: AI-recommended restocking quantities based on transaction density and historical data.

---

## 🛠️ Tech Stack

| Technology | Description |
| :--- | :--- |
| **React 18** | Declarative UI for building interactive user interfaces. |
| **TypeScript** | Static typing for robust, error-free code at scale. |
| **Zustand** | Lightweight and fast global state management (Auth, Theme, etc). |
| **TanStack Query** | Powerful asynchronous server-state management and caching. |
| **Tailwind CSS** | Utility-first CSS framework for rapid UI development. |
| **Shadcn UI** | High-quality, accessible, and customizable UI components. |
| **Vite** | Next-generation frontend tooling for lightning-fast HMR and building. |

---

## 🔐 Role-Based Access Control (RBAC)

The frontend dynamically adjusts UI elements and routing based on the authenticated user's role:

1. **👑 Owner**: Has unrestricted access to all modules, including Staff Management, high-level Finance Ledger, and Strategic Insights.
2. **👔 Manager**: Has access to daily shop operations, inventory management, and transaction ledgers. Excluded from Staff Management and critical configurations.
3. **🏷️ Cashier**: Restricted primarily to the POS module and basic inventory browsing. Sensitive financial data like Cost Price (HPP) and Profit charts are strictly hidden.

---

## 📂 Directory Structure

```text
client/
├── src/
│   ├── components/          # Reusable UI Atoms & Feature Components
│   │   ├── dashboard/       # Specialized KPI and Chart widgets
│   │   ├── finance/         # Ledger tables and input forms
│   │   ├── inventory/       # Product tables and modal drawers
│   │   └── customer/        # CRM related UI elements
│   ├── hooks/               # Custom TanStack Query hooks for API synchronization
│   ├── pages/               # Routed view components (POS, Reports, etc.)
│   ├── store/               # Zustand global state (Auth, Theme, Sidebar)
│   ├── lib/                 # Core utilities (API Axios instances, tools)
│   └── App.tsx              # Main Navigation & Provider orchestration
├── .env                     # Environment configuration (API URLs)
└── package.json             # Frontend dependencies and scripts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer recommended)
- npm or yarn

### Installation
1. Clone this repository and navigate to the client directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env` (ensure `VITE_API_BASE_URL` points to the backend server).
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api/v1
   VITE_AI_BASE_URL=http://localhost:8000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Access the application at `http://localhost:5173` (or the port specified by Vite).

---

## 📜 License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute this software in compliance with the license terms.

---

## ✨ Closing Words & Acknowledgements

Thank you for exploring the Lakoo SaaS Client repository! We built this frontend to be as intuitive and fast as possible to empower business owners and their staff. Whether you are a cashier processing a high volume of transactions, or a manager analyzing daily reports, we hope this interface makes your daily operations smoother.

If you find this project useful, consider giving it a star! ⭐ Feedback and contributions are always welcome.

*Developed with ❤️ by **Indal Awalaikal**.*
