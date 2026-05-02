// ===== GAMIFICATION-UI.JS =====
// Renders the gamification sidebar panel and toast notifications.
// Drop in alongside gamification.js — no framework required.

import { gamification, LEVELS } from './gamification.js';

// ===== TOAST NOTIFICATION =====
function showXPToast(message, xp) {
  let container = document.getElementById('gam-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gam-toast-container';
    container.style.cssText = `
      position:fixed;bottom:80px;right:24px;z-index:3000;
      display:flex;flex-direction:column;gap:8px;pointer-events:none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:#2C2420;color:#F5F0E8;
    padding:10px 16px;border-radius:12px;
    display:flex;align-items:center;gap:10px;
    font-size:0.85rem;font-family:var(--font-body,system-ui);
    box-shadow:0 8px 24px rgba(0,0,0,0.3);
    transform:translateX(120%);transition:transform 0.3s cubic-bezier(.4,0,.2,1);
    pointer-events:none;max-width:280px;
    border:1px solid rgba(127,119,221,0.3);
  `;

  toast.innerHTML = `
    <span style="background:#7F77DD;color:white;padding:4px 10px;border-radius:99px;font-size:0.75rem;font-weight:600;flex-shrink:0;">+${xp} XP</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
  });
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

function showBadgeToast(badge) {
  let container = document.getElementById('gam-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gam-toast-container';
    container.style.cssText = `
      position:fixed;bottom:80px;right:24px;z-index:3000;
      display:flex;flex-direction:column;gap:8px;pointer-events:none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:#2C2420;color:#F5F0E8;
    padding:14px 18px;border-radius:14px;
    display:flex;align-items:center;gap:12px;
    font-size:0.88rem;font-family:var(--font-body,system-ui);
    box-shadow:0 8px 24px rgba(0,0,0,0.35);
    transform:translateX(120%);transition:transform 0.35s cubic-bezier(.4,0,.2,1);
    pointer-events:none;max-width:300px;
    border:1px solid rgba(127,119,221,0.3);
  `;
  toast.innerHTML = `
    <div style="width:40px;height:40px;border-radius:50%;background:#534AB7;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;color:white;">${badge.icon}</div>
    <div>
      <div style="font-size:0.7rem;color:rgba(245,240,232,0.6);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Badge unlocked!</div>
      <div style="font-weight:600;color:white;">${badge.label}</div>
      <div style="font-size:0.75rem;color:rgba(245,240,232,0.7);">${badge.desc}</div>
    </div>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
  });
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 400);
  }, 5000);
}

