import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-check.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Keep closed until the privacy, safeguarding and anti-abuse controls are approved.
// Enabling only this front-end flag is not enough: the Firestore rule must be opened too.
const PUBLIC_INTAKE_OPEN = false;
// Before opening intake, register the Student Portal web app in Firebase App Check
// with reCAPTCHA v3 and put its site key here. Keep this placeholder until then.
const APP_CHECK_SITE_KEY = "REPLACE_WITH_STUDENT_PORTAL_RECAPTCHA_V3_SITE_KEY";
const $ = (id) => document.getElementById(id);
const form = $("supportRequestForm");
const statusBox = $("requestStatus");

function setStatus(message, type = "error") {
  statusBox.className = `request-status show ${type}`;
  statusBox.textContent = message;
}

function setFormEnabled(enabled) {
  form.querySelectorAll("input,select,textarea,button").forEach((el) => { el.disabled = !enabled; });
  $("intakeClosed").hidden = enabled;
  $("submitRequestButton").disabled = !enabled;
}

const configReady = Object.values(firebaseConfig).every((v) =>
  typeof v === "string" && v.trim() && !v.startsWith("REPLACE_WITH_")
);
let db = null;
let appCheckReady = false;
if (PUBLIC_INTAKE_OPEN && configReady && APP_CHECK_SITE_KEY && !APP_CHECK_SITE_KEY.startsWith("REPLACE_WITH_")) {
  try {
    const app = initializeApp(firebaseConfig);
    initializeAppCheck(app, { provider: new ReCaptchaV3Provider(APP_CHECK_SITE_KEY), isTokenAutoRefreshEnabled: true });
    appCheckReady = true;
    db = getFirestore(app);
    setFormEnabled(true);
  } catch (error) {
    console.error("Firebase setup failed:", error);
    setStatus("The request form is not available right now. Please try again later.");
  }
} else {
  setFormEnabled(false);
  if (PUBLIC_INTAKE_OPEN && configReady) {
    setStatus("The request form remains closed until Firebase App Check is configured for this web app.");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!PUBLIC_INTAKE_OPEN || !db || !configReady || !appCheckReady) {
    setStatus("Requests are currently closed. No information has been sent or stored.");
    return;
  }
  if (!form.reportValidity()) return;

  const payload = {
    preferredName: $("preferredName").value.trim(),
    contactEmail: $("contactEmail").value.trim().toLowerCase(),
    institution: $("institution").value.trim(),
    concernType: $("concernType").value,
    summary: $("summary").value.trim(),
    privacyAcknowledged: $("privacyAcknowledged").checked,
    status: "new",
    source: "public-website",
    createdAt: serverTimestamp()
  };
  if (payload.preferredName.length < 2 || payload.institution.length < 2 || payload.summary.length < 30 || payload.summary.length > 1500 || !payload.privacyAcknowledged) {
    setStatus("Please check the required fields and privacy acknowledgement.");
    return;
  }
  const button = $("submitRequestButton");
  button.disabled = true;
  button.textContent = "Sending request…";
  try {
    const ref = await addDoc(collection(db, "supportRequests"), payload);
    form.reset();
    setStatus(`Your request was submitted. Save this reference number for any follow-up: ${ref.id}. S.H.I.E.L.D. will review the request when its team is available. This is not a guarantee of assistance or an outcome.`, "success");
  } catch (error) {
    console.error("Support request failed:", error);
    setStatus(error.code === "permission-denied"
      ? "The request service is not accepting submissions yet. No request was saved. Please try again later."
      : "We couldn't submit the request. Please try again later; do not send sensitive documents through this form.");
  } finally {
    button.disabled = false;
    button.textContent = "Request support";
  }
});
