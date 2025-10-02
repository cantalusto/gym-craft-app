import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../theme/theme';
import { saveWorkout, addEntryToDay } from '../storage/store';

const MUSCLES = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'];
const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export default function AIPlanner({ onOpenFirstSavedWorkout, onBackToTreino }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
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

  const toggleFocus = (m) => {
    setFocus((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const toggleDay = (day) => {
    setTrainingDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const generatePlan = async () => {
    // Simulação de geração usando regras simples
    const days = trainingDays.length > 0 ? trainingDays.length : 7;
    const baseExercises = {
      Peito: ['Supino Reto', 'Crucifixo', 'Supino Inclinado'],
      Costas: ['Barra Fixa', 'Remada Curvada', 'Puxada Frente'],
      Pernas: ['Agachamento Livre', 'Leg Press', 'Levantamento Terra'],
      Ombros: ['Desenvolvimento', 'Elevação Lateral', 'Remada Alta'],
      Braços: ['Rosca Direta', 'Tríceps Testa', 'Rosca Martelo'],
      Core: ['Prancha', 'Elevação de Pernas', 'Abdominal Crunch'],
    };

    const split = [];
    const targets = focus.length > 0 ? focus : MUSCLES;
    const dayNames = trainingDays.length > 0 ? trainingDays : DAYS;
    for (let d = 0; d < days; d++) {
      const muscle = targets[d % targets.length];
      split.push({
        day: dayNames[d],
        muscle,
        exercises: baseExercises[muscle].map((ex) => ({ ex, sets: goal === 'Força' ? 5 : 3, reps: goal === 'Força' ? 5 : 10, rest: goal === 'Força' ? 120 : 60 })),
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
    const selectedDays = trainingDays.length > 0 ? trainingDays : DAYS;
    const targets = focus.length > 0 ? focus : MUSCLES;
    setLoading(true);
    try {
      if (!GEMINI_API_KEY) {
        // Sem chave no ambiente: usa gerador local
        await generatePlan();
        return;
      }
      const prompt = `Você é um treinador. Gere um plano COMPLETO de treino para os dias: ${selectedDays.join(', ')}.\n` +
        `Objetivo: ${goal}.\nEquipamentos: ${equipment}.\nRestrições: ${issues || 'nenhuma'}.\n` +
        `Foco muscular preferido: ${targets.join(', ')}.\n` +
        `Para cada dia, defina um grupo muscular principal e liste 3 a 5 exercícios com séries, repetições e descanso em segundos.\n` +
        `Responda APENAS em JSON no formato: {"plan":[{"day":"Segunda","muscle":"Peito","exercises":[{"name":"Supino Reto","sets":3,"reps":10,"rest":60}]}]}.`;
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

      const split = (parsed?.plan || []).map((d) => ({
        day: d.day,
        muscle: d.muscle,
        exercises: (d.exercises || []).map((e) => ({
          ex: e.name,
          sets: Number(e.sets) || (goal === 'Força' ? 5 : 3),
          reps: Number(e.reps) || (goal === 'Força' ? 5 : 10),
          rest: Number(e.rest) || (goal === 'Força' ? 120 : 60),
        })),
      }));

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
        const saved = await saveWorkout({ name: workoutName, exercises });
        await addEntryToDay(d.day, { title: workoutName, workoutId: saved.id });
        savedCount += 1;
        if (!firstSaved) firstSaved = saved;
      }
      setSaveInfo(`Plano salvo: ${savedCount} treinos criados e vinculados na Agenda.`);
      // Notificação rápida
      try { Alert.alert('Plano salvo', `${savedCount} treinos criados e vinculados na Agenda.`); } catch {}
      setFirstSavedWorkout(firstSaved);
      // Navega direto para o primeiro treino gerado
      if (firstSaved && typeof onOpenFirstSavedWorkout === 'function') {
        onOpenFirstSavedWorkout(firstSaved);
      }
    } catch (e) {
      setSaveInfo('Falha ao salvar plano. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {typeof onBackToTreino === 'function' && (
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => onBackToTreino()}>
          <Text style={styles.btnTextGhost}>Voltar para Treino</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.title}>Treino via IA</Text>
      <Text style={styles.helper}>Selecione preferências e gere um plano para a semana inteira ou apenas nos dias escolhidos.</Text>

      <Text style={styles.label}>Objetivo</Text>
      <View style={styles.switchRow}>
        {['Estética', 'Força'].map((g) => (
          <TouchableOpacity key={g} style={[styles.switchBtn, goal === g && styles.switchBtnActive]} onPress={() => setGoal(g)}>
            <Text style={[styles.switchText, goal === g && styles.switchTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Dias de treino (deixe vazio para semana inteira)</Text>
      <View style={styles.tagsRow}>
        {DAYS.map((d) => (
          <TouchableOpacity key={d} style={[styles.tag, trainingDays.includes(d) && styles.tagActive]} onPress={() => toggleDay(d)}>
            <Text style={[styles.tagText, trainingDays.includes(d) && styles.tagTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Equipamentos disponíveis</Text>
      <TextInput style={styles.input} value={equipment} onChangeText={setEquipment} />

      <Text style={styles.label}>Dores / restrições</Text>
      <TextInput style={[styles.input, { height: 80 }]} value={issues} onChangeText={setIssues} multiline />

      <Text style={styles.label}>Foco muscular</Text>
      <View style={styles.tagsRow}>
        {MUSCLES.map((m) => (
          <TouchableOpacity key={m} style={[styles.tag, focus.includes(m) && styles.tagActive]} onPress={() => toggleFocus(m)}>
            <Text style={[styles.tagText, focus.includes(m) && styles.tagTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={generatePlanAI} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.btnTextDark}>Gerar treino com IA</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={generatePlan} disabled={loading}>
        <Text style={styles.btnTextGhost}>Gerar treino (demo offline)</Text>
      </TouchableOpacity>
      {plan && (
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={savePlanToWorkoutsAndSchedule} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.btnTextDark}>Salvar plano em Treinos e Agenda</Text>}
        </TouchableOpacity>
      )}

      {plan && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subtitle}>Plano gerado</Text>
          {plan.split.map((d, idx) => (
            <View key={idx} style={styles.card}>
              <Text style={styles.cardTitle}>{d.day} • {d.muscle}</Text>
              {d.exercises.map((e, idx) => (
                <Text key={idx} style={styles.cardMeta}>• {e.ex} — {e.sets}x{e.reps}, descanso {e.rest}s</Text>
              ))}
            </View>
          ))}
          {!!saveInfo && <Text style={[styles.helper, { marginTop: 8 }]}>{saveInfo}</Text>}
          {firstSavedWorkout && (
            <TouchableOpacity style={[styles.btn, styles.btnSecondary, { marginTop: 8 }]} onPress={() => onOpenFirstSavedWorkout && onOpenFirstSavedWorkout(firstSavedWorkout)}>
              <Text style={styles.btnTextDark}>Abrir primeiro treino</Text>
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