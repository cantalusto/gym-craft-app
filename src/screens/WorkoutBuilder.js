import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { useTheme } from '../theme/theme';
import { useI18n } from '../i18n';
import { getWorkouts, saveWorkout, deleteWorkout, getUnit, setUnit } from '../storage/store';

export default function WorkoutBuilder({ onOpenWorkout, onOpenAIPlanner }) {
  const colors = useTheme();
  const { t } = useI18n();
  const styles = makeStyles(colors);
  const [workoutName, setWorkoutName] = useState('Treino de Perna');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [rest, setRest] = useState('60');
  const [weight, setWeight] = useState('');
  const [unit, setUnitState] = useState('kg');
  const [exercises, setExercises] = useState([]);
  const [name, setName] = useState('');
  const [list, setList] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    (async () => {
      const w = await getWorkouts();
      setList(w);
      const u = await getUnit();
      setUnitState(u);
    })();
  }, []);

  const kgToUnit = (v) => unit === 'lb' ? (Number(v) || 0) * 2.20462 : (Number(v) || 0);
  const unitToKg = (v) => unit === 'lb' ? (Number(v) || 0) / 2.20462 : (Number(v) || 0);

  const addExercise = () => {
    if (!name.trim()) return;
    const baseKg = unitToKg(parseFloat(weight || '0') || 0);
    const item = {
      id: Date.now().toString(),
      name: name.trim(),
      sets: parseInt(sets || '0', 10) || 0,
      reps: parseInt(reps || '0', 10) || 0,
      rest: parseInt(rest || '0', 10) || 0,
      weight: baseKg,
      // Inicializa peso por série com o mesmo valor base
      weightPerSet: Array(parseInt(sets || '0', 10) || 0).fill(baseKg),
    };
    setExercises((prev) => [...prev, item]);
    setName('');
    setWeight('');
  };

  const removeExercise = (id) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const save = async () => {
    const payload = { id: editingId || undefined, name: workoutName.trim() || 'Treino', exercises };
    const saved = await saveWorkout(payload);
    const w = await getWorkouts();
    setList(w);
    setEditingId(saved.id);
  };

  const loadWorkout = (w) => {
    setEditingId(w.id);
    setWorkoutName(w.name);
    setExercises(w.exercises || []);
  };

  const removeWorkout = async (id) => {
    await deleteWorkout(id);
    const w = await getWorkouts();
    setList(w);
    if (editingId === id) {
      setEditingId(null);
      setWorkoutName('');
      setExercises([]);
    }
  };

  const newWorkout = () => {
    setEditingId(null);
    setWorkoutName('');
    setExercises([]);
    setSets('3');
    setReps('10');
    setRest('60');
    setName('');
    setWeight('');
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardMeta}>
          {item.sets} {t('workout.series')} • {item.reps} {t('workout.reps')} • {item.rest}{t('workout.secondsSuffix')} {t('workout.rest')}{typeof item.weight !== 'undefined' ? ` • ${kgToUnit(item.weight).toFixed(1)}${unit}` : ''}
        </Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeExercise(item.id)}>
        <Text style={styles.removeText}>{t('schedule.remove')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>{t('wb.buildTitle')}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <TouchableOpacity
          style={[styles.smallBtn, unit === 'kg' ? styles.smallBtn : styles.smallBtnGhost]}
          onPress={async () => { const v = await setUnit('kg'); setUnitState(v); }}
        >
          <Text style={unit === 'kg' ? styles.smallBtnText : styles.smallBtnGhostText}>{t('wb.unit.kg')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallBtn, unit === 'lb' ? styles.smallBtn : styles.smallBtnGhost]}
          onPress={async () => { const v = await setUnit('lb'); setUnitState(v); }}
        >
          <Text style={unit === 'lb' ? styles.smallBtnText : styles.smallBtnGhostText}>{t('wb.unit.lb')}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t('wb.workoutName')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('wb.workoutName.ph')}
          value={workoutName}
          onChangeText={setWorkoutName}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>{t('wb.exercise')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('wb.exercise.ph')}
          value={name}
          onChangeText={setName}
        />
      </View>
      <View style={styles.gridRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('wb.series')}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={sets}
            onChangeText={setSets}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('wb.reps')}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={reps}
            onChangeText={setReps}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('wb.restSec')}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={rest}
            onChangeText={setRest}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{`${t('wb.weight')} (${unit})`}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
        </View>
      </View>

      <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={addExercise}>
        <Text style={styles.btnTextDark}>{t('wb.addExercise')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnSecondary, { marginTop: 8 }]} onPress={() => onOpenAIPlanner && onOpenAIPlanner()}>
        <Text style={styles.btnTextDark}>{t('wb.aiBuild')}</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t('wb.yourWorkout')}</Text>
      {exercises.length === 0 ? (
        <Text style={styles.empty}>{t('wb.empty')}</Text>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ gap: 8 }}
        />
      )}

      {exercises.length > 0 && (
        <TouchableOpacity style={[styles.btn, styles.btnSecondary, { marginTop: 12 }]} onPress={save}>
          <Text style={styles.btnTextDark}>{editingId ? t('wb.update') : t('wb.saveLocal')}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.btn, styles.btnGhost, { marginTop: 8 }]} onPress={newWorkout}>
        <Text style={styles.btnTextGhost}>{editingId ? t('wb.exitEdit') : t('wb.newWorkout')}</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t('wb.savedTitle')}</Text>
      {list.length === 0 ? (
        <Text style={styles.empty}>{t('wb.savedEmpty')}</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {list.map((w) => (
            <View key={w.id} style={styles.card}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => onOpenWorkout && onOpenWorkout(w)}>
                <Text style={styles.cardTitle}>{w.name}</Text>
                <Text style={styles.cardMeta}>{(w.exercises || []).length} {t('wb.exercisesCount')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallBtn} onPress={() => onOpenWorkout && onOpenWorkout(w, true)}>
                <Text style={styles.smallBtnText}>{t('common.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallBtnGhost} onPress={() => removeWorkout(w.id)}>
                <Text style={styles.smallBtnGhostText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  row: {
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 6,
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
  btn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  removeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removeText: {
    color: colors.text,
    fontWeight: '700',
  },
  smallBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  smallBtnText: {
    color: colors.onPrimary,
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
  empty: {
    color: colors.textMuted,
  },
});