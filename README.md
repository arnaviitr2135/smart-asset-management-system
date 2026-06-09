# CultTrack AI: Smart Asset Management & Resource Allocation Platform

CultTrack AI is a full-stack booking, inventory, and resource allocation platform developed for the Cultural Council of IIT Roorkee to manage shared assets (e.g. DSLR Cameras, Studio Lights, Sound Systems, Costumes). 

It features an embedded **AI-driven shortage predictor** that uses historical bookings to forecast demand trends and prevent stock exhaustion.

---

## 🛠️ Technology Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** PostgreSQL
- **Orchestration:** Docker, Docker Compose

---

## 🚀 Getting Started

### Prerequisites
Make sure you have **Docker Desktop** installed and running on your local machine.

### Run via Docker Compose (Recommended)
This runs the entire system including PostgreSQL, backend services, and the frontend web portal in unified containers.

1. Open a terminal in the project directory.
2. Run the build and launch command:
   ```bash
   docker compose up --build
   ```
3. The server will perform database migrations, seed default items, and start listening:
   - **Frontend Web Portal:** [http://localhost:5173](http://localhost:5173)
   - **Backend API Server:** [http://localhost:5000](http://localhost:5000)

---

## 🔑 Demo Access Credentials

The database is pre-seeded with two accounts and standard assets for verification:

| Role | Username | Password | Actions / Access |
| --- | --- | --- | --- |
| **Council Admin** | `admin@culttrack.in` | `password123` | Asset CRUD, Booking Approval Queue, Check-in/Check-out Desk, Security Audits |
| **Society Member** | `member@culttrack.in` | `password123` | Browsing catalog, checking availability, placing loan requests, tracking returns |

*Note: You can also use the registration form to create new accounts. For administrative roles during development, tick the "Register as Council Admin?" checkbox on the sign-up form.*

---

## 💎 Core Features & Verification Guide

### 1. Inventory & Booking Desk
- Browse items grouped by category with live count meters.
- Select booking dates and quantity. The backend runs overlapping check equations to prevent booking quantities that exceed physical inventory limits.

### 2. Admin Approvals & Handover
- Log in as `admin@culttrack.in`.
- Open **Admin Desk** &rarr; **Requests & Issuance**.
- Review pending requests. Click **Approve** to authorize the loan, and then **Handover / Issue** once the member physically collects the gear.

### 3. QR Code Operations
- Open the **Inventory Manager** sub-tab in the Admin Desk to click the QR code icon next to any asset and render its generated identification link.
- Open the **Check-in Desk (QR)** and pick any asset model in the dropdown to simulate scanning. This instantly parses the asset record, shows live stock details, and enables rapid check-in operations.

### 4. Damage & Health Reports
- When checking in an asset, admins can mark it as `DAMAGED`.
- This automatically logs a report in the **Health Logs** table and transitions the asset's operational status to `MAINTENANCE`, removing it from the catalog.

### 5. Audit Compliance
- All creations, updates, approvals, checkouts, and returns are permanently written to the **System Audit Log** database, accessible under the compliance sub-panel in the Admin Desk.

### 6. AI Booking Forecasts
- Go to the **Analytics & AI** tab.
- The system graphs current utilization rates and showcases a **Demand Predictor** table.
- Utilizing a weekly weighted moving average, it predicts item volume needs for next week and triggers `CRITICAL SHORTAGE` alarms if forecast levels approach total quantities.
