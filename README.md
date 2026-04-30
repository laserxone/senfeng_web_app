# Next.js Project Setup Guide

This project is built using **Next.js** and **shadcn/ui**.

---

## 📦 Installation

First, install all dependencies:

```bash
npm install
```

or if you use yarn:

```bash
yarn install
```

---

## ⚙️ Environment Variables

1. Rename the environment file:

```bash
mv .env.example .env
```

2. Open the `.env` file and replace all `<key>` placeholders with your actual values:

```
DATABASE_URL=
DATABASE_URL_UNPOOLED=
NEXT_PUBLIC_APIKEY=
NEXT_PUBLIC_AUTHDOMAIN=
NEXT_PUBLIC_PROJECTID=
NEXT_PUBLIC_STORAGEBUCKET=
NEXT_PUBLIC_MESSAGINGSENDERID=
NEXT_PUBLIC_APPID=
NEXT_PUBLIC_MEASUREMENTID=
NEXT_PUBLIC_MAP_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
FIREBASE_SERVICE_ACCOUNT_BASE64=
FIREBASE_API_KEY=
FIREBASE_STORAGE_BUCKET=
```

---

## 🧩 Adding UI Components (shadcn)

To add a new component:

```bash
npx shadcn@latest add button
```

This will generate components inside the `components/ui` directory.

---

## ▶️ Running the Development Server

Start the development server:

```bash
npm run dev
```

or

```bash
yarn dev
```

The app will be available at:

```
http://localhost:3000
```

---

## 🏗️ Creating Production Build

To build the app for production:

```bash
npm run build
```

or

```bash
yarn build
```

---

## 🚀 Starting Production Server

After building, start the production server:

```bash
npm run start
```

or

```bash
yarn start
```

---

## 🧹 Additional Commands

### Lint Code

```bash
npm run lint
```

---

## 📁 Project Structure

```
/components     → UI and reusable components
/app            → App router pages
/public         → Static assets
```

---

## ✅ Notes

- Make sure `.env` is properly configured before running the app.
- Never commit `.env` to version control.
