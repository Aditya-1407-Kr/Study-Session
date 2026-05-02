// ===== DB.JS =====
// All Supabase database operations

// IMPORTANT: Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://eggtrbatmvlzwprwqesa.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZ3RyYmF0bXZsendwcndxZXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDYwOTQsImV4cCI6MjA5MzMyMjA5NH0.Is4iURUyPBX-iJ9IesSDlA0jOyWtaZYV1fiIKj-49Jc';

// Lightweight Supabase client (no library needed)
export const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function createSupabaseClient(url, key) {
  const baseUrl = String(url || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/, '');

  function restUrl(path) {
    const cleanPath = String(path || '').replace(/^\/+/, '');
    return `${baseUrl}/rest/v1/${cleanPath}`;
  }

  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  async function request(path, method = 'GET', body = null, extraHeaders = {}) {
    const res = await fetch(restUrl(path), {
      method,
      headers: { ...headers, ...extraHeaders },
      body: body ? JSON.stringify(body) : null
    });
    const data = res.ok ? (res.status === 204 ? null : await res.json()) : null;
    const error = res.ok ? null : await res.json();
    return { data, error };
  }

  // Auth via Supabase GoTrue
  const auth = {
    _session: null,
    _listeners: [],

    async getSession() {
      const stored = localStorage.getItem('sb-session');
      if (stored) {
        const session = JSON.parse(stored);
        // Check expiry
        if (session.expires_at && Date.now() / 1000 < session.expires_at) {
          this._session = session;
          return { data: { session } };
        } else {
          // Try refresh
          try {
            const refreshed = await this._refreshSession(session.refresh_token);
            return { data: { session: refreshed } };
          } catch {
            localStorage.removeItem('sb-session');
            return { data: { session: null } };
          }
        }
      }
      return { data: { session: null } };
    },

    async _refreshSession(refresh_token) {
      const res = await fetch(`${baseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'apikey': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token })
      });
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      const session = this._processSession(data);
      return session;
    },

    _processSession(data) {
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        user: data.user
      };
      localStorage.setItem('sb-session', JSON.stringify(session));
      this._session = session;
      // Update default auth header
      headers['Authorization'] = `Bearer ${session.access_token}`;
      this._listeners.forEach(cb => cb('SIGNED_IN', session));
      return session;
    },

    async signUp({ email, password, options }) {
      const res = await fetch(`${baseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'apikey': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, data: options?.data || {} })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || data.msg || 'Signup failed');
      if (data.access_token) this._processSession(data);
      return { data };
    },

    async signInWithPassword({ email, password }) {
      const res = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.error || data.error_description) throw new Error(data.error_description || data.msg || 'Login failed');
      const session = this._processSession(data);
      return { data: { user: session.user, session } };
    },

    async signOut() {
      const session = this._session;
      if (session) {
        await fetch(`${baseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: { 'apikey': key, 'Authorization': `Bearer ${session.access_token}` }
        }).catch(() => {});
      }
      localStorage.removeItem('sb-session');
      this._session = null;
      headers['Authorization'] = `Bearer ${key}`;
      this._listeners.forEach(cb => cb('SIGNED_OUT', null));
    },

    onAuthStateChange(callback) {
      this._listeners.push(callback);
      return { data: { subscription: { unsubscribe: () => { this._listeners = this._listeners.filter(l => l !== callback); } } } };
    }
  };

  // Initialize auth headers from stored session
  const stored = localStorage.getItem('sb-session');
  if (stored) {
    try {
      const session = JSON.parse(stored);
      if (session.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        auth._session = session;
      }
    } catch {}
  }

  // Query builder
  function query(table) {
    let queryStr = '';
    let selectStr = '*';
    let orderStr = '';
    let limitStr = '';
    let singleRow = false;

    const builder = {
      select(cols = '*') { selectStr = cols; return builder; },
      eq(col, val) { queryStr += (queryStr ? '&' : '') + `${col}=eq.${encodeURIComponent(val)}`; return builder; },
      order(col, { ascending = true } = {}) { orderStr = `&order=${col}.${ascending ? 'asc' : 'desc'}`; return builder; },
      limit(n) { limitStr = `&limit=${n}`; return builder; },
      single() { singleRow = true; return builder; },
      gte(col, val) { queryStr += (queryStr ? '&' : '') + `${col}=gte.${encodeURIComponent(val)}`; return builder; },
      lte(col, val) { queryStr += (queryStr ? '&' : '') + `${col}=lte.${encodeURIComponent(val)}`; return builder; },
      in(col, vals) { queryStr += (queryStr ? '&' : '') + `${col}=in.(${vals.map(v => encodeURIComponent(v)).join(',')})`; return builder; },

      async then(resolve, reject) {
        try {
          const path = `${table}?select=${selectStr}${queryStr ? '&' + queryStr : ''}${orderStr}${limitStr}`;
          const res = await fetch(restUrl(path), {
            headers: singleRow ? { ...headers, 'Accept': 'application/vnd.pgrst.object+json' } : headers
          });
          if (!res.ok) {
            const err = await res.json();
            resolve({ data: null, error: err });
            return;
          }
          const data = res.status === 204 ? (singleRow ? null : []) : await res.json();
          resolve({ data, error: null });
        } catch (e) {
          reject(e);
        }
      }
    };
    return builder;
  }

  return {
    auth,
    // low-level request helper
    request,
    // convenience upsert for user_stats
    async upsertUserStats(obj) {
      if (!obj || !obj.user_id) return { data: null, error: 'missing_user_id' };
      const res = await request('user_stats', 'POST', [obj], { 'Prefer': 'resolution=merge-duplicates,return=representation' });
      return res;
    },
    from(table) {
      return {
        select(cols = '*') { return query(table).select(cols); },
        insert(body) {
          return {
            async then(resolve) {
              const r = await request(table, 'POST', body);
              resolve(r);
            },
            select() {
              return {
                async then(resolve) {
                  const r = await request(table, 'POST', body);
                  resolve(r);
                }
              };
            }
          };
        },
        update(body) {
          let qStr = '';
          const upBuilder = {
            eq(col, val) { qStr += (qStr ? '&' : '') + `${col}=eq.${encodeURIComponent(val)}`; return upBuilder; },
            async then(resolve) {
              const r = await request(`${table}?${qStr}`, 'PATCH', body);
              resolve(r);
            }
          };
          return upBuilder;
        },
        delete() {
          let qStr = '';
          const delBuilder = {
            eq(col, val) { qStr += (qStr ? '&' : '') + `${col}=eq.${encodeURIComponent(val)}`; return delBuilder; },
            async then(resolve) {
              const r = await request(`${table}?${qStr}`, 'DELETE');
              resolve(r);
            }
          };
          return delBuilder;
        },
        upsert(body, opts) {
          const extraHeaders = opts?.onConflict ? { 'Prefer': `resolution=merge-duplicates,return=representation` } : {};
          return {
            async then(resolve) {
              const r = await request(table, 'POST', body, { ...extraHeaders, 'Prefer': 'resolution=merge-duplicates,return=representation' });
              resolve(r);
            }
          };
        }
      };
    }
  };
}

// ===== SUBJECTS =====
export async function getSubjects(userId) {
  let { data, error } = await supabase.from('subjects').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  // Fallback for custom schemas where user_id and/or created_at are not present
  if (error && isMissingColumnError(error, 'user_id')) {
    ({ data, error } = await supabase.from('subjects').select('*').order('created_at', { ascending: true }));
  }
  if (error && isMissingColumnError(error, 'created_at')) {
    ({ data, error } = await supabase.from('subjects').select('*'));
  }
  if (error) throw error;
  return data || [];
}

export async function createSubject(userId, subjectName, color = '#C4622D', icon = '📚') {
  const { data, error } = await supabase.from('subjects').insert({
    user_id: userId,
    subject_name: subjectName,
    color,
    icon,
    created_at: new Date().toISOString()
  });
  if (error) throw error;
  return data;
}

export async function deleteSubject(subjectId) {
  // Delete cascade: modules and topics via RLS policies
  await supabase.from('topics').delete().in('module_id',
    (await supabase.from('modules').select('id').eq('subject_id', subjectId)).data?.map(m => m.id) || []
  );
  await supabase.from('modules').delete().eq('subject_id', subjectId);
  await supabase.from('study_sessions').delete().eq('subject_id', subjectId);
  const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
  if (error) throw error;
}

// ===== MODULES =====
export async function getModules(subjectId) {
  let { data, error } = await supabase.from('modules').select('*').eq('subject_id', subjectId).order('created_at', { ascending: true });
  if (error && isMissingColumnError(error, 'created_at')) {
    ({ data, error } = await supabase.from('modules').select('*').eq('subject_id', subjectId));
  }
  if (error) throw error;
  return data || [];
}

export async function createModule(subjectId, moduleName, moduleTitle) {
  const { data, error } = await supabase.from('modules').insert({
    subject_id: subjectId,
    module_name: moduleName,
    module_title: moduleTitle,
    created_at: new Date().toISOString()
  });
  if (error) throw error;
  return data;
}

export async function deleteModule(moduleId) {
  await supabase.from('topics').delete().eq('module_id', moduleId);
  const { error } = await supabase.from('modules').delete().eq('id', moduleId);
  if (error) throw error;
}

export async function updateModule(moduleId, updates) {
  const { error } = await supabase.from('modules').update(updates).eq('id', moduleId);
  if (error) throw error;
}

// ===== TOPICS =====
export async function getTopics(moduleId) {
  let { data, error } = await supabase.from('topics').select('*').eq('module_id', moduleId).order('created_at', { ascending: true });
  if (error && isMissingColumnError(error, 'created_at')) {
    ({ data, error } = await supabase.from('topics').select('*').eq('module_id', moduleId));
  }
  if (error) throw error;
  return data || [];
}

export async function getTopicsForSubject(moduleIds) {
  if (!moduleIds.length) return [];
  const { data, error } = await supabase.from('topics').select('*').in('module_id', moduleIds);
  if (error) throw error;
  return data || [];
}

export async function createTopic(moduleId, topicName, priority = 'medium', notes = '') {
  const { data, error } = await supabase.from('topics').insert({
    module_id: moduleId,
    topic_name: topicName,
    is_completed: false,
    priority,
    notes: notes || '',
    created_at: new Date().toISOString()
  });
  if (error) throw error;
  return data;
}

export async function updateTopic(topicId, updates) {
  const { error } = await supabase.from('topics').update(updates).eq('id', topicId);
  if (error) throw error;
}

export async function deleteTopic(topicId) {
  const { error } = await supabase.from('topics').delete().eq('id', topicId);
  if (error) throw error;
}

export async function toggleTopic(topicId, isCompleted) {
  await updateTopic(topicId, { is_completed: isCompleted });
}

// ===== STUDY SESSIONS =====
export async function createStudySession(userId, subjectId, moduleId, durationMinutes, date) {
  const { data, error } = await supabase.from('study_sessions').insert({
    user_id: userId,
    subject_id: subjectId,
    module_id: moduleId || null,
    duration_minutes: Math.round(durationMinutes),
    date: date || new Date().toISOString().split('T')[0]
  });
  if (error) throw error;
  return data;
}

export async function getStudySessions(userId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  let { data, error } = await supabase.from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: false });
  if (error && isMissingColumnError(error, 'user_id')) {
    ({ data, error } = await supabase.from('study_sessions')
      .select('*')
      .gte('date', since.toISOString().split('T')[0])
      .order('date', { ascending: false }));
  }
  if (error && isMissingColumnError(error, 'date')) {
    ({ data, error } = await supabase.from('study_sessions').select('*'));
  }
  if (error) throw error;
  return data || [];
}

export async function getTodaySessions(userId) {
  const today = new Date().toISOString().split('T')[0];
  let { data, error } = await supabase.from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today);
  if (error && isMissingColumnError(error, 'user_id')) {
    ({ data, error } = await supabase.from('study_sessions').select('*').eq('date', today));
  }
  if (error && isMissingColumnError(error, 'date')) {
    ({ data, error } = await supabase.from('study_sessions').select('*'));
  }
  if (error) throw error;
  return data || [];
}

export async function getAllSessions(userId) {
  let { data, error } = await supabase.from('study_sessions').select('*').eq('user_id', userId).order('date', { ascending: false });
  if (error && isMissingColumnError(error, 'user_id')) {
    ({ data, error } = await supabase.from('study_sessions').select('*').order('date', { ascending: false }));
  }
  if (error && isMissingColumnError(error, 'date')) {
    ({ data, error } = await supabase.from('study_sessions').select('*'));
  }
  if (error) throw error;
  return data || [];
}

function isMissingColumnError(error, columnName) {
  if (!error || !columnName) return false;
  const raw = JSON.stringify(error).toLowerCase();
  return raw.includes('column') && raw.includes(columnName.toLowerCase());
}
