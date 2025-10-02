import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../theme/theme';
import { getDefaultRestSeconds, setDefaultRestSeconds } from '../storage/store';

export default function Timer() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const [mode, setMode] = useState('descanso'); // 'descanso' | 'cronometro'
  const [running, setRunning] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(restSeconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (mode === 'descanso') setRemaining(restSeconds);
  }, [restSeconds, mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (mode === 'cronometro') {
          setElapsed((t) => t + 1);
        } else {
          setRemaining((r) => (r > 0 ? r - 1 : 0));
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode]);

  useEffect(() => {
    (async () => {
      const def = await getDefaultRestSeconds();
      setRestSeconds(def);
      setRemaining(def);
    })();
  }, []);

  const start = () => {
    setRunning(true);
  };

  const pause = () => {
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setRemaining(restSeconds);
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

  const timeText = mode === 'cronometro' ? format(elapsed) : format(remaining);

  return (
    <View style={styles.container}>
      <View style={styles.switchRow}>
        {[
          { key: 'descanso', label: 'Descanso' },
          { key: 'cronometro', label: 'Cronômetro' },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.switchBtn, mode === opt.key && styles.switchBtnActive]}
            onPress={() => {
              setMode(opt.key);
              reset();
            }}
          >
            <Text style={[styles.switchText, mode === opt.key && styles.switchTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'descanso' && (
        <View style={styles.inputRow}>
          <Text style={styles.label}>Tempo de descanso (segundos)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(restSeconds)}
            onChangeText={(v) => {
              const n = parseInt(v || '0', 10);
              setRestSeconds(Number.isNaN(n) ? 0 : Math.max(0, n));
            }}
            onBlur={async () => { await setDefaultRestSeconds(restSeconds); }}
          />
        </View>
      )}

      <View style={styles.clock}>
        <Text style={styles.time}>{timeText}</Text>
      </View>

      <View style={styles.controls}>
        {!running ? (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={start}>
            <Text style={styles.btnTextDark}>Iniciar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={pause}>
            <Text style={styles.btnTextDark}>Pausar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={reset}>
          <Text style={styles.btnTextGhost}>Resetar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    gap: 8,
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
  inputRow: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
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
  clock: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  time: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.text,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
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
});