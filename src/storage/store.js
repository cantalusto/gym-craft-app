import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  workouts: 'gc_workouts',
  schedule: 'gc_schedule',
  unit: 'gc_unit',
  weightHistory: 'gc_weight_history',
  sessions: 'gc_sessions',
  sessionIncrement: 'gc_session_increment',
  themeName: 'gc_theme_name',
  defaultRestSeconds: 'gc_default_rest_seconds',
};

export async function getWorkouts() {
  const raw = await AsyncStorage.getItem(KEYS.workouts);
  return raw ? JSON.parse(raw) : [];
}

export async function saveWorkout(workout) {
  const list = await getWorkouts();
  const normalizedName = (workout.name || 'Treino').trim();
  const baseExercises = workout.exercises || [];

  // Tente localizar por id primeiro (edição explícita)
  let idx = -1;
  if (workout.id) {
    idx = list.findIndex((w) => w.id === workout.id);
  }

  // Se não encontrou por id, localize por nome (atualização por nome)
  if (idx < 0) {
    idx = list.findIndex(
      (w) => (w.name || '').trim().toLowerCase() === normalizedName.toLowerCase()
    );
  }

  if (idx >= 0) {
    const existing = list[idx];
    const updated = {
      id: existing.id,
      name: normalizedName,
      // Se veio com id (edição), substitui; se vier só por nome, concatena novos exercícios
      exercises: workout.id ? baseExercises : [...(existing.exercises || []), ...baseExercises],
    };
    list[idx] = updated;
    await AsyncStorage.setItem(KEYS.workouts, JSON.stringify(list));
    return updated;
  }

  // Não existe: cria novo
  const item = { id: String(Date.now()), name: normalizedName, exercises: baseExercises };
  list.push(item);
  await AsyncStorage.setItem(KEYS.workouts, JSON.stringify(list));
  return item;
}

export async function deleteWorkout(id) {
  const list = await getWorkouts();
  const filtered = list.filter((w) => w.id !== id);
  await AsyncStorage.setItem(KEYS.workouts, JSON.stringify(filtered));
}

export async function getSchedule() {
  const raw = await AsyncStorage.getItem(KEYS.schedule);
  const defaultSchedule = [
    { day: 'Segunda', entries: [] },
    { day: 'Terça', entries: [] },
    { day: 'Quarta', entries: [] },
    { day: 'Quinta', entries: [] },
    { day: 'Sexta', entries: [] },
    { day: 'Sábado', entries: [] },
    { day: 'Domingo', entries: [] },
  ];
  return raw ? JSON.parse(raw) : defaultSchedule;
}

export async function setSchedule(schedule) {
  await AsyncStorage.setItem(KEYS.schedule, JSON.stringify(schedule));
}

export async function addEntryToDay(day, entry) {
  const schedule = await getSchedule();
  const idx = schedule.findIndex((d) => d.day === day);
  if (idx >= 0) {
    schedule[idx].entries.push(entry);
    await setSchedule(schedule);
  }
  return schedule;
}

export async function removeEntryFromDay(day, index) {
  const schedule = await getSchedule();
  const idx = schedule.findIndex((d) => d.day === day);
  if (idx >= 0) {
    schedule[idx].entries.splice(index, 1);
    await setSchedule(schedule);
  }
  return schedule;
}

// Unit preference (kg/lb)
export async function getUnit() {
  const raw = await AsyncStorage.getItem(KEYS.unit);
  return raw || 'kg';
}

export async function setUnit(unit) {
  const val = unit === 'lb' ? 'lb' : 'kg';
  await AsyncStorage.setItem(KEYS.unit, val);
  return val;
}

// Weight history per exercise name
export async function logWeightForExercise(name, weightKg, dateIso = null) {
  const raw = await AsyncStorage.getItem(KEYS.weightHistory);
  const map = raw ? JSON.parse(raw) : {};
  const key = (name || '').trim();
  if (!key) return;
  const entry = { date: dateIso || new Date().toISOString(), weightKg: Number(weightKg) || 0 };
  if (!Array.isArray(map[key])) map[key] = [];
  map[key].push(entry);
  await AsyncStorage.setItem(KEYS.weightHistory, JSON.stringify(map));
}

export async function getWeightSuggestions(name, limit = 3) {
  const raw = await AsyncStorage.getItem(KEYS.weightHistory);
  const map = raw ? JSON.parse(raw) : {};
  const key = (name || '').trim();
  const list = Array.isArray(map[key]) ? map[key] : [];
  return list.slice(-limit).reverse();
}

// Session logging
export async function getSessions() {
  const raw = await AsyncStorage.getItem(KEYS.sessions);
  return raw ? JSON.parse(raw) : [];
}

