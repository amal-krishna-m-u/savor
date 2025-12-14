# Savor MVP Walkthrough

This document outlines the implemented features, architecture, and instructions for running the Savor MVP.

## 🚀 Key Features Built

### 1. **Restaurant Dashboard**
- **Menu Management**: Restaurants can view, edit, and add menu items.
- **AI Menu Scanner**: Stub for uploading menu images to extract items using Gemini.
- **QR Code Management**: Manage table-specific QR codes (Signed URLs).
- **Tech**: Next.js App Router, Shadcn UI, oRPC, Conform + Zod.

### 2. **Customer "Eat" Experience**
- **Scan & Order**: Customers scan a QR code to land on a unified menu page.
- **Secure Access**: URL signatures prevent table ID tampering.
- **Unified Cart**: powered by **Zustand**, persisted locally.
- **AI Waiter**: A floating chat interface to ask for recommendations (Stubbed).

### 3. **Architecture**
- **Database**: Supabase (PostgreSQL) + Prisma ORM.
- **API**: **oRPC** (Type-safe Server Actions) + **Zod**.
- **Validation**: **Conform** for forms, **Standard Schema Adapter** for API.
- **Auth**: Supabase Auth (Email/Password + Google).

## 🛠️ How to Run Locally

1.  **Install Dependencies**:
    ```bash
    cd web
    npm install
    ```
2.  **Environment Setup**:
    - Create `.env` based on `.env.example`.
    - Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Access at `http://localhost:3000`.

## 📦 Deployment (Google Cloud Run)

1.  **Build Docker Image**:
    ```bash
    docker build -t savor-web ./web
    ```
2.  **Run Container**:
    ```bash
    docker run -p 3000:3000 --env-file web/.env savor-web
    ```

## ✅ Verification Results

- **Build**: Passed `npm run build` (Next.js 16 + Turbopack).
- **Type Safety**: Full TypeScript coverage for DB, API, and UI.
- **Validation**: Forms and APIs validated with Zod.

## ⚠️ Notes for User
- The **AI Menu Scanner** and **AI Waiter** are currently stubs waiting for your Vertex AI / Gemini API keys.
- **Prisma** schema is defined but waiting for a real DB connection string to run `db push`.
