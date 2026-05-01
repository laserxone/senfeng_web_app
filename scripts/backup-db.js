// const { execSync } = require("child_process");
// const fs = require("fs");
// const path = require("path");

import fs from 'fs'
import path from 'path';
import admin from "firebase-admin"
import { execSync } from 'child_process';

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!serviceAccountBase64)
  throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is missing");
const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountBase64, "base64").toString("utf-8"),
);
const DB_URL =
  process.env.NEON_DATABASE_URL_UNPOOLED || process.env.NEON_DATABASE_URL;

if (!DB_URL) throw new Error("NEON_DATABASE_URL is missing");

if (!process.env.FIREBASE_STORAGE_BUCKET)
  throw new Error("FIREBASE_STORAGE_BUCKET is missing");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const bucket = admin.storage().bucket();

(async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `backup-${timestamp}.dump`;
  const filePath = path.join(process.cwd(), fileName);

  try {
    console.log("Starting pg_dump...");

    execSync(`pg_dump -Fc "${DB_URL}" -f ${filePath}`, {
      stdio: "inherit",
    });

    console.log("Uploading to Firebase Storage...");

    await bucket.upload(filePath, {
      destination: `postgres-backups/${fileName}`,
      gzip: true,
    });

    const [files] = await bucket.getFiles({ prefix: "postgres-backups/" });
    const retainDays = 30; 

    for (const file of files) {
      if (file.name === `postgres-backups/${fileName}`) continue; 
      const match = file.name.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
      if (!match) continue;

      const fileDate = new Date(match[0]);
      if (
        (Date.now() - fileDate.getTime()) / (1000 * 60 * 60 * 24) >
        retainDays
      ) {
        await file.delete();
        console.log(`Deleted old backup: ${file.name}`);
      }
    }

    console.log("Backup completed successfully");
  } catch (err) {
    console.error("Backup failed:", err);
  } finally {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
})();
