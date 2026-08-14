# BLOOD-CONNECT

> **Location-Based Blood Matching & Real-Time Donor Coordination Platform**  
> Developed & Licensed by **Purushotham Reddy**

BloodConnect is a high-accuracy, location-based blood coordination platform designed to connect blood receivers with verified, compatible nearby donors in real-time. Built with **PostgreSQL + PostGIS**, **Express.js**, **Socket.IO**, **React**, and **Leaflet (OpenStreetMap)** with a pure 2-tier architecture (**Donor** and **Receiver**).

---

## 🩸 Key Features

1. **🗺️ PostGIS Spatial Matching Engine**:
   - Stores donor and request points strictly as `GEOGRAPHY(Point, 4326)`.
   - Uses PostGIS spatial queries (`ST_DWithin` & `ST_Distance` in meters) with GiST indexing.
   - Dynamic urgency search radii (`NORMAL`: 10km, `URGENT`: 20km, `CRITICAL`: 30km).
   - Honors individual donor notification radii (`notification_radius * 1000 >= ST_Distance`).

2. **🔒 Strict Privacy Preservation**:
   - Exact GPS coordinates, home addresses, and phone numbers are never returned in public APIs.
   - Computes safe, deterministic approximate map coordinates (`approximateLocation`) and distances (`distanceKm`).

3. **⚡ 60 FPS Hardware-Accelerated Leaflet Map & Real-Time Sync**:
   - Interactive OpenStreetMap with custom DivIcon markers (🩸 blood drop request marker, 📍 donor status pins).
   - Turn-by-turn Google Maps Directions (native app on mobile, web browser on laptop/desktop).
   - Real-time updates via Socket.IO (`blood:matches:updated`, `blood:request:updated`, `chat:message`).

4. **💬 Real-Time In-App Coordination Chat**:
   - Instant logistical messaging between Requesters and Accepted Donors without sharing personal phone numbers.

5. **🔥 City-Wide Donor Density Heatmap**:
   - PostGIS `ST_SnapToGrid` spatial clustering showing anonymous donor density by blood group across the city.

6. **⏱️ Donation Eligibility Timer & Impact Badges**:
   - Server-side 56-day donation interval countdown timer and lifesaver stats for donors.

7. **🛡️ Concurrency & Atomic Fulfillment**:
   - PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) to prevent race conditions and over-fulfillment.

---

## 🏗️ Tech Stack

- **Frontend**: React, Vite, Leaflet, OpenStreetMap, Socket.IO-Client, TailwindCSS
- **Backend**: Node.js, Express.js, Socket.IO, PostgreSQL, PostGIS
- **Testing**: Jest, Supertest

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+) with **PostGIS** extension enabled (`CREATE EXTENSION postgis;`)

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your DB_USER, DB_PASSWORD, DB_NAME in .env
node database/migrate.js
node database/seeds/seed.js
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Running Tests
```bash
cd backend
npm test
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.  
Copyright (c) 2026 **Purushotham Reddy**.