export async function logSessionSet(setEntry) {
  const sessions = await getSessions();
  const entry = {
    date: setEntry.date || new Date().toISOString(),
    workoutId: setEntry.workoutId || null,
    exerciseName: setEntry.exerciseName || '',
    setIndex: Number(setEntry.setIndex) || 1,
    reps: Number(setEntry.reps) || 0,
    weightKg: Number(setEntry.weightKg) || 0,
  };
  sessions.push(entry);
  await AsyncStorage.setItem(KEYS.sessions, JSON.stringify(sessions));
  // Also log to weight history for suggestions
  await logWeightForExercise(entry.exerciseName, entry.weightKg, entry.date);
  return entry;
}

export async function getWeeklyReport() {
  const sessions = await getSessions();
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6); // last 7 days inclusive
  const byDay = {};
  const total = { sessions: 0, sets: 0, reps: 0, volumeKg: 0 };
  for (const s of sessions) {
    const d = new Date(s.date);
    if (d >= start && d <= now) {
      const dayKey = d.toLocaleDateString('pt-BR', { weekday: 'long' });
      if (!byDay[dayKey]) byDay[dayKey] = { sets: 0, reps: 0, volumeKg: 0, exercises: {} };
      byDay[dayKey].sets += 1;
      byDay[dayKey].reps += Number(s.reps) || 0;
      byDay[dayKey].volumeKg += (Number(s.weightKg) || 0) * ((Number(s.reps) || 0));
      byDay[dayKey].exercises[s.exerciseName] = (byDay[dayKey].exercises[s.exerciseName] || 0) + 1;
      total.sessions += 1; // count set events as session moments
      total.sets += 1;
      total.reps += Number(s.reps) || 0;
      total.volumeKg += (Number(s.weightKg) || 0) * ((Number(s.reps) || 0));
    }
  }
  return { byDay, total, rangeStart: start.toISOString(), rangeEnd: now.toISOString() };
}

