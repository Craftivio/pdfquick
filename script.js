/* ============================================================
   script.js — PDFQuick v2.0
   Handles: auth (email + GitHub OAuth), nav, merge, dashboard
   ============================================================ */

/* ━━━━ 1. UTILITIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function currentPage() {
  return window.location.pathname.split('/').pop() || 'index.html';
}
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
function showAuthMessage(text, type = 'error') {
  const el = document.getElementById('auth-message');
  if (!el) return;
  el.textContent = text;
  el.className = 'auth-message ' + type;
}

/* ━━━━ 2. NAV AUTH (runs on every tool page) ━━━━━━━━━━━━━━━ */
async function initNavAuth() {
  const navArea = document.getElementById('nav-auth-area');
  if (!navArea) return;
  try {
    const { data: { session } } = await db.auth.getSession();
    if (session) {
      navArea.innerHTML = `
        <span class="user-email-display">${session.user.email || 'GitHub User'}</span>
        <a href="dashboard.html" class="btn btn-ghost">Dashboard</a>
        <button class="btn btn-ghost" onclick="handleLogout()">Logout</button>`;
    } else {
      navArea.innerHTML = `
        <a href="login.html" class="btn btn-ghost">Login</a>
        <a href="login.html#signup" class="btn btn-primary">Sign up free</a>`;
    }
  } catch(e) {
    navArea.innerHTML = `
      <a href="login.html" class="btn btn-ghost">Login</a>
      <a href="login.html#signup" class="btn btn-primary">Sign up free</a>`;
  }
}

/* ━━━━ 3. AUTH — Email + GitHub ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function handleSignup() {
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  if (!email || !password) { showAuthMessage('Please fill in all fields.'); return; }
  if (password.length < 6) { showAuthMessage('Password must be at least 6 characters.'); return; }
  const btn = document.querySelector('#form-signup .btn-primary');
  const orig = btn.textContent; btn.textContent = 'Creating account…'; btn.disabled = true;
  const { error } = await db.auth.signUp({ email, password });
  btn.textContent = orig; btn.disabled = false;
  if (error) showAuthMessage(error.message, 'error');
  else showAuthMessage('✅ Account created! Check your email to confirm.', 'success');
}

async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showAuthMessage('Please fill in all fields.'); return; }
  const btn = document.querySelector('#form-login .btn-primary');
  const orig = btn.textContent; btn.textContent = 'Logging in…'; btn.disabled = true;
  const { error } = await db.auth.signInWithPassword({ email, password });
  btn.textContent = orig; btn.disabled = false;
  if (error) showAuthMessage(error.message, 'error');
  else window.location.href = 'dashboard.html';
}

async function handleGitHubLogin() {
  const { error } = await db.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: 'https://www.usepdfquick.com/dashboard.html' }
  });
  if (error) showAuthMessage('GitHub login error: ' + error.message, 'error');
}

async function handleLogout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}

function showTab(tab) {
  document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('form-signup').classList.toggle('hidden', tab !== 'signup');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('auth-message').className = 'auth-message hidden';
}

/* ━━━━ 4. DASHBOARD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function initDashboard() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return; }
  const emailEl = document.getElementById('user-email');
  if (emailEl) emailEl.textContent = session.user.email || 'GitHub User';
  loadUserFiles(session.user.id);
}

/* ━━━━ 5. MERGE TOOL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
let selectedFiles = [];
function handleFileSelect(newFiles) {
  const pdfFiles = Array.from(newFiles).filter(f => f.type === 'application/pdf');
  if (pdfFiles.length === 0) { alert('Please select PDF files only.'); return; }
  selectedFiles = [...selectedFiles, ...pdfFiles];
  renderFileList();
}
function renderFileList() {
  const section = document.getElementById('file-list-section');
  const listEl  = document.getElementById('file-list');
  const countEl = document.getElementById('file-count');
  if (selectedFiles.length === 0) { section.classList.add('hidden'); return; }
  section.classList.remove('hidden');
  countEl.textContent = selectedFiles.length;
  listEl.innerHTML = selectedFiles.map((file, index) => `
    <li>
      <span class="file-list-icon">📄</span>
      <span class="file-list-name">${file.name}</span>
      <span class="file-list-size">${formatBytes(file.size)}</span>
      <button class="file-list-remove" onclick="removeFile(${index})" title="Remove">✕</button>
    </li>`).join('');
}
function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFileList();
  if (selectedFiles.length === 0) document.getElementById('file-list-section').classList.add('hidden');
}
function clearFiles() {
  selectedFiles = [];
  document.getElementById('file-list-section').classList.add('hidden');
  document.getElementById('file-input').value = '';
}
async function mergePDFs() {
  if (selectedFiles.length < 2) { alert('Please select at least 2 PDF files to merge.'); return; }
  const btn = document.getElementById('merge-btn');
  btn.textContent = '⏳ Merging...'; btn.disabled = true;
  try {
    const mergedPdf = await PDFLib.PDFDocument.create();
    for (const file of selectedFiles) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(bytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }
    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);
    document.getElementById('download-link').href = url;
    document.getElementById('result-info').textContent =
      `${selectedFiles.length} files merged · ${formatBytes(mergedBytes.length)}`;
    document.getElementById('file-list-section').classList.add('hidden');
    document.getElementById('result-section').classList.remove('hidden');
    document.getElementById('upload-zone').classList.add('hidden');
    saveFileRecord('merged.pdf', mergedBytes.length);
  } catch (err) { alert('Error merging PDFs: ' + err.message); }
  btn.textContent = '🔗 Merge PDFs'; btn.disabled = false;
}
function resetTool() {
  selectedFiles = [];
  document.getElementById('result-section').classList.add('hidden');
  document.getElementById('upload-zone').classList.remove('hidden');
  document.getElementById('file-input').value = '';
}
function setupDropZone() {
  const zone = document.getElementById('upload-zone');
  const input = document.getElementById('file-input');
  if (!zone || !input) return;
  input.addEventListener('change', () => handleFileSelect(input.files));
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    handleFileSelect(e.dataTransfer.files);
  });
}

/* ━━━━ 6. SUPABASE DB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function saveFileRecord(fileName, fileSize) {
  try {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return;
    const { error } = await db.from('files').insert({
      user_id: session.user.id, file_name: fileName, file_size: fileSize,
    });
    if (error) console.error('Error saving file record:', error.message);
  } catch(e) { console.error('saveFileRecord error:', e); }
}
async function loadUserFiles(userId) {
  const { data: files, error } = await db.from('files').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  const listEl = document.getElementById('files-list');
  const statEl = document.getElementById('stat-total');
  if (!listEl) return;
  if (statEl) statEl.textContent = files.length;
  if (files.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">📄</div><p>No files yet. <a href="merge.html">Merge your first PDF →</a></p></div>`;
    return;
  }
  listEl.innerHTML = files.map(file => `
    <div class="file-row">
      <span class="file-row-icon">📄</span>
      <span class="file-row-name">${file.file_name}</span>
      <span class="file-row-size">${file.file_size ? formatBytes(file.file_size) : ''}</span>
      <span class="file-row-date">${new Date(file.created_at).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</span>
    </div>`).join('');
}

/* ━━━━ 7. AUTO-INIT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
document.addEventListener('DOMContentLoaded', () => {
  const page = currentPage();
  // Nav auth on every tool page
  initNavAuth();
  if (page === 'dashboard.html') initDashboard();
  if (page === 'merge.html') setupDropZone();
});
