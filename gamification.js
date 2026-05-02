// ===== GAMIFICATION.JS =====
// Drop-in XP, Level, Badge, and Streak engine for Study OS
// Usage: import { Gamification } from './gamification.js';

const STORAGE_KEY = 'studyos_gamification';

// ===== LEVEL THRESHOLDS =====
export const LEVELS = [
  { level: 1, name: 'Beginner',   minXP: 0,    maxXP: 50,   color: '#534AB7', bg: '#EEEDFE', icon: '📖' },
  { level: 2, name: 'Scholar',    minXP: 50,   maxXP: 150,  color: '#0F6E56', bg: '#E1F5EE', icon: '🎓' },
  { level: 3, name: 'Achiever',   minXP: 150,  maxXP: 350,  color: '#993C1D', bg: '#FAECE7', icon: '🏅' },
  { level: 4, name: 'Expert',     minXP: 350,  maxXP: 700,  color: '#185FA5', bg: '#E6F1FB', icon: '🔬' },
  { level: 5, name: 'Master',     minXP: 700,  maxXP: 1200, color: '#854F0B', bg: '#FAEEDA', icon: '⚡' },
  { level: 6, name: 'Legend',     minXP: 1200, maxXP: 2000, color: '#993356', bg: '#FBEAF0', icon: '👑' },
  { level: 7, name: 'Sage',       minXP: 2000, maxXP: 3000, color: '#1A4D3C', bg: '#E0F2E9', icon: '🧙' },
  { level: 8, name: 'Champion',   minXP: 3000, maxXP: 4500, color: '#8B4513', bg: '#F5E6D3', icon: '🏆' },
  { level: 9, name: 'Grandmaster', minXP: 4500, maxXP: 6500, color: '#4A0E4E', bg: '#F3E5F5', icon: '💎' },
  { level: 10, name: 'Ascended',  minXP: 6500, maxXP: 99999, color: '#FFD700', bg: '#FFFACD', icon: '✨' },
];

// ===== XP REWARDS =====
export const XP_REWARDS = {
  TOPIC_COMPLETE:       10,   // checked off a topic
  TOPIC_HIGH_PRIORITY:  5,    // bonus for high-priority topics
  SESSION_PER_10MIN:    8,    // per 10 minutes of study
  SESSION_BONUS_30:     15,   // bonus for 30+ min session
  SESSION_BONUS_60:     30,   // bonus for 60+ min session
  MODULE_COMPLETE:      40,   // all topics in a module done
  SUBJECT_COMPLETE:     100,  // all modules in a subject done
  DAILY_GOAL_HIT:       25,   // daily goal reached
  STREAK_MAINTAIN:      10,   // each day of active streak
  STREAK_7_DAY:         50,   // 7-day streak milestone
  STREAK_30_DAY:        200,  // 30-day streak milestone
  FIRST_SESSION:        20,   // very first session ever
  PARSER_USED:          15,   // used syllabus parser
};

