// ===== UI.JS =====
// UI utilities: toast, modals, theme, helpers

// ===== THEME =====
export function initTheme() {
  const saved = localStorage.getItem('studyos_theme') || 'light';
  applyTheme(saved);
  return saved;
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('studyos_theme', theme);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

// ===== TOAST =====
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

export function toast(message, type = 'success', duration = 3000) {
  const container = getToastContainer();
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('show'));
  });

  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ===== MODAL =====
export function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.classList.add('open');
  // Focus first input
  setTimeout(() => {
    const input = overlay.querySelector('input:not([type="hidden"]), textarea, select');
    if (input) input.focus();
  }, 100);
}

export function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.classList.remove('open');
}

export function closeAllModals() {
  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
  if (e.target.classList.contains('modal-close') || e.target.dataset.closeModal) {
    closeAllModals();
  }
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAllModals();
});

// ===== STREAK =====
export function getStreak() {
  const raw = localStorage.getItem('studyos_streak');
  if (!raw) return { count: 0, lastDate: null };
  try { return JSON.parse(raw); } catch { return { count: 0, lastDate: null }; }
}

export function updateStreak(studiedToday) {
  const streak = getStreak();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (streak.lastDate === today) return streak; // Already updated today

  if (studiedToday) {
    if (streak.lastDate === yesterday) {
      streak.count += 1;
    } else if (streak.lastDate !== today) {
      streak.count = 1; // Reset
    }
    streak.lastDate = today;
    localStorage.setItem('studyos_streak', JSON.stringify(streak));
  } else if (streak.lastDate && streak.lastDate < yesterday) {
    streak.count = 0;
    localStorage.setItem('studyos_streak', JSON.stringify(streak));
  }

  return streak;
}

// ===== GOAL =====
export function getDailyGoal() {
  return parseInt(localStorage.getItem('studyos_goal') || '120', 10); // default 120 min
}

export function setDailyGoal(minutes) {
  localStorage.setItem('studyos_goal', String(minutes));
}

// ===== COLOR HELPERS =====
export const SUBJECT_COLORS = [
  '#C4622D', '#3D7A5E', '#2D5A8A', '#8A5A2D',
  '#6A3D8A', '#2D8A7A', '#8A2D5A', '#5A8A2D'
];

export const SUBJECT_ICONS = ['📚', '💻', '🔬', '📐', '🌍', '🎨', '⚗️', '📊', '🧮', '🏛️', '💡', '🔭'];

export function getSubjectStyle(color, icon) {
  return { color: color || SUBJECT_COLORS[0], icon: icon || '📚' };
}

// ===== FORMAT HELPERS =====
export function formatMinutes(minutes) {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function calcProgress(topics) {
  if (!topics?.length) return 0;
  return Math.round((topics.filter(t => t.is_completed).length / topics.length) * 100);
}

// ===== DOM HELPERS =====
export function $(selector, ctx = document) { return ctx.querySelector(selector); }
export function $$(selector, ctx = document) { return Array.from(ctx.querySelectorAll(selector)); }

export function el(tag, className, html = '') {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}

export function setHtml(selector, html, ctx = document) {
  const e = ctx.querySelector(selector);
  if (e) e.innerHTML = html;
}

export function setText(selector, text, ctx = document) {
  const e = ctx.querySelector(selector);
  if (e) e.textContent = text;
}

export function show(selector, ctx = document) {
  const e = ctx.querySelector(selector);
  if (e) e.style.display = '';
}

export function hide(selector, ctx = document) {
  const e = ctx.querySelector(selector);
  if (e) e.style.display = 'none';
}

// ===== LOADING STATE =====
export function setLoading(btn, loading, originalText = '') {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.innerHTML = '<span class="loading-spinner"></span>';
  } else {
    btn.textContent = originalText || btn.dataset.originalText || '';
  }
}

// ===== CONFIRM DIALOG =====
export function confirmDelete(message) {
  return confirm(message || 'Are you sure you want to delete this? This action cannot be undone.');
}

// ===== WEEKLY CHART DATA =====
export function buildWeekChartData(sessions) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = days[d.getDay()];
    const dayTotal = sessions
      .filter(s => s.date === dateStr)
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    result.push({ day: dayName, date: dateStr, minutes: dayTotal, isToday: i === 0 });
  }

  return result;
}
