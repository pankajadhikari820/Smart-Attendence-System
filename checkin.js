        document.addEventListener("DOMContentLoaded", () => {
  const scanInput = document.getElementById('scanInput');
  const checkInBtn = document.getElementById('checkInBtn');
  const statusEl = document.getElementById('status');
  const startScannerBtn = document.getElementById('startScannerBtn');
  const stopScannerBtn = document.getElementById('stopScannerBtn');
  const readerDiv = document.getElementById('reader');
  const cameraSelect = document.getElementById('cameraSelect');

  let html5QrcodeScanner = null;
  let lastScanned = null;
  let scanCooldown = false;
  let cameras = [];

  // --- Helper Functions ---
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

  async function performCheckin(raw) {
    const id = extractIdFromPayload(raw);
    if (!id) {
      setStatus('Invalid QR or registration ID', true);
      return;
    }
    if (scanCooldown) {
      setStatus('Please wait...');
      return;
    }
    scanCooldown = true;
    setTimeout(() => scanCooldown = false, 1200);

    setStatus(`Processing check-in for ${id}...`);

    // Simulated success for testing
    setTimeout(() => {
      setStatus(`✅ Checked-in successfully: ${id}`);
      showCertificateLink(id);
    }, 1000);
  }

  function showCertificateLink(id) {
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

  // --- Scanner Logic ---
  async function populateCameras() {
    try {
      setStatus('Fetching cameras...');
      cameras = await Html5Qrcode.getCameras();
      cameraSelect.innerHTML = '';
      if (cameras.length === 0) {
        setStatus('No camera found', true);
        return;
      }
      cameras.forEach((cam, idx) => {
        const opt = document.createElement('option');
        opt.value = cam.id;
        opt.textContent = cam.label || `Camera ${idx + 1}`;
        cameraSelect.appendChild(opt);
      });
      setStatus('Select a camera and start scanning');
    } catch (err) {
      setStatus('Error fetching cameras: ' + err.message, true);
    }
  }

  async function startScanner() {
    if (html5QrcodeScanner) return;
    try {
      const cameraId = cameraSelect.value || (cameras[0] && cameras[0].id);
      if (!cameraId) {
        setStatus('No camera selected', true);
        return;
      }

      html5QrcodeScanner = new Html5Qrcode(readerDiv.id);
      await html5QrcodeScanner.start(
        cameraId,
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          if (decodedText === lastScanned) return;
          lastScanned = decodedText;
          performCheckin(decodedText);
          setTimeout(() => lastScanned = null, 1500);
        }
      );
      startScannerBtn.disabled = true;
      stopScannerBtn.disabled = false;
      setStatus('📷 Scanner running...');
    } catch (err) {
      console.error('Scanner start failed', err);
      setStatus('Scanner start failed: ' + err.message, true);
      if (html5QrcodeScanner) {
        try { await html5QrcodeScanner.clear(); } catch(e){}
        html5QrcodeScanner = null;
      }
    }
  }

  async function stopScanner() {
    if (!html5QrcodeScanner) {
      setStatus('Scanner not running', true);
      return;
    }
    try {
      await html5QrcodeScanner.stop();
      await html5QrcodeScanner.clear();
      html5QrcodeScanner = null;
      startScannerBtn.disabled = false;
      stopScannerBtn.disabled = true;
      setStatus('Scanner stopped');
    } catch (err) {
      setStatus('Stop failed: ' + err.message, true);
    }
  }

  // --- Events ---
  checkInBtn.addEventListener('click', () => performCheckin(scanInput.value));
  startScannerBtn.addEventListener('click', startScanner);
  stopScannerBtn.addEventListener('click', stopScanner);

  // Initialize
  populateCameras();
});
