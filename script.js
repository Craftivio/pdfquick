/* ============================================================
   script.js — All JavaScript Logic for PDFQuick
   This ONE file handles: auth, file management, page routing
   ============================================================ */

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GA4 EVENT TRACKING HELPERS
   Use these to track conversions on every tool page
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function trackEvent(name, params) {
  if (typeof gtag === 'function') {
    gtag('event', name, params || {});
  }
  // Also log to console so you can verify in DevTools
  console.log('📊 GA Event:', name, params);
}

function trackToolStart(toolName) {
  trackEvent('tool_start', { tool_name: toolName });
}

function trackToolSuccess(toolName, fileCount) {
  trackEvent('tool_success', { tool_name: toolName, file_count: fileCount || 1 });
  // This is the KEY conversion event — mark it as a conversion in GA Admin
}

function trackToolError(toolName, errorMsg) {
  trackEvent('tool_error', { tool_name: toolName, error: String(errorMsg).substring(0, 100) });
}

function trackDownload(toolName) {
  trackEvent('file_downloaded', { tool_name: toolName });
}

function trackSignup(method) {
  trackEvent('sign_up', { method: method || 'email' });
}

function trackLogin(method) {
  trackEvent('login', { method: method || 'email' });
}




/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 1: HELPER UTILITIES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// Get the current page filename (e.g. "dashboard.html")
function currentPage() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

// Format bytes into KB / MB
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Show a status message in the auth message box
function showAuthMessage(text, type = 'error') {
  const el = document.getElementById('auth-message');
  if (!el) return;
  el.textContent = text;
  el.className = 'auth-message ' + type;
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 2: AUTH (Login / Signup / Logout)
   Will fully work after Step 2 (Supabase setup)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

async function handleSignup() {
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  if (!email || !password) {
    showAuthMessage('Please fill in all fields.'); return;
  }
  if (password.length < 6) {
    showAuthMessage('Password must be at least 6 characters.'); return;
  }

  // Show loading state on button
  const btn = document.querySelector('#form-signup .btn-primary');
  const original = btn.textContent;
  btn.textContent = 'Creating account…';
  btn.disabled = true;

  const { data, error } = await db.auth.signUp({ email, password });

  btn.textContent = original;
  btn.disabled = false;

  if (error) {
    showAuthMessage(error.message, 'error');
  } else {
    showAuthMessage('✅ Account created! Check your email to confirm.', 'success');
  }
}

async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showAuthMessage('Please fill in all fields.'); return;
  }

  // Show loading state on button
  const btn = document.querySelector('#form-login .btn-primary');
  const original = btn.textContent;
  btn.textContent = 'Logging in…';
  btn.disabled = true;

  const { data, error } = await db.auth.signInWithPassword({ email, password });

  btn.textContent = original;
  btn.disabled = false;

  if (error) {
    showAuthMessage(error.message, 'error');
  } else {
    window.location.href = 'dashboard.html';
  }
}

async function handleLogout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}

