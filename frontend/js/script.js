// script.js — shared frontend logic for public & admin pages

const API_ROOT = ''; // leave blank if backend serves frontend statically (on same origin)
// If backend is hosted separately, set here: e.g. 'https://your-backend-url.com'

/**
 * Utility: fetch JSON with error handling
 */
async function fetchJson(url, opts = {}) {
  try {
    const response = await fetch(API_ROOT + url, opts);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

/**
 * NAV toggle for mobile
 */
function setupNav(toggleId, navId) {
  const t = document.getElementById(toggleId);
  const nav = document.getElementById(navId);
  if (!t || !nav) return;
  t.addEventListener('click', () => {
    nav.classList.toggle('show');
  });
}
setupNav('navToggle', 'mainNav');
setupNav('navToggle2', 'mainNav2');

/**
 * REGISTER PAGE logic
 */
const regForm = document.getElementById('registerForm');
if (regForm) {
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const regId = document.getElementById('regId').value.trim();
    const resultDiv = document.getElementById('regResult') || document.getElementById('result');
    resultDiv.innerHTML = '<em>Registering...</em>';
    const res = await fetchJson('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, regId })
    });
    if (!res.ok) {
      const errMsg = (res.data && res.data.error) ? res.data.error : `Status ${res.status}`;
      resultDiv.innerHTML = `<span class="error">Error: ${errMsg}</span>`;
      return;
    }
    const { participant, qrDataUrl } = res.data;
    resultDiv.innerHTML = `
      <p class="muted">Registered ✓ — your QR code:</p>
      <img src="${qrDataUrl}" alt="QR Code for ${participant.regId}" class="qr-image" />
      <p class="muted small">You can save or print this QR for attendance.</p>
    `;
  });
}

/**
 * ADMIN LOGIN logic
 */
const adminForm = document.getElementById('adminForm');
if (adminForm) {
  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('adminUser')?.value.trim();
    const password = document.getElementById('adminPass')?.value.trim();
    const statusDiv = document.getElementById('adminStatus') || document.getElementById('status');
    if (!username || !password) {
      statusDiv.textContent = 'Please fill username & password';
      return;
    }
    statusDiv.textContent = 'Logging in...';
    const res = await fetchJson('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const errMsg = (res.data && res.data.error) ? res.data.error : `Status ${res.status}`;
      statusDiv.textContent = `Error: ${errMsg}`;
      return;
    }
    localStorage.setItem('adminToken', res.data.token);
    statusDiv.textContent = 'Logged in ✓ Redirecting to scanner...';
    setTimeout(() => {
      window.location.href = '/attendance.html';
    }, 800);
  });
}

/**
 * ATTENDANCE / SCANNER page logic
 */
if (document.getElementById('reader')) {
  const startBtn = document.getElementById('startScanner');
  const stopBtn = document.getElementById('stopScanner');
  const refreshBtn = document.getElementById('refreshList');
  const exportBtn = document.getElementById('exportBtn');
  const tableBody = document.querySelector('#participantsTable tbody');
  let scanner = null;
  const token = localStorage.getItem('adminToken');

  // Helper: load participants list if endpoint exists
  async function loadParticipants() {
    if (!token) {
      tableBody.innerHTML = `<tr><td colspan="4" class="muted">Login required to view list.</td></tr>`;
      return;
    }
    try {
      const res = await fetchJson('/api/scan/all', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) {
        tableBody.innerHTML = `<tr><td colspan="4">No participant list endpoint or error: ${res.status}</td></tr>`;
        return;
      }
      const list = res.data;
      if (!Array.isArray(list)) {
        tableBody.innerHTML = `<tr><td colspan="4">Invalid data from server.</td></tr>`;
        return;
      }

      tableBody.innerHTML = '';
      list.forEach(p => {
        const tr = document.createElement('tr');
        const statusText = p.attended ? 'Present' : 'Absent';
        const timeText = p.timestamp ? new Date(p.timestamp).toLocaleTimeString() : '-';
        tr.innerHTML = `
          <td>${p.name}</td>
          <td>${p.regId}</td>
          <td>${statusText}</td>
          <td>${timeText}</td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="4">Load error: ${err.message}</td></tr>`;
    }
  }

  // Start scanner
  startBtn.addEventListener('click', async () => {
    if (!token) {
      alert('Please login as admin first.');
      return;
    }
    try {
      scanner = new Html5Qrcode("reader");
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          // decodedText assumed to be the regId
          const res = await fetchJson('/api/attendance/mark', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ regId: decodedText })
          });
          if (!res.ok) {
            const msg = (res.data && res.data.error) ? res.data.error : `Status ${res.status}`;
            alert(`Error: ${msg}`);
          } else {
            alert(`Success: ${decodedText}`);
            // reload list to show change
            loadParticipants();
          }
        },
        (error) => {
          console.warn('QR scan error', error);
        }
      );
      startBtn.disabled = true;
      stopBtn.disabled = false;
    } catch (err) {
      alert('Cannot start scanner: ' + err.message);
    }
  });

  // Stop scanner
  stopBtn.addEventListener('click', () => {
    if (scanner) {
      scanner.stop()
        .then(() => {
          startBtn.disabled = false;
          stopBtn.disabled = true;
          document.getElementById('reader').innerHTML = '';
        })
        .catch(err => console.error('Error stopping scanner:', err));
    }
  });

  // RefreshList button
  refreshBtn.addEventListener('click', loadParticipants);

  // Export button
  exportBtn.addEventListener('click', async () => {
    if (!token) {
      alert('Login required for export');
      return;
    }
    const res = await fetch(API_ROOT + '/api/export', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      const err = await res.text();
      alert('Export failed: ' + err);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Auto load participants when page loads
  document.addEventListener('DOMContentLoaded', () => {
    loadParticipants();
  });
}

