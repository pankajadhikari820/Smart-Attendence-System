const { initializeApp } = require("https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js");
const { getDatabase, ref, onValue, update, get } = require("https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js");

// Replace with your own Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB8dA1ZW13UtbdmeUGahFjRJkht7RXu1Lc",
  authDomain: "attendence-system-867c1.firebaseapp.com",
  databaseURL: "https://attendence-system-867c1-default-rtdb.firebaseio.com",
  projectId: "attendence-system-867c1",
  storageBucket: "attendence-system-867c1.firebasestorage.app",
  messagingSenderId: "1067385874361",
  appId: "1:1067385874361:web:da3ffbe331505b6a7e7868",
  measurementId: "G-BCM285Q750"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const dataBody = document.getElementById("dataBody");
const searchInput = document.getElementById("searchInput");
let allData = [];

// Real-time data fetch
const dbRef = ref(db, "registrations");
onValue(dbRef, (snapshot) => {
  dataBody.innerHTML = "";
  allData = [];
  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      allData.push(data);
      const row = `<tr>
        <td>${data.id}</td>
        <td>${data.name}</td>
        <td>${data.email}</td>
        <td>${data.eventType}</td>
        <td>${data.time}</td>
        <td>${data.checkedIn ? 'Yes' : 'No'}</td>
      </tr>`;
      dataBody.innerHTML += row;
    });
    document.getElementById("status").innerText = `✅ ${allData.length} entries loaded`;
  } else {
    dataBody.innerHTML = `<tr><td colspan="6">No records found</td></tr>`;
  }
});

// Search Filter
searchInput.addEventListener("keyup", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = allData.filter(
    d => (d.name || '').toLowerCase().includes(query) || (d.email || '').toLowerCase().includes(query)
  );

  dataBody.innerHTML = "";
  filtered.forEach((data) => {
    const row = `<tr>
      <td>${data.id}</td>
      <td>${data.name}</td>
      <td>${data.email}</td>
      <td>${data.eventType}</td>
      <td>${data.time}</td>
      <td>${data.checkedIn ? 'Yes' : 'No'}</td>
    </tr>`;
    dataBody.innerHTML += row;
  });
});

// Check-in by pasted/scanned payload (registration id)
const scanInput = document.getElementById('scanInput');
const checkInBtn = document.getElementById('checkInBtn');
const statusEl = document.getElementById('status');

checkInBtn.addEventListener('click', async () => {
  const payload = (scanInput.value || '').trim();
  if (!payload) { statusEl.innerText = 'Paste QR payload or registration id'; return; }

  try {
    const regRef = ref(db, `registrations/${payload}`);
    const snap = await get(regRef);
    if (snap.exists()) {
      await update(regRef, { checkedIn: true });
      statusEl.innerText = `✅ Checked-in: ${snap.val().name || payload}`;
    } else {
      statusEl.innerText = '❌ Registration not found';
    }
  } catch (err) {
    statusEl.innerText = '❌ Error during check-in: ' + err.message;
  }
});

// Optional camera QR scanner using html5-qrcode (reads payload text and auto-checks-in)
let html5QrcodeScanner = null;
const startScannerBtn = document.getElementById('startScannerBtn');
const stopScannerBtn = document.getElementById('stopScannerBtn');

startScannerBtn.addEventListener('click', () => {
  if (html5QrcodeScanner) return;
  const readerId = "reader";
  html5QrcodeScanner = new Html5Qrcode(readerId);
  Html5Qrcode.getCameras().then(devices => {
    if (devices.length) {
      html5QrcodeScanner.start(
        devices[0].id,
        { facingMode: "environment" },
        (decodedText, decodedResult) => {
          scanInput.value = decodedText;
          checkInBtn.click();
        },
        (errorMessage) => { }
      ).catch(err => {
        statusEl.innerText = '❌ Camera access error: ' + err;
      });
    }
  }).catch(err => {
    statusEl.innerText = '❌ Camera access error: ' + err;
  });
});

stopScannerBtn.addEventListener('click', () => {
  if (!html5QrcodeScanner) return;
  html5QrcodeScanner.stop().then(() => {
    statusEl.innerText = 'Scanner stopped';
  }).catch(err => {
    statusEl.innerText = '❌ Stop failed: ' + err;
  });
});