import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useTheme } from '../theme/theme';
import { useI18n } from '../i18n';
import { saveWorkout, getUnit, setUnit, getWeightSuggestions, getWeightSuggestionsByWorkout, logSessionSet, getSessionIncrements, getPRForExercise } from '../storage/store';

export default function WorkoutDetail({ workout, onClose, onUpdateWorkout, startInEditMode = false, openBannerMessage = '' }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const { t } = useI18n();
  const [started, setStarted] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [editMode, setEditMode] = useState(!!startInEditMode);
  const [editedExercises, setEditedExercises] = useState([]);
  const [sessionExercises, setSessionExercises] = useState([]);
  const [unit, setUnitState] = useState('kg');
  const [suggestions, setSuggestions] = useState([]);
  const [repRange, setRepRange] = useState('6-12');
  const [increments, setIncrements] = useState({ kg: 2.5, lb: 5 });
  const [pr, setPr] = useState(null);
  const [isNewPR, setIsNewPR] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const intervalRef = useRef(null);

  const exercises = sessionExercises;
  const current = exercises[currentExerciseIndex];

  useEffect(() => {
    const base = (workout?.exercises || []).map((e) => ({ ...e }));
    setSessionExercises(base);
    setEditedExercises(base.map((e) => ({ ...e })));
    setEditMode(!!startInEditMode);
    (async () => {
      const u = await getUnit();
      setUnitState(u);
      const inc = await getSessionIncrements();
      setIncrements(inc);
    })();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [workout?.id, startInEditMode]);

  // Banner de confirmação ao abrir treino gerado pela IA
  useEffect(() => {
    if (openBannerMessage) {
      setBannerMessage(openBannerMessage);
      const t = setTimeout(() => setBannerMessage(''), 3000);
      return () => clearTimeout(t);
    } else {
      setBannerMessage('');
    }
  }, [openBannerMessage]);

  // Sincroniza edição quando entrar em modo de edição
  useEffect(() => {
    if (editMode) {
      setEditedExercises(sessionExercises.map((e) => ({ ...e })));
    }
  }, [editMode]);

  useEffect(() => {
    (async () => {
      const curr = sessionExercises[currentExerciseIndex];
      if (curr?.name) {
        const s = await getWeightSuggestionsByWorkout(curr.name, workout?.id, 3, repRange);
        setSuggestions(s);
        const p = await getPRForExercise(curr.name, workout?.id);
        setPr(p);
        setIsNewPR(false);
      } else {
        setSuggestions([]);
        setPr(null);
        setIsNewPR(false);
      }
    })();
  }, [currentExerciseIndex, sessionExercises, repRange]);

  const kgToUnit = (v) => unit === 'lb' ? (Number(v) || 0) * 2.20462 : (Number(v) || 0);
  const unitToKg = (v) => unit === 'lb' ? (Number(v) || 0) / 2.20462 : (Number(v) || 0);

  const startWorkout = () => {
    if (!exercises.length) return;
    setStarted(true);
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setRestRunning(false);
    setRestRemaining(0);
  };

  const startRest = () => {
    if (!current) return;
    const rest = Number(current.rest) || 60;
    // Log current set with weight and reps
    const weightKg = getCurrentSetWeight();
    const reps = Number(current.reps) || 0;
    logSessionSet({ date: new Date().toISOString(), workoutId: workout?.id, exerciseName: current.name, setIndex: currentSet, reps, weightKg });
    // PR check
    if (!pr || weightKg > (Number(pr.weightKg) || 0)) {
      setIsNewPR(true);
      setPr({ weightKg, reps, date: new Date().toISOString() });
    }
    setRestRemaining(rest);
    setRestRunning(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRestRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setRestRunning(false);
          nextSetOrExercise();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const skipRest = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRestRunning(false);
    setRestRemaining(0);
    nextSetOrExercise();
  };

  const nextSetOrExercise = () => {
    if (!current) return;
    const totalSets = Number(current.sets) || 1;
    if (currentSet < totalSets) {
      setCurrentSet((s) => s + 1);
    } else {
      // próximo exercício
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex((i) => i + 1);
        setCurrentSet(1);
      } else {
        // treino concluído
        setStarted(false);
      }
    }
  };

  const ensureWeightArrayForExercise = (ex) => {
    const totalSets = Number(ex.sets) || 1;
    if (!Array.isArray(ex.weightPerSet) || ex.weightPerSet.length !== totalSets) {
      const base = typeof ex.weight !== 'undefined' ? Number(ex.weight) || 0 : 0;
      ex.weightPerSet = Array(totalSets).fill(base);
    }
  };

  const getCurrentSetWeight = () => {
    if (!current) return 0;
    ensureWeightArrayForExercise(current);
    const idx = Math.max(0, Math.min((Number(current.sets) || 1) - 1, currentSet - 1));
    return Number(current.weightPerSet[idx] || 0);
  };

  const adjustCurrentSetWeight = (delta) => {
    setSessionExercises((prev) => {
      const next = prev.map((e) => ({ ...e }));
      const ex = next[currentExerciseIndex];
      if (!ex) return prev;
      const totalSets = Number(ex.sets) || 1;
      if (!Array.isArray(ex.weightPerSet) || ex.weightPerSet.length !== totalSets) {
        const base = typeof ex.weight !== 'undefined' ? Number(ex.weight) || 0 : 0;
        ex.weightPerSet = Array(totalSets).fill(base);
      }
      const idx = Math.max(0, Math.min(totalSets - 1, currentSet - 1));
      const val = Number(ex.weightPerSet[idx] || 0) + delta;
      ex.weightPerSet[idx] = Math.max(0, Math.round(val * 10) / 10);
      return next;
    });
  };

  const format = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!workout) {
    return (
      <ScrollView contentContainerStyle={styles.container}> 
        <Text style={styles.title}>{t('wd.noneSelected')}</Text>
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClose}>
          <Text style={styles.btnTextGhost}>{t('common.back')}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{workout.name}</Text>

      {!!bannerMessage && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{bannerMessage}</Text>
        </View>
      )}

      <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setEditMode((v) => !v)}>
        <Text style={styles.btnTextDark}>{editMode ? t('wd.exitEdit') : t('wd.editWorkout')}</Text>
      </TouchableOpacity>

      {!editMode ? (
        <View style={styles.list}>
          {exercises.map((e, idx) => (
            <View key={e.id || idx} style={[styles.exerciseItem, idx === currentExerciseIndex && styles.exerciseActive]}> 
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseTitle}>{e.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {e.sets} {t('workout.series')} • {e.reps} {t('workout.reps')} • {t('workout.rest')} {e.rest}{t('workout.secondsSuffix')}
                  {Array.isArray(e.weightPerSet) && e.weightPerSet.length ? ` • ${kgToUnit(e.weightPerSet[0]).toFixed(1)}${unit}` : (typeof e.weight !== 'undefined' ? ` • ${kgToUnit(e.weight).toFixed(1)}${unit}` : '')}
                </Text>
              </View>
              <Text style={styles.exerciseIndex}>#{idx + 1}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.list}>
          {editedExercises.map((e, idx) => (
            <View key={e.id || idx} style={[styles.exerciseItem]}> 
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseTitle}>{e.name}</Text>
                <View style={styles.editRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.editLabel}>{t('wd.edit.series')}</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(e.sets || '')}
                      onChangeText={(t) => setEditedExercises((prev) => prev.map((x, i) => {
                        if (i !== idx) return x;
                        const newSets = parseInt(t || '0', 10) || 0;
                        let wps = Array.isArray(x.weightPerSet) ? [...x.weightPerSet] : [];
                        const base = typeof x.weight !== 'undefined' ? Number(x.weight) || 0 : 0;
                        if (wps.length < newSets) {
                          wps = [...wps, ...Array(newSets - wps.length).fill(base)];
                        } else if (wps.length > newSets) {
                          wps = wps.slice(0, newSets);
                        }
                        return { ...x, sets: newSets, weightPerSet: wps };
                      }))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.editLabel}>{t('wd.edit.reps')}</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(e.reps || '')}
                      onChangeText={(t) => setEditedExercises((prev) => prev.map((x, i) => i === idx ? { ...x, reps: parseInt(t || '0', 10) || 0 } : x))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.editLabel}>{t('wd.edit.restSec')}</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(e.rest || '')}
                      onChangeText={(t) => setEditedExercises((prev) => prev.map((x, i) => i === idx ? { ...x, rest: parseInt(t || '0', 10) || 0 } : x))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.editLabel}>{t('wb.weight')} ({unit})</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(typeof e.weight !== 'undefined' ? kgToUnit(e.weight).toFixed(1) : '')}
                      onChangeText={(t) => setEditedExercises((prev) => prev.map((x, i) => i === idx ? { ...x, weight: unitToKg(parseFloat(t || '0') || 0) } : x))}
                    />
                  </View>
                </View>

                <View style={{ marginTop: 8 }}>
                  <Text style={styles.editLabel}>{t('wd.edit.weightPerSet')} ({unit})</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {Array.from({ length: Number(e.sets) || 0 }).map((_, sIdx) => (
                      <View key={sIdx} style={{ width: '30%', minWidth: 100 }}>
                        <Text style={styles.editLabel}>{t('wd.set')} {sIdx + 1}</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={String(Array.isArray(e.weightPerSet) ? (kgToUnit(e.weightPerSet[sIdx] ?? 0).toFixed(1)) : '')}
                          onChangeText={(t) => setEditedExercises((prev) => prev.map((x, i) => {
                            if (i !== idx) return x;
                            const totalSets = Number(x.sets) || 0;
                            let wps = Array.isArray(x.weightPerSet) ? [...x.weightPerSet] : Array(totalSets).fill(typeof x.weight !== 'undefined' ? Number(x.weight) || 0 : 0);
                            wps[sIdx] = unitToKg(parseFloat(t || '0') || 0);
                            return { ...x, weightPerSet: wps };
                          }))}
                        />
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.smallBtn, { marginTop: 8, alignSelf: 'flex-start' }]}
                    onPress={() => setEditedExercises((prev) => prev.map((x, i) => {
                      if (i !== idx) return x;
                      const totalSets = Number(x.sets) || 0;
                      const base = typeof x.weight !== 'undefined' ? Number(x.weight) || 0 : (Array.isArray(x.weightPerSet) && x.weightPerSet.length ? Number(x.weightPerSet[0]) || 0 : 0);
                      return { ...x, weightPerSet: Array(totalSets).fill(base) };
                    }))}
                  >
                    <Text style={styles.smallBtnText}>{t('wd.edit.distributeWeight')}</Text>
                  </TouchableOpacity>
                  {!!suggestions.length && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {suggestions.map((s, i) => (
                        <TouchableOpacity key={i} style={styles.smallBtn}
                          onPress={() => setEditedExercises((prev) => prev.map((x, ii) => {
                            if (ii !== idx) return x;
                            const totalSets = Number(x.sets) || 0;
                            const val = Number(s.weightKg) || 0;
                            return { ...x, weight: val, weightPerSet: Array(totalSets).fill(val) };
                          }))}
                        >
                          <Text style={styles.smallBtnText}>{kgToUnit(s.weightKg).toFixed(1)}{unit}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.smallBtnGhost} onPress={() => setEditedExercises((prev) => prev.filter((_, i) => i !== idx))}>
                <Text style={styles.smallBtnGhostText}>{t('common.remove')}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, { marginTop: 8 }]}
            onPress={async () => {
              const saved = await saveWorkout({ id: workout.id, name: workout.name, exercises: editedExercises });
              setEditMode(false);
              setSessionExercises(editedExercises.map((e) => ({ ...e })));
              if (onUpdateWorkout) onUpdateWorkout(saved);
            }}
          >
            <Text style={styles.btnTextDark}>{t('wd.saveChanges')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!started ? (
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={startWorkout} disabled={!exercises.length}>
          <Text style={styles.btnTextDark}>{exercises.length ? t('wd.startWorkout') : t('wd.noExercises')}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.sessionBox}>
      <Text style={styles.sessionTitle}>{t('wd.session.now')}: {current?.name}</Text>
      <Text style={styles.sessionMeta}>{t('wd.set')} {currentSet} {t('common.of')} {current?.sets || 1}</Text>
      <Text style={styles.sessionMeta}>{t('wd.session.currentWeight')}: {kgToUnit(getCurrentSetWeight()).toFixed(1)}{unit}</Text>

      {pr && (
        <View style={[styles.prBox, isNewPR && styles.prBoxNew]}>
          <Text style={styles.prText}>{t('wd.session.currentPR')}: {kgToUnit(pr.weightKg).toFixed(1)}{unit}{pr.reps ? ` × ${pr.reps}` : ''}</Text>
          {isNewPR && <Text style={styles.prBadge}>{t('wd.session.newPR')}</Text>}
        </View>
      )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => adjustCurrentSetWeight(unit === 'lb' ? -increments.lb : -increments.kg)}>
              <Text style={styles.btnTextGhost}>{unit === 'lb' ? `-${increments.lb}lb` : `-${increments.kg}kg`}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => adjustCurrentSetWeight(unit === 'lb' ? +increments.lb : +increments.kg)}>
              <Text style={styles.btnTextGhost}>{unit === 'lb' ? `+${increments.lb}lb` : `+${increments.kg}kg`}</Text>
            </TouchableOpacity>
          </View>

          {!!suggestions.length && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {suggestions.map((s, i) => (
                <TouchableOpacity key={i} style={styles.smallBtn}
                  onPress={() => setSessionExercises((prev) => {
                    const next = prev.map((e) => ({ ...e }));
                    const ex = next[currentExerciseIndex];
                    if (!ex) return prev;
                    const totalSets = Number(ex.sets) || 1;
                    if (!Array.isArray(ex.weightPerSet) || ex.weightPerSet.length !== totalSets) {
                      const base = typeof ex.weight !== 'undefined' ? Number(ex.weight) || 0 : 0;
                      ex.weightPerSet = Array(totalSets).fill(base);
                    }
                    const idx = Math.max(0, Math.min(totalSets - 1, currentSet - 1));
                    ex.weightPerSet[idx] = Number(s.weightKg) || 0;
                    return next;
                  })}
                >
                  <Text style={styles.smallBtnText}>{kgToUnit(s.weightKg).toFixed(1)}{unit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Rep range filter */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {['1-5', '6-12', '13+'].map((r) => (
              <TouchableOpacity key={r} style={r === repRange ? styles.smallBtn : styles.smallBtnGhost} onPress={() => setRepRange(r)}>
                <Text style={r === repRange ? styles.smallBtnText : styles.smallBtnGhostText}>{r} {t('workout.reps')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => adjustCurrentSetWeight(-2.5)}>
              <Text style={styles.btnTextGhost}>-2.5kg</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => adjustCurrentSetWeight(+2.5)}>
              <Text style={styles.btnTextGhost}>+2.5kg</Text>
            </TouchableOpacity>
          </View>

          {restRunning ? (
            <View style={styles.clock}>
              <Text style={styles.time}>{format(restRemaining)}</Text>
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={skipRest}>
                <Text style={styles.btnTextGhost}>{t('wd.skipRest')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={startRest}>
              <Text style={styles.btnTextDark}>{t('wd.finishSetAndRest')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClose}>
            <Text style={styles.btnTextGhost}>{t('wd.endWorkout')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={[styles.btn, styles.btnGhost, { marginTop: 8 }]} onPress={onClose}>
        <Text style={styles.btnTextGhost}>{t('common.back')}</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <TouchableOpacity
          style={[styles.smallBtn, unit === 'kg' ? styles.smallBtn : styles.smallBtnGhost]}
          onPress={async () => { const v = await setUnit('kg'); setUnitState(v); }}
        >
          <Text style={unit === 'kg' ? styles.smallBtnText : styles.smallBtnGhostText}>{t('common.kg')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallBtn, unit === 'lb' ? styles.smallBtn : styles.smallBtnGhost]}
          onPress={async () => { const v = await setUnit('lb'); setUnitState(v); }}
        >
          <Text style={unit === 'lb' ? styles.smallBtnText : styles.smallBtnGhostText}>{t('common.lb')}</Text>
        </TouchableOpacity>
      </View>
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
    flex: 1,
  },
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 8,
    ...shadowSoft,
  },
  bannerText: {
    color: colors.text,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  list: {
    gap: 8,
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    ...shadowSoft,
  },
  exerciseActive: {
    borderColor: colors.secondary,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  exerciseMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  exerciseIndex: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  editRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  editLabel: {
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
  sessionBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    ...shadowSoft,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sessionMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  clock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  time: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  btn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...shadowBtn,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.secondary,
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
  prBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  prBoxNew: {
    borderColor: colors.secondary,
    backgroundColor: '#E8E6E6',
  },
  prText: {
    color: colors.text,
    fontWeight: '700',
  },
  prBadge: {
    color: colors.secondary,
    fontWeight: '800',
  },
  });
}