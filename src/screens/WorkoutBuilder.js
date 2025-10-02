import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { useTheme } from '../theme/theme';
import { getWorkouts, saveWorkout, deleteWorkout, getUnit, setUnit } from '../storage/store';

export default function WorkoutBuilder({ onOpenWorkout, onOpenAIPlanner }) {
  const colors = useTheme();
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
          {item.sets} séries • {item.reps} reps • {item.rest}s descanso{typeof item.weight !== 'undefined' ? ` • ${kgToUnit(item.weight).toFixed(1)}${unit}` : ''}
        </Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeExercise(item.id)}>
        <Text style={styles.removeText}>Remover</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Montar treino</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <TouchableOpacity
          style={[styles.smallBtn, unit === 'kg' ? styles.smallBtn : styles.smallBtnGhost]}
          onPress={async () => { const v = await setUnit('kg'); setUnitState(v); }}
        >
          <Text style={unit === 'kg' ? styles.smallBtnText : styles.smallBtnGhostText}>kg</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallBtn, unit === 'lb' ? styles.smallBtn : styles.smallBtnGhost]}
          onPress={async () => { const v = await setUnit('lb'); setUnitState(v); }}
        >
          <Text style={unit === 'lb' ? styles.smallBtnText : styles.smallBtnGhostText}>lb</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Nome do treino</Text>
        <TextInput
          style={styles.input}
          placeholder="Perna, Peito e Tríceps..."
          value={workoutName}
          onChangeText={setWorkoutName}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Exercício</Text>
        <TextInput
          style={styles.input}
          placeholder="Supino reto, Agachamento..."
          value={name}
          onChangeText={setName}
        />
      </View>
      <View style={styles.gridRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Séries</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={sets}
            onChangeText={setSets}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Reps</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={reps}
            onChangeText={setReps}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Descanso (s)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={rest}
            onChangeText={setRest}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Peso ({unit})</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
        </View>
      </View>

      <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={addExercise}>
        <Text style={styles.btnTextDark}>Adicionar exercício</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnSecondary, { marginTop: 8 }]} onPress={() => onOpenAIPlanner && onOpenAIPlanner()}>
        <Text style={styles.btnTextDark}>Montar treinos com IA</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Seu treino</Text>
      {exercises.length === 0 ? (
        <Text style={styles.empty}>Nenhum exercício adicionado ainda.</Text>
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
          <Text style={styles.btnTextDark}>{editingId ? 'Atualizar treino' : 'Salvar treino (local)'}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.btn, styles.btnGhost, { marginTop: 8 }]} onPress={newWorkout}>
        <Text style={styles.btnTextGhost}>{editingId ? 'Sair da edição' : 'Novo treino'}</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Treinos salvos</Text>
      {list.length === 0 ? (
        <Text style={styles.empty}>Nenhum treino salvo ainda.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {list.map((w) => (
            <View key={w.id} style={styles.card}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => onOpenWorkout && onOpenWorkout(w)}>
                <Text style={styles.cardTitle}>{w.name}</Text>
                <Text style={styles.cardMeta}>{(w.exercises || []).length} exercícios</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallBtn} onPress={() => onOpenWorkout && onOpenWorkout(w, true)}>
                <Text style={styles.smallBtnText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallBtnGhost} onPress={() => removeWorkout(w.id)}>
                <Text style={styles.smallBtnGhostText}>Excluir</Text>
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