// ===== BADGE DEFINITIONS =====
export const BADGE_DEFS = [
  // Session badges
  { id: 'first_session',  icon: '▶',  label: 'First step',   desc: 'Complete your first study session',   check: s => s.totalSessions >= 1 },
  { id: 'sessions_10',    icon: '🔟', label: 'Consistent',   desc: 'Complete 10 study sessions',          check: s => s.totalSessions >= 10 },
  { id: 'sessions_50',    icon: '💯', label: 'Dedicated',    desc: 'Complete 50 study sessions',          check: s => s.totalSessions >= 50 },
  // Time badges
  { id: 'hour_1',         icon: '⏱',  label: 'First hour',   desc: 'Study for 1 hour total',             check: s => s.totalMinutes >= 60 },
  { id: 'hour_10',        icon: '⌛', label: 'Ten hours',    desc: 'Study for 10 hours total',            check: s => s.totalMinutes >= 600 },
  { id: 'hour_50',        icon: '🏆', label: 'Fifty hours',  desc: 'Study for 50 hours total',            check: s => s.totalMinutes >= 3000 },
  // Topic badges
  { id: 'topics_1',       icon: '✓',  label: 'Checked off',  desc: 'Complete your first topic',           check: s => s.totalTopicsDone >= 1 },
  { id: 'topics_10',      icon: '📋', label: 'Ten topics',   desc: 'Complete 10 topics',                  check: s => s.totalTopicsDone >= 10 },
  { id: 'topics_50',      icon: '📚', label: 'Fifty topics', desc: 'Complete 50 topics',                  check: s => s.totalTopicsDone >= 50 },
  { id: 'topics_100',     icon: '🌟', label: 'Century',      desc: 'Complete 100 topics',                 check: s => s.totalTopicsDone >= 100 },
  // Streak badges
  { id: 'streak_3',       icon: '🔥', label: 'On fire',      desc: '3-day study streak',                  check: s => s.currentStreak >= 3 },
  { id: 'streak_7',       icon: '⚡', label: 'Full week',    desc: '7-day study streak',                  check: s => s.currentStreak >= 7 },
  { id: 'streak_30',      icon: '💎', label: 'Iron will',    desc: '30-day study streak',                 check: s => s.currentStreak >= 30 },
  // XP milestones
  { id: 'xp_100',         icon: '💫', label: 'Rising',       desc: 'Earn 100 XP',                         check: s => s.totalXP >= 100 },
  { id: 'xp_500',         icon: '🌙', label: 'Shining',      desc: 'Earn 500 XP',                         check: s => s.totalXP >= 500 },
  { id: 'xp_2000',        icon: '👑', label: 'Crowned',      desc: 'Earn 2000 XP',                        check: s => s.totalXP >= 2000 },
  // Special
  { id: 'night_owl',      icon: '🦉', label: 'Night owl',    desc: 'Study after 22:00',                   check: s => s.studiedLateNight === true },
  { id: 'early_bird',     icon: '🌅', label: 'Early bird',   desc: 'Study before 07:00',                  check: s => s.studiedEarlyMorning === true },
  { id: 'parser_used',    icon: '✦',  label: 'Smart import', desc: 'Used the syllabus parser',            check: s => s.usedParser === true },
  { id: 'module_done',    icon: '📂', label: 'Module clear', desc: 'Complete an entire module',           check: s => s.totalModulesCompleted >= 1 },
  { id: 'subject_done',   icon: '🎯', label: 'Subject ace',  desc: 'Complete an entire subject',          check: s => s.totalSubjectsCompleted >= 1 },
];

// ===== GAMIFICATION CLASS =====
export class Gamification {
  constructor() {
    this.state = this._loadState();
    this._listeners = [];
  }

  // ===== STATE =====
  _defaultState() {
    return {
      totalXP: 0,
      currentStreak: 0,
      lastStudyDate: null,
      totalSessions: 0,
      totalMinutes: 0,
      totalTopicsDone: 0,
      totalModulesCompleted: 0,
      totalSubjectsCompleted: 0,
      studiedLateNight: false,
      studiedEarlyMorning: false,
      usedParser: false,
      earnedBadges: [],   // array of badge ids
      xpLog: [],          // [{label, xp, timestamp}]
      completedTopicIds: [], // track topic ids we've awarded XP for
      completedModuleIds: [], // track module ids we've awarded XP for
      lastBadgeNotified: [],
    };
  }