// Switch between Login and Signup tabs on login.html
function showTab(tab) {
  document.getElementById('form-login').classList.toggle('hidden',  tab !== 'login');
  document.getElementById('form-signup').classList.toggle('hidden', tab !== 'signup');
  document.getElementById('tab-login').classList.toggle('active',   tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active',  tab === 'signup');
  document.getElementById('auth-message').className = 'auth-message hidden';
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 3: PAGE INITIALIZERS
   Each function runs when its page loads.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

async function initDashboard() {
  // Redirect to login if not logged in
  const { data: { session } } = await db.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return; }

  // Show user email in navbar
  const emailEl = document.getElementById('user-email');
  if (emailEl) emailEl.textContent = session.user.email;

  // Load files from database (Step 5 will set this up)
  loadUserFiles(session.user.id);
}

async function initMergePage() {
  // Update navbar based on login state
  const { data: { session } } = await db.auth.getSession();
  const navArea = document.getElementById('nav-auth-area');
  if (!navArea) return;

  if (session) {
    navArea.innerHTML = `
      <span class="user-email-display">${session.user.email}</span>
      <a href="dashboard.html" class="btn btn-ghost">Dashboard</a>
      <button class="btn btn-ghost" onclick="handleLogout()">Logout</button>
    `;
  } else {
    navArea.innerHTML = `
      <a href="login.html" class="btn btn-ghost">Login</a>
      <a href="login.html#signup" class="btn btn-primary">Sign up free</a>
    `;
  }

  // Set up drag and drop on the upload zone
  setupDropZone();
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 4: PDF MERGE TOOL
   Uses pdf-lib (loaded via CDN in merge.html)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

let selectedFiles = []; // Array to store selected File objects

// Called when the user picks files
function handleFileSelect(newFiles) {
  const pdfFiles = Array.from(newFiles).filter(f => f.type === 'application/pdf');

  if (pdfFiles.length === 0) {
    alert('Please select PDF files only.');
    return;
  }

  selectedFiles = [...selectedFiles, ...pdfFiles];
  renderFileList();
}

// Render the list of selected files
function renderFileList() {
  const section   = document.getElementById('file-list-section');
  const listEl    = document.getElementById('file-list');
  const countEl   = document.getElementById('file-count');

  if (selectedFiles.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  countEl.textContent = selectedFiles.length;

  listEl.innerHTML = selectedFiles.map((file, index) => `
    <li>
      <span class="file-list-icon">📄</span>
      <span class="file-list-name">${file.name}</span>
      <span class="file-list-size">${formatBytes(file.size)}</span>
      <button class="file-list-remove" onclick="removeFile(${index})" title="Remove">✕</button>
    </li>
  `).join('');
}

// Remove a file from the list
function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFileList();
  if (selectedFiles.length === 0) {
    document.getElementById('file-list-section').classList.add('hidden');
  }
}

// Clear all selected files
function clearFiles() {
  selectedFiles = [];
  document.getElementById('file-list-section').classList.add('hidden');
  document.getElementById('file-input').value = '';
}

// The main merge function
async function mergePDFs() {
  if (selectedFiles.length < 2) {
    alert('Please select at least 2 PDF files to merge.');
    return;
  }

  const btn = document.getElementById('merge-btn');
  btn.textContent = '⏳ Merging...';
  btn.disabled = true;

  try {
    // 1. Create a new empty PDF document
    const mergedPdf = await PDFLib.PDFDocument.create();

    // 2. Loop through each selected file
    for (const file of selectedFiles) {
      // Read the file as bytes
      const bytes = await file.arrayBuffer();
      // Load it as a PDF
      const pdf = await PDFLib.PDFDocument.load(bytes);
      // Copy all its pages
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      // Add each page to the merged document
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    // 3. Save the merged PDF
    const mergedBytes = await mergedPdf.save();

    // 4. Create a download link
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);

    // Show result section
    document.getElementById('download-link').href = url;
    document.getElementById('result-info').textContent =
      `${selectedFiles.length} files merged · ${formatBytes(mergedBytes.length)}`;

    document.getElementById('file-list-section').classList.add('hidden');
    document.getElementById('result-section').classList.remove('hidden');
    document.getElementById('upload-zone').classList.add('hidden');

    // 5. Save file info to database (if logged in)
    saveFileRecord('merged.pdf', mergedBytes.length);

  } catch (err) {
    alert('Error merging PDFs: ' + err.message);
    console.error(err);
  }

  btn.textContent = '🔗 Merge PDFs';
  btn.disabled = false;
}

// Reset the tool to its initial state
function resetTool() {
  selectedFiles = [];
  document.getElementById('result-section').classList.add('hidden');
  document.getElementById('upload-zone').classList.remove('hidden');
  document.getElementById('file-input').value = '';
}

// Drag-and-drop support
function setupDropZone() {
  const zone = document.getElementById('upload-zone');
  const input = document.getElementById('file-input');
  if (!zone || !input) return;

  // File input change event
  input.addEventListener('change', () => handleFileSelect(input.files));

  // Drag events
  zone.addEventListener('dragover',  (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', ()  => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFileSelect(e.dataTransfer.files);
  });
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 5: DATABASE (Supabase)
   Saves file records and loads them on dashboard
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// Save a record of the merged file (called after merging)
async function saveFileRecord(fileName, fileSize) {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return; // Only save if logged in

  const { error } = await db.from('files').insert({
    user_id:   session.user.id,
    file_name: fileName,
    file_size: fileSize,
  });

  if (error) console.error('Error saving file record:', error.message);
}

// Load the user's files on the dashboard page
async function loadUserFiles(userId) {
  const { data: files, error } = await db
    .from('files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) { console.error(error); return; }

  const listEl  = document.getElementById('files-list');
  const statEl  = document.getElementById('stat-total');
  if (!listEl) return;

  // Update stats
  if (statEl) statEl.textContent = files.length;

  if (files.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <p>No files yet. <a href="merge.html">Merge your first PDF →</a></p>
      </div>`;
    return;
  }

  // Render file rows
  listEl.innerHTML = files.map(file => `
    <div class="file-row">
      <span class="file-row-icon">📄</span>
      <span class="file-row-name">${file.file_name}</span>
      <span class="file-row-date">
        ${new Date(file.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        })}
      </span>
    </div>
  `).join('');
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 6: AUTO-INIT (runs on page load)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

document.addEventListener('DOMContentLoaded', () => {
  const page = currentPage();

  if (page === 'dashboard.html') initDashboard();
  if (page === 'merge.html')     initMergePage();
});