// Weekly report for a specific week offset (0 = current week, -1 = previous week)
export async function getWeeklyReportWithOffset(weekOffset = 0) {
  const sessions = await getSessions();
  const now = new Date();
  const ref = new Date(now);
  // Move by week offset (each offset = 7 days)
  ref.setDate(ref.getDate() + (weekOffset * 7));
  const end = new Date(ref);
  const start = new Date(ref);
  start.setDate(ref.getDate() - 6);
  const byDay = {};
  const total = { sessions: 0, sets: 0, reps: 0, volumeKg: 0 };
  for (const s of sessions) {
    const d = new Date(s.date);
    if (d >= start && d <= end) {
      const dayKey = d.toLocaleDateString('pt-BR', { weekday: 'long' });
      if (!byDay[dayKey]) byDay[dayKey] = { sets: 0, reps: 0, volumeKg: 0, exercises: {} };
      byDay[dayKey].sets += 1;
      byDay[dayKey].reps += Number(s.reps) || 0;
      byDay[dayKey].volumeKg += (Number(s.weightKg) || 0) * ((Number(s.reps) || 0));
      byDay[dayKey].exercises[s.exerciseName] = (byDay[dayKey].exercises[s.exerciseName] || 0) + 1;
      total.sessions += 1;
      total.sets += 1;
      total.reps += Number(s.reps) || 0;
      total.volumeKg += (Number(s.weightKg) || 0) * ((Number(s.reps) || 0));
    }
  }
  return { byDay, total, rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
}

// Session increments settings per unit
export async function getSessionIncrements() {
  const raw = await AsyncStorage.getItem(KEYS.sessionIncrement);
  // default 2.5kg and 5lb
  return raw ? JSON.parse(raw) : { kg: 2.5, lb: 5 };
}

export async function setSessionIncrements(increments) {
  const safe = {
    kg: typeof increments?.kg === 'number' ? increments.kg : 2.5,
    lb: typeof increments?.lb === 'number' ? increments.lb : 5,
  };
  await AsyncStorage.setItem(KEYS.sessionIncrement, JSON.stringify(safe));
  return safe;
}

// Workout stats: PRs and volume per workout
export async function getWorkoutStats(workoutId) {
  const sessions = await getSessions();
  const forWorkout = sessions.filter((s) => s.workoutId === workoutId);
  const byExercise = {};
  for (const s of forWorkout) {
    const key = s.exerciseName || '';
    if (!byExercise[key]) byExercise[key] = { prKg: 0, totalVolumeKg: 0, sets: 0 };
    byExercise[key].prKg = Math.max(byExercise[key].prKg, Number(s.weightKg) || 0);
    byExercise[key].totalVolumeKg += (Number(s.weightKg) || 0) * ((Number(s.reps) || 0));
    byExercise[key].sets += 1;
  }
  return byExercise;
}

// Theme settings
export async function getThemeName() {
  const raw = await AsyncStorage.getItem(KEYS.themeName);
  return raw || 'light';
}

export async function setThemeName(name) {
  const val = name === 'dark' ? 'dark' : 'light';
  await AsyncStorage.setItem(KEYS.themeName, val);
  return val;
}

// Default rest seconds for Timer
export async function getDefaultRestSeconds() {
  const raw = await AsyncStorage.getItem(KEYS.defaultRestSeconds);
  const v = raw ? parseInt(raw, 10) : 60;
  return Number.isFinite(v) && v > 0 ? v : 60;
}

export async function setDefaultRestSeconds(v) {
  const safe = Number.isFinite(v) && v > 0 ? Math.round(v) : 60;
  await AsyncStorage.setItem(KEYS.defaultRestSeconds, String(safe));
  return safe;
}

// Suggestions based on last N sessions for same workout
export async function getWeightSuggestionsByWorkout(exerciseName, workoutId, limit = 3, repRange) {
  const sessions = await getSessions();
  let filtered = sessions.filter((s) => s.workoutId === workoutId && s.exerciseName === exerciseName);
  if (repRange) {
    const inRange = (r) => {
      if (repRange === '1-5') return r >= 1 && r <= 5;
      if (repRange === '6-12') return r >= 6 && r <= 12;
      if (repRange === '13+') return r >= 13;
      return true;
    };
    filtered = filtered.filter((s) => inRange(Number(s.reps) || 0));
  }
  const recent = filtered.slice(-limit).reverse();
  return recent.map((s) => ({ date: s.date, weightKg: s.weightKg }));
}

export async function getPRForExercise(exerciseName, workoutId) {
  const sessions = await getSessions();
  let pr = null;
  for (const s of sessions) {
    if (s.exerciseName === exerciseName && (!workoutId || s.workoutId === workoutId)) {
      if (!pr || (Number(s.weightKg) || 0) > (Number(pr.weightKg) || 0)) {
        pr = { weightKg: Number(s.weightKg) || 0, reps: Number(s.reps) || 0, date: s.date };
      }
    }
  }
  return pr; // may be null
}

export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export async function getWeeklyReportFor(year, week) {
  const sessions = await getSessions();
  // Calculate Monday of the ISO week
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4) ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  else ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  const start = new Date(ISOweekStart);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const byDay = {};
  const total = { sessions: 0, sets: 0, reps: 0, volumeKg: 0 };
  for (const s of sessions) {
    const d = new Date(s.date);
    if (d >= start && d <= end) {
      const dayKey = d.toLocaleDateString('pt-BR', { weekday: 'long' });
      if (!byDay[dayKey]) byDay[dayKey] = { sets: 0, reps: 0, volumeKg: 0, exercises: {} };
      byDay[dayKey].sets += 1;
      byDay[dayKey].reps += Number(s.reps) || 0;
      byDay[dayKey].volumeKg += (Number(s.weightKg) || 0) * ((Number(s.reps) || 0));
      byDay[dayKey].exercises[s.exerciseName] = (byDay[dayKey].exercises[s.exerciseName] || 0) + 1;
      total.sessions += 1;
      total.sets += 1;
      total.reps += Number(s.reps) || 0;
      total.volumeKg += (Number(s.weightKg) || 0) * ((Number(s.reps) || 0));
    }
  }
  return { byDay, total, rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
}

export async function getMonthlyReport(year, month /* 1-12 */) {
  const sessions = await getSessions();
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  const byDay = {};
  const total = { sessions: 0, sets: 0, reps: 0, volumeKg: 0 };
  for (const s of sessions) {
    const d = new Date(s.date);
    if (d >= start && d <= end) {
      const dayKey = d.toISOString().split('T')[0];
      if (!byDay[dayKey]) byDay[dayKey] = { sets: 0, reps: 0, volumeKg: 0, exercises: {} };
      byDay[dayKey].sets += 1;
      byDay[dayKey].reps += Number(s.reps) || 0;
      byDay[dayKey].volumeKg += (Number(s.weightKg) || 0) * ((Number(s.reps) || 0));
      byDay[dayKey].exercises[s.exerciseName] = (byDay[dayKey].exercises[s.exerciseName] || 0) + 1;
      total.sessions += 1;
      total.sets += 1;
      total.reps += Number(s.reps) || 0;
      total.volumeKg += (Number(s.weightKg) || 0) * ((Number(s.reps) || 0));
    }
  }
  return { byDay, total, rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
}