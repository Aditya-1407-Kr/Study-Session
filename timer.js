// ===== TIMER.JS =====
// Accurate study timer using timestamps, not setInterval alone

const TIMER_KEY = 'studyos_timer';

let timerInterval = null;
let onTickCallback = null;
let onSaveCallback = null;

export const timerState = {
  running: false,
  startTimestamp: null,
  elapsed: 0, // seconds accumulated before current start
  subjectId: null,
  moduleId: null,
  subjectName: '',
  moduleName: ''
};

/**
 * Load timer state from localStorage (survives page refresh)
 */
export function loadTimerState() {
  const raw = localStorage.getItem(TIMER_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    Object.assign(timerState, saved);
  } catch {}
}

/**
 * Persist timer state to localStorage
 */
function saveTimerState() {
  localStorage.setItem(TIMER_KEY, JSON.stringify(timerState));
}

/**
 * Get current elapsed seconds (accurate even after tab switch)
 */
export function getCurrentElapsed() {
  if (!timerState.running || !timerState.startTimestamp) {
    return timerState.elapsed;
  }
  const nowSeconds = Date.now() / 1000;
  return timerState.elapsed + (nowSeconds - timerState.startTimestamp);
}

/**
 * Format seconds into HH:MM:SS
 */
export function formatTime(seconds) {
  seconds = Math.floor(seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

/**
 * Start the timer
 */
export function startTimer(subjectId, moduleId, subjectName, moduleName) {
  if (timerState.running) return;

  timerState.running = true;
  timerState.startTimestamp = Date.now() / 1000;
  timerState.subjectId = subjectId;
  timerState.moduleId = moduleId;
  timerState.subjectName = subjectName || '';
  timerState.moduleName = moduleName || '';
  saveTimerState();

  timerInterval = setInterval(() => {
    const elapsed = getCurrentElapsed();
    if (onTickCallback) onTickCallback(elapsed);
  }, 1000);
}

/**
 * Stop the timer and return session data
 */
export function stopTimer() {
  if (!timerState.running) return null;

  clearInterval(timerInterval);
  timerInterval = null;

  const totalSeconds = getCurrentElapsed();
  const durationMinutes = totalSeconds / 60;

  const session = {
    subjectId: timerState.subjectId,
    moduleId: timerState.moduleId,
    durationMinutes,
    date: new Date().toISOString().split('T')[0]
  };

  // Reset state
  timerState.running = false;
  timerState.startTimestamp = null;
  timerState.elapsed = 0;
  timerState.subjectId = null;
  timerState.moduleId = null;
  saveTimerState();

  if (onSaveCallback && durationMinutes >= 0.1) {
    onSaveCallback(session);
  }

  return session;
}

/**
 * Pause the timer (accumulate elapsed)
 */
export function pauseTimer() {
  if (!timerState.running) return;
  timerState.elapsed = getCurrentElapsed();
  timerState.running = false;
  timerState.startTimestamp = null;
  clearInterval(timerInterval);
  timerInterval = null;
  saveTimerState();
}

/**
 * Resume after pause
 */
export function resumeTimer() {
  if (timerState.running) return;
  timerState.running = true;
  timerState.startTimestamp = Date.now() / 1000;
  saveTimerState();

  timerInterval = setInterval(() => {
    if (onTickCallback) onTickCallback(getCurrentElapsed());
  }, 1000);
}

/**
 * Reset timer completely
 */
export function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerState.running = false;
  timerState.startTimestamp = null;
  timerState.elapsed = 0;
  timerState.subjectId = null;
  timerState.moduleId = null;
  localStorage.removeItem(TIMER_KEY);
}

/**
 * Register callbacks
 */
export function onTick(cb) { onTickCallback = cb; }
export function onSave(cb) { onSaveCallback = cb; }

/**
 * Restart interval if page refreshed while running
 */
export function resumeFromStorage() {
  loadTimerState();
  if (timerState.running && timerState.startTimestamp) {
    timerInterval = setInterval(() => {
      if (onTickCallback) onTickCallback(getCurrentElapsed());
    }, 1000);
    // Fire immediately
    if (onTickCallback) onTickCallback(getCurrentElapsed());
  }
}
