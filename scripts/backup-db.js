const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");



const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));
const DB_URL = process.env.NEON_DATABASE_URL;

if (!DB_URL) throw new Error("NEON_DATABASE_URL is missing");
if (!serviceAccountBase64) throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is missing");
if (!process.env.FIREBASE_STORAGE_BUCKET) throw new Error("FIREBASE_STORAGE_BUCKET is missing");


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

  console.log("Starting pg_dump...");

 execSync(`pg_dump -Fc "${DB_URL}" -f ${filePath}`, {
  stdio: "inherit",
});

  console.log("Uploading to Firebase Storage...");

  await bucket.upload(filePath, {
    destination: `postgres-backups/${fileName}`,
    gzip: true,
  });

  fs.unlinkSync(filePath);
  console.log("Backup completed successfully");
})();