function showLevelUpToast(level) {
  let container = document.getElementById('gam-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gam-toast-container';
    container.style.cssText = `
      position:fixed;bottom:80px;right:24px;z-index:3000;
      display:flex;flex-direction:column;gap:8px;pointer-events:none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:linear-gradient(135deg,#534AB7,#7F77DD);color:white;
    padding:18px 22px;border-radius:16px;
    text-align:center;
    font-family:var(--font-body,system-ui);
    box-shadow:0 8px 32px rgba(83,74,183,0.5);
    transform:translateX(120%) scale(0.9);
    transition:transform 0.4s cubic-bezier(.34,1.56,.64,1);
    pointer-events:none;min-width:220px;
    border:1px solid rgba(255,255,255,0.2);
  `;
  toast.innerHTML = `
    <div style="font-size:2.2rem;margin-bottom:8px;text-shadow:0 2px 4px rgba(0,0,0,0.2);">${level.icon}</div>
    <div style="font-size:0.7rem;opacity:0.9;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Level up!</div>
    <div style="font-size:1.2rem;font-weight:600;">${level.name}</div>
    <div style="font-size:0.75rem;opacity:0.85;margin-top:4px;">Level ${level.level}</div>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0) scale(1)'; });
  });
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 400);
  }, 5000);
}

// ===== SIDEBAR PANEL RENDERER =====
export function renderGamificationPanel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function formatMinutes(m) {
    if (!m) return '0m';
    const h = Math.floor(m / 60), min = Math.round(m % 60);
    return h ? (min ? `${h}h ${min}m` : `${h}h`) : `${min}m`;
  }

  function buildHTML() {
    const { pct, toNext, current, next } = gamification.getLevelProgress();
    const stats = gamification.getStats();
    const badges = gamification.getBadges();
    const log = gamification.getXPLog(5);
    const earnedBadges = badges.filter(b => b.earned);
    const lockedBadges = badges.filter(b => !b.earned);
    const totalLevels = LEVELS.length;

    return `
      <style>
        #${containerId} .gp-section{margin-bottom:20px}
        #${containerId} .gp-label{font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink4,#A09890);margin-bottom:10px}
        #${containerId} .gp-card{background:var(--surface,#FDFAF4);border:1px solid var(--border-light,#E8E0CE);border-radius:12px;padding:16px}
        #${containerId} .gp-xp-bar-wrap{height:7px;background:var(--bg2,#EDE7D9);border-radius:99px;overflow:hidden;margin:8px 0}
        #${containerId} .gp-xp-bar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#534AB7,#7F77DD);transition:width 0.8s cubic-bezier(.4,0,.2,1)}
        #${containerId} .gp-badge-grid{display:flex;flex-wrap:wrap;gap:8px}
        #${containerId} .gp-badge{display:flex;flex-direction:column;align-items:center;gap:4px;width:52px;cursor:default}
        #${containerId} .gp-badge-icon{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;border:2px solid var(--border-light,#E8E0CE);transition:transform 0.15s}
        #${containerId} .gp-badge-icon:hover{transform:scale(1.12)}
        #${containerId} .gp-badge-icon.earned{border-color:#534AB7;background:#534AB7;color:white;font-size:1.4rem}
        #${containerId} .gp-badge-icon.locked{opacity:0.45;filter:grayscale(0.8);background:var(--bg2,#EDE7D9)}
        #${containerId} .gp-badge-lbl{font-size:0.65rem;color:var(--ink4,#A09890);text-align:center;line-height:1.2;font-weight:500}
        #${containerId} .gp-log-item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;background:var(--bg,#F5F0E8);margin-bottom:5px}
        #${containerId} .gp-xp-pill{background:#EEEDFE;color:#534AB7;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:99px;flex-shrink:0}
        #${containerId} .gp-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        #${containerId} .gp-stat{background:var(--bg2,#EDE7D9);border-radius:8px;padding:10px 12px}
        #${containerId} .gp-stat-num{font-family:var(--font-display,serif);font-size:1.4rem;color:var(--ink,#1C1915);line-height:1}
        #${containerId} .gp-stat-lbl{font-size:0.7rem;color:var(--ink4,#A09890);margin-top:2px}
      </style>

      <div class="gp-section">
        <div class="gp-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:48px;height:48px;border-radius:50%;background:${current.bg};border:2px solid ${current.color};display:flex;align-items:center;justify-content:center;font-size:1.3rem;">${current.icon}</div>
              <div>
                <div style="font-size:0.95rem;font-weight:700;color:var(--ink,#1C1915);">${current.name}</div>
                <div style="font-size:0.72rem;color:${current.color};font-weight:600;">Level ${current.level}</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.75rem;color:var(--ink4,#A09890);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;">Total</div>
              <div style="font-size:1.1rem;font-weight:700;color:${current.color};">${stats.totalXP}</div>
              <div style="font-size:0.7rem;color:var(--ink4,#A09890);">XP</div>
            </div>
          </div>
          <div class="gp-xp-bar-wrap">
            <div class="gp-xp-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,${current.color},#7F77DD)"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--ink4,#A09890);margin-top:8px;">
            <span>Lv ${current.level}</span>
            <span style="font-weight:600;">${pct}% progress</span>
            <span>Lv ${Math.min(current.level + 1, totalLevels)}</span>
          </div>
        </div>
      </div>

      <div class="gp-section">
        <div class="gp-stat-grid">
          <div class="gp-stat"><div class="gp-stat-num">${stats.currentStreak}</div><div class="gp-stat-lbl">Day streak</div></div>
          <div class="gp-stat"><div class="gp-stat-num">${stats.totalTopicsDone}</div><div class="gp-stat-lbl">Topics done</div></div>
          <div class="gp-stat"><div class="gp-stat-num">${stats.totalSessions}</div><div class="gp-stat-lbl">Sessions</div></div>
          <div class="gp-stat"><div class="gp-stat-num">${formatMinutes(stats.totalMinutes)}</div><div class="gp-stat-lbl">Total time</div></div>
        </div>
      </div>

      <div class="gp-section">
        <div class="gp-label">Badges (${earnedBadges.length}/${badges.length})</div>
        <div class="gp-badge-grid">
          ${earnedBadges.map(b => `
            <div class="gp-badge" title="${b.desc}">
              <div class="gp-badge-icon earned">${b.icon}</div>
              <div class="gp-badge-lbl">${b.label}</div>
            </div>`).join('')}
          ${lockedBadges.slice(0, 3).map(b => `
            <div class="gp-badge" title="${b.desc} (locked)">
              <div class="gp-badge-icon locked">${b.icon}</div>
              <div class="gp-badge-lbl">${b.label}</div>
            </div>`).join('')}
          ${lockedBadges.length > 3 ? `<div style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:var(--bg2);font-size:0.75rem;font-weight:600;color:var(--ink4);">+${lockedBadges.length - 3}</div>` : ''}
        </div>
      </div>

      ${log.length > 0 ? `
      <div class="gp-section">
        <div class="gp-label">Recent XP</div>
        ${log.map(e => `
          <div class="gp-log-item" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;background:var(--bg,#F5F0E8);margin-bottom:8px;">
            <div class="gp-xp-pill" style="background:#EEEDFE;color:#534AB7;padding:6px 10px;border-radius:999px;font-weight:700;flex-shrink:0">${e.xp > 0 ? '+'+e.xp : e.xp}</div>
            <div style="font-size:0.88rem;color:var(--ink,#1C1915);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.label}</div>
          </div>`).join('')}
      </div>` : ''}
    `;
  }

  function refresh() {
    container.innerHTML = buildHTML();
  }

  // Listen for events and refresh
  gamification.on((event, data) => {
    if (event === 'xp_gained') showXPToast(data.label, data.amount);
    if (event === 'xp_lost') showXPToast(data.label || 'XP removed', -(data.amount || 0));
    if (event === 'badge_earned') showBadgeToast(data);
    if (event === 'badge_revoked') showBadgeToast({ id: data.id || data, icon: '↩', label: 'Badge removed', desc: typeof data === 'object' ? data.desc : '' }, true);
    if (event === 'level_up') showLevelUpToast(data.level);
    if (event === 'level_down') showXPToast('Level down', 0);
    refresh();
  });

  refresh();

  return { refresh };
}

// ===== XP LEVEL BAR (compact, for nav sidebar) =====
export function renderMiniXPBar(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function update() {
    const { pct, current } = gamification.getLevelProgress();
    const stats = gamification.getStats();
    container.innerHTML = `
      <div style="padding:12px 14px;border-top:1px solid rgba(200,190,170,0.3);border-bottom:1px solid rgba(200,190,170,0.3);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
          <span style="font-size:1rem;">${current.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.75rem;font-weight:600;color:${current.color};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:1px;">Lv ${current.level} — ${current.name}</div>
            <div style="height:4px;background:rgba(200,190,170,0.2);border-radius:99px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,${current.color},${current.color}dd);border-radius:99px;transition:width 0.6s ease;"></div>
            </div>
          </div>
          <div style="text-align:right;font-size:0.7rem;flex-shrink:0;">
            <div style="font-weight:700;color:${current.color};">${stats.totalXP}</div>
            <div style="color:var(--ink4,#A09890);font-size:0.65rem;">XP</div>
          </div>
        </div>
      </div>
    `;
  }

  gamification.on(() => update());
  update();
}
