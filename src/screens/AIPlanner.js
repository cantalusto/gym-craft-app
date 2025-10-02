import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../theme/theme';
import { useI18n } from '../i18n';
import { saveWorkout, addEntryToDay } from '../storage/store';

const MUSCLES_PT = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'];
const MUSCLES_EN = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const MUSCLE_EN_TO_PT = { Chest: 'Peito', Back: 'Costas', Legs: 'Pernas', Shoulders: 'Ombros', Arms: 'Braços', Core: 'Core' };
const DAYS_PT = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_EN_TO_PT = { Monday: 'Segunda', Tuesday: 'Terça', Wednesday: 'Quarta', Thursday: 'Quinta', Friday: 'Sexta', Saturday: 'Sábado', Sunday: 'Domingo' };

const BASE_EXERCISES_PT = {
  Peito: ['Supino Reto', 'Crucifixo', 'Supino Inclinado', 'Peck Deck', 'Flexão de braço'],
  Costas: ['Barra Fixa', 'Remada Curvada', 'Puxada Frente', 'Remada Baixa', 'Levantamento Terra'],
  Pernas: ['Agachamento Livre', 'Leg Press', 'Levantamento Terra', 'Passada', 'Cadeira Extensora'],
  Ombros: ['Desenvolvimento', 'Elevação Lateral', 'Remada Alta', 'Elevação Frontal', 'Arnold Press'],
  Braços: ['Rosca Direta', 'Tríceps Testa', 'Rosca Martelo', 'Tríceps Corda', 'Rosca Scott'],
  Core: ['Prancha', 'Elevação de Pernas', 'Abdominal Crunch', 'Abdominal Bicicleta', 'Prancha Lateral'],
};
const BASE_EXERCISES_EN = {
  Chest: ['Flat Bench Press', 'Dumbbell Fly', 'Incline Bench Press', 'Pec Deck', 'Push-up'],
  Back: ['Pull-up', 'Bent-over Row', 'Lat Pulldown', 'Seated Cable Row', 'Deadlift'],
  Legs: ['Back Squat', 'Leg Press', 'Romanian Deadlift', 'Walking Lunge', 'Leg Extension'],
  Shoulders: ['Overhead Press', 'Lateral Raise', 'Upright Row', 'Front Raise', 'Arnold Press'],
  Arms: ['Barbell Curl', 'Skull Crusher', 'Hammer Curl', 'Cable Triceps Pushdown', 'Preacher Curl'],
  Core: ['Plank', 'Leg Raise', 'Crunch', 'Bicycle Crunch', 'Side Plank'],
};
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export default function AIPlanner({ onOpenFirstSavedWorkout, onBackToTreino, onGoToSchedule }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const { t, lang } = useI18n();
  const [goal, setGoal] = useState('Estética'); // Estética | Força
  const [frequency, setFrequency] = useState('4');
  const [equipment, setEquipment] = useState('Academia completa');
  const [issues, setIssues] = useState('');
  const [focus, setFocus] = useState([]);
  const [trainingDays, setTrainingDays] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveInfo, setSaveInfo] = useState('');
  const [firstSavedWorkout, setFirstSavedWorkout] = useState(null);
  const [timeAvailable, setTimeAvailable] = useState('45'); // minutes per session
  const [minExercises, setMinExercises] = useState('5');

  const toggleFocus = (m) => {
    setFocus((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const toggleDay = (day) => {
    setTrainingDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const generatePlan = async () => {
    // Simulação de geração usando regras simples
    const days = trainingDays.length > 0 ? trainingDays.length : 7;
    const muscles = lang === 'en' ? MUSCLES_EN : MUSCLES_PT;
    const dayNames = trainingDays.length > 0 ? trainingDays : (lang === 'en' ? DAYS_EN : DAYS_PT);
    const baseExercises = lang === 'en' ? BASE_EXERCISES_EN : BASE_EXERCISES_PT;
    const min = Math.max(1, parseInt(minExercises || '5', 10) || 5);

    const split = [];
    const targets = focus.length > 0 ? focus : muscles;
    for (let d = 0; d < days; d++) {
      const muscle = targets[d % targets.length];
      const picks = (baseExercises[muscle] || []).slice(0, min);
      split.push({
        day: dayNames[d],
        muscle,
        exercises: picks.map((ex) => ({ ex, sets: goal === 'Força' ? 5 : 4, reps: goal === 'Força' ? 5 : 10, rest: goal === 'Força' ? 120 : 60 })),
      });
    }
    const newPlan = { goal, days, equipment, issues, split };
    setPlan(newPlan);
    // Salva automaticamente assim que gerar
    await savePlanToWorkoutsAndSchedule(newPlan);
  };

  const cleanJSONText = (txt) => {
    if (!txt) return '';
    // Remove cercas de código ```json ... ```
    return txt.replace(/^```json\n?|```$/g, '').trim();
  };

  const generatePlanAI = async () => {
    const targets = focus.length > 0 ? focus : (lang === 'en' ? MUSCLES_EN : MUSCLES_PT);
    const dayNames = trainingDays.length > 0 ? trainingDays : (lang === 'en' ? DAYS_EN : DAYS_PT);
    setLoading(true);
    try {
      if (!GEMINI_API_KEY) {
        // Sem chave no ambiente: usa gerador local
        await generatePlan();
        return;
      }
      const minutes = parseInt(timeAvailable || '45', 10) || 45;
      const min = Math.max(1, parseInt(minExercises || '5', 10) || 5);
      const promptPT = `Você é um treinador. Gere um plano COMPLETO de treino para os dias: ${dayNames.join(', ')}.\n` +
        `Objetivo: ${goal}.\nEquipamentos: ${equipment}.\nRestrições: ${issues || 'nenhuma'}.\nTempo disponível por sessão: ${minutes} minutos.\n` +
        `Foco muscular preferido: ${targets.join(', ')}.\n` +
        `Para cada dia, defina um grupo muscular principal e liste no mínimo ${min} exercícios (a não ser que o usuário sugira menos) com séries, repetições e descanso em segundos.\n` +
        `Responda APENAS em JSON no formato: {"plan":[{"day":"Segunda","muscle":"Peito","exercises":[{"name":"Supino Reto","sets":4,"reps":10,"rest":60}]}]}.`;
      const promptEN = `You are a coach. Generate a COMPLETE training plan for these days: ${dayNames.join(', ')}.\n` +
        `Goal: ${goal === 'Força' ? 'Strength' : 'Aesthetics'}.\nEquipment: ${equipment}.\nRestrictions: ${issues || 'none'}.\nTime available per session: ${minutes} minutes.\n` +
        `Preferred muscle focus: ${targets.join(', ')}.\n` +
        `For each day, set a primary muscle group and list at least ${min} exercises (unless the user suggests fewer) with sets, reps, and rest in seconds.\n` +
        `Respond ONLY in JSON in the format: {"plan":[{"day":"Monday","muscle":"Chest","exercises":[{"name":"Flat Bench Press","sets":4,"reps":10,"rest":60}]}]}.`;
      const prompt = lang === 'en' ? promptEN : promptPT;
      const urlBase = 'https://generativelanguage.googleapis.com/v1beta/models/';
      const models = ['gemini-1.5-flash-latest', 'gemini-1.5-flash'];
      let data = null;
      let lastStatus = 0;
      for (const m of models) {
        const res = await fetch(`${urlBase}${m}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        lastStatus = res.status;
        if (res.ok) { data = await res.json(); break; }
      }
      if (!data) throw new Error(`HTTP ${lastStatus}`);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = cleanJSONText(text);
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        // Tenta uma heurística simples caso venha texto extra
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start >= 0 && end > start) parsed = JSON.parse(cleaned.slice(start, end + 1));
      }

      const split = (parsed?.plan || []).map((d) => {
        const muscleLabel = d.muscle;
        const base = lang === 'en' ? BASE_EXERCISES_EN : BASE_EXERCISES_PT;
        let exercises = (d.exercises || []).map((e) => ({
          ex: e.name,
          sets: Number(e.sets) || (goal === 'Força' ? 5 : 4),
          reps: Number(e.reps) || (goal === 'Força' ? 5 : 10),
          rest: Number(e.rest) || (goal === 'Força' ? 120 : 60),
        }));
        // Ensure minimum of 5 exercises
        const baseList = base[muscleLabel] || [];
        const minCount = Math.max(1, parseInt(minExercises || '5', 10) || 5);
        while (exercises.length < minCount && baseList[exercises.length]) {
          const name = baseList[exercises.length];
          exercises.push({ ex: name, sets: goal === 'Força' ? 5 : 4, reps: goal === 'Força' ? 5 : 10, rest: goal === 'Força' ? 120 : 60 });
        }
        return { day: d.day, muscle: muscleLabel, exercises };
      });

      if (split.length === 0) {
        // Fallback seguro para lógica local
        await generatePlan();
      } else {
        const newPlan = { goal, days: split.length, equipment, issues, split };
        setPlan(newPlan);
        // Salva automaticamente após gerar com IA
        await savePlanToWorkoutsAndSchedule(newPlan);
      }
    } catch (err) {
      // Fallback para demo local em caso de erro de rede ou parsing
      await generatePlan();
    } finally {
      setLoading(false);
    }
  };

  const savePlanToWorkoutsAndSchedule = async (thePlan = plan) => {
    if (!thePlan?.split || thePlan.split.length === 0) return;
    setSaving(true);
    setSaveInfo('');
    try {
      let savedCount = 0;
      let firstSaved = null;
      for (const d of thePlan.split) {
        const workoutName = `${d.day} • ${d.muscle}`;
        const exercises = (d.exercises || []).map((e) => ({
          name: e.ex,
          sets: Number(e.sets) || 3,
          reps: Number(e.reps) || 10,
          rest: Number(e.rest) || 60,
        }));
        // Enforce minimum exercises unless user explicitly provided fewer in plan
        const minCount = Math.max(1, parseInt(minExercises || '5', 10) || 5);
        if (exercises.length < minCount) {
          const base = lang === 'en' ? BASE_EXERCISES_EN : BASE_EXERCISES_PT;
          const baseList = base[d.muscle] || [];
          const toAdd = Math.max(0, minCount - exercises.length);
          for (let i = 0; i < toAdd && i < baseList.length; i++) {
            exercises.push({ name: baseList[i], sets: goal === 'Força' ? 5 : 4, reps: goal === 'Força' ? 5 : 10, rest: goal === 'Força' ? 120 : 60 });
          }
        }
        const saved = await saveWorkout({ name: workoutName, exercises });
        // Schedule uses Portuguese day keys; map if current language is English
        const scheduleDay = lang === 'en' ? (DAY_EN_TO_PT[d.day] || d.day) : d.day;
        await addEntryToDay(scheduleDay, { title: workoutName, workoutId: saved.id });
        savedCount += 1;
        if (!firstSaved) firstSaved = saved;
      }
      setSaveInfo(t('ai.saveInfo').replace('{count}', String(savedCount)));
      // Quick notification
      try { Alert.alert(t('ai.saveSuccess.title'), t('ai.saveSuccess.msg').replace('{count}', String(savedCount))); } catch {}
      setFirstSavedWorkout(firstSaved);
      // Redirect to Schedule after saving
      if (typeof onGoToSchedule === 'function') {
        onGoToSchedule();
      } else if (firstSaved && typeof onOpenFirstSavedWorkout === 'function') {
        // Fallback: open first saved workout
        onOpenFirstSavedWorkout(firstSaved);
      }
    } catch (e) {
      setSaveInfo(t('ai.saveFail'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {typeof onBackToTreino === 'function' && (
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => onBackToTreino()}>
          <Text style={styles.btnTextGhost}>{t('ai.backToWorkout')}</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{t('ai.title')}</Text>
      <Text style={styles.helper}>{t('ai.helper')}</Text>

      <Text style={styles.label}>{t('ai.goal')}</Text>
      <View style={styles.switchRow}>
        {['Estética', 'Força'].map((g) => (
          <TouchableOpacity key={g} style={[styles.switchBtn, goal === g && styles.switchBtnActive]} onPress={() => setGoal(g)}>
            <Text style={[styles.switchText, goal === g && styles.switchTextActive]}>{g === 'Estética' ? t('ai.goal.estetica') : t('ai.goal.forca')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('ai.days')}</Text>
      <View style={styles.tagsRow}>
        {(lang === 'en' ? DAYS_EN : DAYS_PT).map((d) => (
          <TouchableOpacity key={d} style={[styles.tag, trainingDays.includes(d) && styles.tagActive]} onPress={() => toggleDay(d)}>
            <Text style={[styles.tagText, trainingDays.includes(d) && styles.tagTextActive]}>{t('day.' + (lang === 'en' ? DAY_EN_TO_PT[d] : d))}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('ai.timeAvailable')}</Text>
      <TextInput style={styles.input} value={String(timeAvailable)} onChangeText={setTimeAvailable} keyboardType="numeric" placeholder={t('ai.timeAvailable.ph')} />

      <Text style={styles.label}>{t('ai.minExercises')}</Text>
      <TextInput style={styles.input} value={String(minExercises)} onChangeText={setMinExercises} keyboardType="numeric" placeholder={t('ai.minExercises.ph')} />

      <Text style={styles.label}>{t('ai.equipment')}</Text>
      <TextInput style={styles.input} value={equipment} onChangeText={setEquipment} />

      <Text style={styles.label}>{t('ai.issues')}</Text>
      <TextInput style={[styles.input, { height: 80 }]} value={issues} onChangeText={setIssues} multiline />

      <Text style={styles.label}>{t('ai.focus')}</Text>
      <View style={styles.tagsRow}>
        {(lang === 'en' ? MUSCLES_EN : MUSCLES_PT).map((m) => (
          <TouchableOpacity key={m} style={[styles.tag, focus.includes(m) && styles.tagActive]} onPress={() => toggleFocus(m)}>
            <Text style={[styles.tagText, focus.includes(m) && styles.tagTextActive]}>{t('muscle.' + (lang === 'en' ? MUSCLE_EN_TO_PT[m] : m))}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={generatePlanAI} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.btnTextDark}>{t('ai.generateAI')}</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={generatePlan} disabled={loading}>
        <Text style={styles.btnTextGhost}>{t('ai.generateDemo')}</Text>
      </TouchableOpacity>
      {plan && (
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={savePlanToWorkoutsAndSchedule} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.btnTextDark}>{t('ai.savePlan')}</Text>}
        </TouchableOpacity>
      )}

      {plan && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subtitle}>{t('ai.planGenerated')}</Text>
          {plan.split.map((d, idx) => (
            <View key={idx} style={styles.card}>
              <Text style={styles.cardTitle}>{d.day} • {d.muscle}</Text>
              {d.exercises.map((e, idx) => (
                <Text key={idx} style={styles.cardMeta}>• {e.ex} — {e.sets}x{e.reps}, {t('workout.rest')} {e.rest}{t('workout.secondsSuffix')}</Text>
              ))}
            </View>
          ))}
          {!!saveInfo && <Text style={[styles.helper, { marginTop: 8 }]}>{saveInfo}</Text>}
          {firstSavedWorkout && (
            <TouchableOpacity style={[styles.btn, styles.btnSecondary, { marginTop: 8 }]} onPress={() => onOpenFirstSavedWorkout && onOpenFirstSavedWorkout(firstSavedWorkout)}>
              <Text style={styles.btnTextDark}>{t('ai.openFirst')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (colors) => {
  const isDark = colors.background === '#000000';
  const shadowSoft = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    shadowOpacity: isDark ? 0.25 : 0.08,
    elevation: 2,
  };
  const shadowBtn = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: isDark ? 0.2 : 0.06,
    elevation: 2,
  };
  return StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  helper: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  switchBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchBtnActive: {
    backgroundColor: colors.primary,
  },
  switchText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  switchTextActive: {
    color: colors.onPrimary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagActive: {
    backgroundColor: colors.primary,
  },
  tagText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  tagTextActive: {
    color: colors.onPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    ...shadowSoft,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  btn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    ...shadowBtn,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.secondary,
  },
  btnTextDark: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnTextGhost: {
    color: colors.text,
    fontWeight: '700',
  },
  });
}