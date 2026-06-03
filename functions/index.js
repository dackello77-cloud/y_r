const admin = require("firebase-admin");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const webpush = require("web-push");

admin.initializeApp();

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

exports.sendDonePush = onDocumentUpdated("requests/{requestId}", async event => {
  const before = event.data.before.data() || {};
  const after = event.data.after.data() || {};

  if (before.status === "DONE" || after.status !== "DONE") return;
  if (!after.customerUsername) return;
  if (!publicKey || !privateKey) {
    console.error("Missing VAPID keys.");
    return;
  }

  const snap = await admin.firestore()
    .collection("pushSubscriptions")
    .where("customerUsername", "==", after.customerUsername)
    .get();

  if (snap.empty) return;

  const payload = JSON.stringify({
    title: "DONE",
    body: "DONE",
    tag: `yr-done-${event.params.requestId}`,
    url: "index%20(15).html"
  });

  await Promise.all(snap.docs.map(async doc => {
    const data = doc.data();
    const subscription = data.subscription;
    if (!subscription || !subscription.endpoint) return;

    try {
      await webpush.sendNotification(subscription, payload);
    } catch (err) {
      const code = err && (err.statusCode || err.status);
      console.error("Push error", doc.id, code, err && err.message);
      if (code === 404 || code === 410) {
        await doc.ref.delete();
      }
    }
  }));
});