  _loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...this._defaultState(), ...JSON.parse(raw) };
    } catch {}
    return this._defaultState();
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  _emit(event, data) {
    this._listeners.forEach(cb => cb(event, data));
  }

  on(callback) {
    this._listeners.push(callback);
  }

  // ===== XP =====
  _addXP(amount, label) {
    if (amount <= 0) return;
    const prevLevel = this.getLevel();
    this.state.totalXP += amount;
    this.state.xpLog.unshift({ label, xp: amount, timestamp: Date.now() });
    if (this.state.xpLog.length > 50) this.state.xpLog = this.state.xpLog.slice(0, 50);
    const newLevel = this.getLevel();
    if (newLevel.level > prevLevel.level) {
      this._emit('level_up', { level: newLevel, xp: amount });
    }
    this._emit('xp_gained', { amount, label, total: this.state.totalXP });
    this._save();
  }

  _removeXP(amount, label) {
    if (amount <= 0) return;
    const prevLevel = this.getLevel();
    this.state.totalXP = Math.max(0, this.state.totalXP - amount);
    this.state.xpLog.unshift({ label, xp: -amount, timestamp: Date.now() });
    if (this.state.xpLog.length > 50) this.state.xpLog = this.state.xpLog.slice(0, 50);
    const newLevel = this.getLevel();
    if (newLevel.level < prevLevel.level) {
      this._emit('level_down', { level: newLevel, xp: -amount });
    }
    this._emit('xp_lost', { amount, label, total: this.state.totalXP });
    this._save();
  }

  // ===== ACTIONS (call these from your app) =====

  /** Call when a topic is toggled. Pass the topic object and boolean `completed`. */
  onTopicToggled(topic, completed) {
    const id = topic?.id || topic?.topic_id || null;
    const already = id && this.state.completedTopicIds.includes(id);
    const xpForTopic = XP_REWARDS.TOPIC_COMPLETE + ((topic?.priority === 'high') ? XP_REWARDS.TOPIC_HIGH_PRIORITY : 0);

    if (completed) {
      if (already) return; // already awarded
      this.state.completedTopicIds.push(id);
      this.state.totalTopicsDone += 1;
      this._addXP(xpForTopic, `Completed topic: ${topic?.topic_name || 'topic'}`);
      this._checkBadges();
    } else {
      if (!already) return; // nothing to remove
      // remove tracking
      this.state.completedTopicIds = this.state.completedTopicIds.filter(tid => tid !== id);
      this.state.totalTopicsDone = Math.max(0, this.state.totalTopicsDone - 1);
      this._removeXP(xpForTopic, `Reverted topic: ${topic?.topic_name || 'topic'}`);
      // Recalculate badges (revoke if criteria no longer met)
      this._recalculateBadges();
      this._save();
    }
  }

  /** Call when a study session is saved */
  onSessionSaved(session) {
    const { durationMinutes, subjectName } = session;
    this.state.totalSessions += 1;
    this.state.totalMinutes += durationMinutes;

    // Time-of-day badges
    const hour = new Date().getHours();
    if (hour >= 22) this.state.studiedLateNight = true;
    if (hour < 7)  this.state.studiedEarlyMorning = true;

    // First session bonus
    const isFirst = this.state.totalSessions === 1;
    let xp = Math.floor(durationMinutes / 10) * XP_REWARDS.SESSION_PER_10MIN;
    if (durationMinutes >= 30) xp += XP_REWARDS.SESSION_BONUS_30;
    if (durationMinutes >= 60) xp += XP_REWARDS.SESSION_BONUS_60;
    if (isFirst) xp += XP_REWARDS.FIRST_SESSION;

    const label = isFirst
      ? 'First study session!'
      : `${Math.round(durationMinutes)}min session — ${subjectName || 'Study'}`;
    this._addXP(xp, label);
    this._checkBadges();
  }

  /** Call when a module is fully completed */
  onModuleCompleted(module) {
    // backward compatible: call toggled handler
    const id = module?.id || module?.module_id || null;
    this.onModuleToggled(module, true);
  }

  /** Call when a module is toggled complete/incomplete */
  onModuleToggled(module, completed) {
    const id = module?.id || module?.module_id || null;
    const already = id && this.state.completedModuleIds.includes(id);
    const xpForModule = XP_REWARDS.MODULE_COMPLETE;

    if (completed) {
      if (already) return;
      if (id) this.state.completedModuleIds.push(id);
      this.state.totalModulesCompleted += 1;
      this._addXP(xpForModule, `Completed module: ${module?.module_name || 'module'}`);
      this._checkBadges();
    } else {
      if (!already) return;
      if (id) this.state.completedModuleIds = this.state.completedModuleIds.filter(mid => mid !== id);
      this.state.totalModulesCompleted = Math.max(0, this.state.totalModulesCompleted - 1);
      this._removeXP(xpForModule, `Reverted module: ${module?.module_name || 'module'}`);
      this._recalculateBadges();
      this._save();
    }
  }

  /** Call when a subject is fully completed */
  onSubjectCompleted(subject) {
    this.state.totalSubjectsCompleted += 1;
    this._addXP(XP_REWARDS.SUBJECT_COMPLETE, `Completed subject: ${subject?.subject_name || 'subject'}!`);
    this._checkBadges();
  }

  /** Call when daily goal is hit */
  onDailyGoalHit() {
    this._addXP(XP_REWARDS.DAILY_GOAL_HIT, 'Daily study goal reached!');
    this._checkBadges();
  }

  /** Call when streak is updated */
  onStreakUpdated(streakCount) {
    this.state.currentStreak = streakCount;
    if (streakCount > 0) {
      this._addXP(XP_REWARDS.STREAK_MAINTAIN, `${streakCount}-day streak!`);
    }
    if (streakCount === 7)  this._addXP(XP_REWARDS.STREAK_7_DAY, '7-day streak bonus!');
    if (streakCount === 30) this._addXP(XP_REWARDS.STREAK_30_DAY, '30-day streak bonus!');
    this._checkBadges();
  }

  /** Call when syllabus parser is used */
  onParserUsed() {
    if (this.state.usedParser) return;
    this.state.usedParser = true;
    this._addXP(XP_REWARDS.PARSER_USED, 'Used the Syllabus Parser');
    this._checkBadges();
  }

  // ===== BADGE CHECKS =====
  _checkBadges() {
    const newlyEarned = [];
    for (const def of BADGE_DEFS) {
      if (!this.state.earnedBadges.includes(def.id) && def.check(this.state)) {
        this.state.earnedBadges.push(def.id);
        newlyEarned.push(def);
        this._emit('badge_earned', def);
      }
    }
    if (newlyEarned.length) this._save();
  }

  // Recalculate badges and revoke those whose checks no longer pass
  _recalculateBadges() {
    const stillEarned = [];
    const revoked = [];
    for (const def of BADGE_DEFS) {
      if (this.state.earnedBadges.includes(def.id)) {
        if (def.check(this.state)) stillEarned.push(def.id);
        else revoked.push(def);
      }
    }
    if (revoked.length) {
      // remove revoked badges
      this.state.earnedBadges = stillEarned;
      for (const r of revoked) this._emit('badge_revoked', r);
      this._save();
    }
  }

  // ===== GETTERS =====
  getLevel() {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (this.state.totalXP >= LEVELS[i].minXP) return LEVELS[i];
    }
    return LEVELS[0];
  }

  getLevelProgress() {
    const lv = this.getLevel();
    const next = LEVELS[lv.level] || lv;
    if (lv.level === LEVELS.length) return { pct: 100, toNext: 0, current: lv, next: lv };
    const pct = Math.round((this.state.totalXP - lv.minXP) / (next.minXP - lv.minXP) * 100);
    return { pct, toNext: next.minXP - this.state.totalXP, current: lv, next };
  }

  getBadges() {
    return BADGE_DEFS.map(def => ({
      ...def,
      earned: this.state.earnedBadges.includes(def.id)
    }));
  }

  getXPLog(limit = 10) {
    return this.state.xpLog.slice(0, limit);
  }

  getStats() {
    return {
      totalXP: this.state.totalXP,
      currentStreak: this.state.currentStreak,
      totalSessions: this.state.totalSessions,
      totalMinutes: this.state.totalMinutes,
      totalTopicsDone: this.state.totalTopicsDone,
    };
  }

  /** Reset all gamification data (for testing) */
  reset() {
    this.state = this._defaultState();
    this._save();
  }
}

// Singleton export
export const gamification = new Gamification();
