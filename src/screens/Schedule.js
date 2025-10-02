import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/theme';
import { getSchedule, setSchedule, getWorkouts, addEntryToDay, removeEntryFromDay } from '../storage/store';

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function Schedule({ onOpenWorkout, onCreateNewWorkout }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const isDark = (colors.background === '#121212' || colors.background === '#000000');
  const [schedule, setLocalSchedule] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [showAddForDay, setShowAddForDay] = useState(null);

  useEffect(() => {
    (async () => {
      const sch = await getSchedule();
      const w = await getWorkouts();
      setLocalSchedule(sch);
      setWorkouts(w);
    })();
  }, []);

  const addWorkoutEntry = async (day, workout) => {
    const updated = await addEntryToDay(day, { title: workout.name, workoutId: workout.id });
    setLocalSchedule(updated);
  };

  const removeEntry = async (day, idx) => {
    const updated = await removeEntryFromDay(day, idx);
    setLocalSchedule(updated);
  };

  const openEntry = (entry) => {
    if (!entry?.workoutId) return;
    const w = workouts.find((x) => x.id === entry.workoutId);
    if (w && onOpenWorkout) onOpenWorkout(w);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Agenda semanal</Text>
      <Text style={styles.helper}>Agrupe seus treinos por dia. Você pode adicionar rótulos simples (ex: "Perna") ou vincular um treino salvo.</Text>

      {DAYS.map((day) => {
        const dayData = schedule.find((d) => d.day === day) || { entries: [] };
        const workoutEntries = (dayData.entries || [])
          .map((entry, index) => ({ entry, index }))
          .filter((x) => !!x.entry.workoutId);
        return (
          <View key={day} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{day}</Text>

            {workoutEntries.length === 0 ? (
              <Text style={styles.empty}>Nenhum treino para este dia.</Text>
            ) : (
              <View style={{ gap: 6 }}>
                {workoutEntries.map(({ entry, index }) => (
                  <TouchableOpacity key={index} style={styles.entryRow} onPress={() => openEntry(entry)}>
                    <Text style={styles.entryText}>• {entry.title}</Text>
                    <TouchableOpacity style={styles.smallBtnGhost} onPress={() => removeEntry(day, index)}>
                      <Text style={styles.smallBtnGhostText}>Remover</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { marginTop: 8 }]}
              onPress={() => setShowAddForDay((prev) => (prev === day ? null : day))}
            >
              <Text style={styles.btnTextDark}>Adicionar treino</Text>
            </TouchableOpacity>

            {showAddForDay === day && workouts.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Vincular treino salvo:</Text>
                <View style={styles.tagsRow}>
                  {workouts.map((w) => (
                    <TouchableOpacity key={w.id} style={styles.tag} onPress={() => addWorkoutEntry(day, w)}>
                      <Text style={styles.tagText}>{w.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.btn, styles.btnGhost, { marginTop: 8 }]}
                  onPress={() => onCreateNewWorkout && onCreateNewWorkout()}
                >
                  <Text style={styles.btnTextGhost}>Criar novo treino</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      <BlurView intensity={isDark ? 18 : 12} tint={isDark ? 'dark' : 'light'} style={styles.footerBlur}>
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setSchedule(schedule)}>
          <Text style={styles.btnTextGhost}>Salvar agenda</Text>
        </TouchableOpacity>
      </BlurView>
    </ScrollView>
  );
}

const makeStyles = (colors) => {
  const isDark = colors.background === '#000000';
  const shadowSoft = Platform.select({
    web: {
      boxShadow: isDark ? '0 1px 6px rgba(0,0,0,0.25)' : '0 1px 6px rgba(0,0,0,0.08)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      shadowOpacity: isDark ? 0.25 : 0.08,
      elevation: 2,
    },
  });
  const shadowBtn = Platform.select({
    web: {
      boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.06)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      shadowOpacity: isDark ? 0.2 : 0.06,
      elevation: 2,
    },
  });
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
  dayCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    ...shadowSoft,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  empty: {
    color: colors.textMuted,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  entryText: {
    color: colors.text,
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    color: colors.text,
    fontWeight: '600',
  },
  btn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowBtn,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnTextDark: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  btnTextGhost: {
    color: colors.text,
    fontWeight: '700',
  },
  smallBtnGhost: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallBtnGhostText: {
    color: colors.text,
    fontWeight: '700',
  },
  footerBlur: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  });
}