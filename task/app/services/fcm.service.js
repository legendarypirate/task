const admin = require("firebase-admin");

let initialized = false;

function initFirebaseAdmin() {
  if (initialized) return true;
  try {
    const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (jsonStr && jsonStr.trim()) {
      const creds = JSON.parse(jsonStr);
      admin.initializeApp({ credential: admin.credential.cert(creds) });
      initialized = true;
      console.log("[FCM] firebase-admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON");
      return true;
    }
    if (path && path.trim()) {
      const fs = require("fs");
      const pathMod = require("path");
      const creds = JSON.parse(fs.readFileSync(pathMod.resolve(path), "utf8"));
      admin.initializeApp({ credential: admin.credential.cert(creds) });
      initialized = true;
      console.log("[FCM] firebase-admin initialized from FIREBASE_SERVICE_ACCOUNT_PATH");
      return true;
    }
    console.warn(
      "[FCM] Not configured: set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH"
    );
    return false;
  } catch (e) {
    console.error("[FCM] firebase-admin init failed:", e.message);
    return false;
  }
}

/**
 * @param {string[]} tokens
 * @param {{ title: string, body: string, data?: Record<string,string> }} payload
 * @returns {Promise<{ successCount: number, failureCount: number }>}
 */
async function sendToTokens(tokens, { title, body, data = {} }) {
  if (!initFirebaseAdmin() || !tokens.length) {
    return { successCount: 0, failureCount: tokens.length };
  }

  const unique = [...new Set(tokens.filter(Boolean))];
  if (!unique.length) return { successCount: 0, failureCount: 0 };

  const dataStrings = {};
  Object.entries(data).forEach(([k, v]) => {
    dataStrings[k] = v == null ? "" : String(v);
  });

  let successCount = 0;
  let failureCount = 0;
  const chunkSize = 500;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const message = {
      notification: { title, body },
      data: dataStrings,
      tokens: chunk,
    };
    const res = await admin.messaging().sendEachForMulticast(message);
    successCount += res.successCount;
    failureCount += res.failureCount;
  }

  return { successCount, failureCount };
}

module.exports = {
  initFirebaseAdmin,
  isFcmReady: () => initFirebaseAdmin(),
  sendToTokens,
};
