document.addEventListener("DOMContentLoaded", () => {  
    const scanInput = document.getElementById('scanInput');  
    const checkInBtn = document.getElementById('checkInBtn');  
    const statusEl = document.getElementById('status');  
    const startScannerBtn = document.getElementById('startScannerBtn');  
    const stopScannerBtn = document.getElementById('stopScannerBtn');  
    const readerDiv = document.getElementById('reader');  let html5QrcodeScanner = null;  
let lastScanned = null;  
let scanCooldown = false;  

function setStatus(text, isError = false) {  
  statusEl.textContent = text;  
  statusEl.style.color = isError ? '#b91c1c' : '#0b6623';  
}  

function extractIdFromPayload(payload) {  
  if (!payload) return '';  
  try {  
    const u = new URL(payload);  
    return u.searchParams.get('id') || u.searchParams.get('payload') || '';  
  } catch (e) {  
    const s = payload.trim();  
    return /^[0-9A-Za-z\-_]+$/.test(s) ? s : '';  
  }  
}  

async function tryFirebaseCheckin(id) {  
  if (!window.__FIREBASE_CONFIG) return { ok: false, reason: 'no-firebase' };  
  try {  
    const mod = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js');  
    const dbmod = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js');  
    const app = mod.initializeApp(window.__FIREBASE_CONFIG);  
    const db = dbmod.getDatabase(app);  
    const ref = dbmod.ref(db, `registrations/${id}`);  
    const snap = await dbmod.get(ref);  
    if (!snap.exists()) return { ok: false, reason: 'not-found' };  
    const attendee = snap.val();  
    if (attendee.checkedIn) return { ok: true, already: true, attendee };  
    const now = new Date().toLocaleString();  
    await dbmod.update(ref, { checkedIn: true, checkedInAt: now, checked_in_at: now });  
    attendee.checkedIn = true;  
    attendee.checkedInAt = now;  
    return { ok: true, attendee };  
  } catch (err) {  
    console.error('Firebase checkin error', err);  
    return { ok: false, reason: 'error', err };  
  }  
}  

async function backendCheckin(id) {  
  try {  
    const res = await fetch('/api/checkin', {  
      method: 'POST',  
      headers: { 'Content-Type': 'application/json' },  
      body: JSON.stringify({ payload: id })  
    });  
    const body = await res.json().catch(() => ({}));  
    return { ok: res.ok && body && body.success, body, status: res.status };  
  } catch (err) {  
    console.warn('Backend unreachable', err);  
    return { ok: false, error: err };  
  }  
}  

async function performCheckin(raw) {  
  const id = extractIdFromPayload(raw);  
  if (!id) { setStatus('Invalid id or payload', true); return; }  

  // prevent duplicate rapid actions  
  if (scanCooldown) { setStatus('Please wait…'); return; }  
  scanCooldown = true;  
  setTimeout(() => scanCooldown = false, 1200);  

  setStatus('Processing…');  

  // first try backend  
  const be = await backendCheckin(id);  
  if (be.ok) {const attendee = be.body.attendee || {};  
    setStatus(`Checked-in: ${attendee.name || id}`);  
    showCertificateLink(id);  
    return;  
  }  

  // if backend failed/unreachable, try firebase fallback  
  const fb = await tryFirebaseCheckin(id);  
  if (fb.ok) {  
    setStatus(fb.already ? `Already checked-in: ${fb.attendee.name || id}` : `Checked-in: ${fb.attendee.name || id}`);  
    showCertificateLink(id);  
    return;  
  }  

  // nothing worked  
  setStatus('Check-in failed. Open admin to debug.', true);  
  console.warn('Checkin failed', { backend: be, firebase: fb });  
}  

function showCertificateLink(id) {  
  // create or update certificate anchor next to status  
  let a = document.getElementById('certLink');  
  if (!a) {  
    a = document.createElement('a');  
    a.id = 'certLink';  
    a.textContent = 'Download Certificate';  
    a.target = '_blank';  
    a.rel = 'noopener';  
    a.style.marginLeft = '12px';  
    statusEl.parentNode.appendChild(a);  
  }  
  a.href = `/api/certificate/${encodeURIComponent(id)}.pdf`;  
  a.style.display = 'inline-block';  
}  

checkInBtn.addEventListener('click', () => {  
  performCheckin(scanInput.value || '');  
});  

async function startScanner() {  
  if (html5QrcodeScanner) return;  
  try {  
    setStatus('Requesting camera…');  
    const devices = await Html5Qrcode.getCameras();  
    if (!devices || devices.length === 0) { setStatus('No camera found', true); return; }  
    const cameraId = devices[0].id;  
    html5QrcodeScanner = new Html5Qrcode(readerDiv.id);  
    await html5QrcodeScanner.start(  
      cameraId,  
      { fps: 10, qrbox: 250 },  
      (decodedText) => {  
        // debounce duplicate reads  
        if (decodedText === lastScanned) return;  
        lastScanned = decodedText;  
        performCheckin(decodedText);  
        setTimeout(() => lastScanned = null, 1200);  
      },  
      (error) => {  
        // decode errors — ignore  
      }  
    );  
    startScannerBtn.disabled = true;  
    stopScannerBtn.disabled = false;  
    setStatus('Scanner running…');  
  } catch (err) {  
    console.error('Scanner start failed', err);  
    setStatus('Scanner start failed: ' + (err?.message || err), true);  
    if (html5QrcodeScanner) { try { await html5QrcodeScanner.clear(); } catch(e){} html5QrcodeScanner = null; }  
  }  
}  

async function stopScanner() {  
  if (!html5QrcodeScanner) { setStatus('Scanner not running', true); return; }  
  try {  
    await html5QrcodeScanner.stop();  
    await html5QrcodeScanner.clear();  
    html5QrcodeScanner = null;  
    startScannerBtn.disabled = false;  
    stopScannerBtn.disabled = true;  
    setStatus('Scanner stopped');  
  } catch (err) {  
    console.error('Stop failed', err);  
    setStatus('Stop failed: ' + (err?.message || err), true);  
  }  
}  

startScannerBtn.addEventListener('click', startScanner);  
stopScannerBtn.addEventListener('click', stopScanner);  

// auto-check id from url: home.html?id=1234  
(function initFromUrl() {  
  const p = new URLSearchParams(location.search);  
  const id = p.get('id') || p.get('payload') || '';  
  if (id) {  
    scanInput.value = id;  
    performCheckin(id);  
  }  
})();

});
