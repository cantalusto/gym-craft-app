import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Share, Platform } from 'react-native';
import { useTheme } from '../theme/theme';
import { getWeeklyReport, getWeeklyReportWithOffset, getUnit, getWeekNumber, getWeeklyReportFor, getMonthlyReport } from '../storage/store';

export default function Report() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const [report, setReport] = useState({ byDay: {}, total: { sessions: 0, sets: 0, reps: 0, volumeKg: 0 }, rangeStart: '', rangeEnd: '' });
  const [unit, setUnitState] = useState('kg');
  const [weekOffset, setWeekOffset] = useState(0);
  const [mode, setMode] = useState('week'); // 'week' | 'month'
  const [jumpYear, setJumpYear] = useState('');
  const [jumpWeek, setJumpWeek] = useState('');
  const [jumpMonth, setJumpMonth] = useState('');

  useEffect(() => {
    (async () => {
      const r = await getWeeklyReportWithOffset(weekOffset);
      setReport(r);
      const u = await getUnit();
      setUnitState(u);
    })();
  }, [weekOffset]);

  const kgToUnit = (v) => unit === 'lb' ? (Number(v) || 0) * 2.20462 : (Number(v) || 0);

  const days = Object.keys(report.byDay);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR');
  };

  const exportText = () => {
    const lines = [
      `Período: ${formatDate(report.rangeStart)} - ${formatDate(report.rangeEnd)}`,
      `Sets: ${report.total.sets}, Reps: ${report.total.reps}, Volume: ${kgToUnit(report.total.volumeKg).toFixed(1)}${unit}`,
    ];
    for (const d of days) {
      lines.push(`\n${d}: Sets ${report.byDay[d].sets}, Reps ${report.byDay[d].reps}, Volume ${kgToUnit(report.byDay[d].volumeKg).toFixed(1)}${unit}`);
      for (const [name, count] of Object.entries(report.byDay[d].exercises)) {
        lines.push(`- ${name}: ${count} sets`);
      }
    }
    const text = lines.join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('Relatório copiado para a área de transferência');
    }
  };

  const exportJson = () => {
    try {
      const dataStr = JSON.stringify(report, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${formatDate(report.rangeStart)}_${formatDate(report.rangeEnd)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.log(e);
    }
  };

  const exportCSV = () => {
    const rows = [];
    rows.push(['Data', 'Sets', 'Reps', `Volume (${unit})`].join(','));
    for (const d of days) {
      rows.push([
        d,
        report.byDay[d].sets,
        report.byDay[d].reps,
        kgToUnit(report.byDay[d].volumeKg).toFixed(1) + unit,
      ].join(','));
      for (const [name, count] of Object.entries(report.byDay[d].exercises)) {
        rows.push([`- ${name}`, count, '', ''].join(','));
      }
    }
    const csv = rows.join('\n');
    if (typeof document !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${formatDate(report.rangeStart)}_${formatDate(report.rangeEnd)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const printPDF = () => {
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
  };

  const shareSummary = async () => {
    const lines = [
      `Relatório (${formatDate(report.rangeStart)} - ${formatDate(report.rangeEnd)})`,
      `Sets: ${report.total.sets}, Reps: ${report.total.reps}, Volume: ${kgToUnit(report.total.volumeKg).toFixed(1)}${unit}`,
    ];
    for (const d of days) {
      lines.push(`${d}: Sets ${report.byDay[d].sets}, Reps ${report.byDay[d].reps}, Volume ${kgToUnit(report.byDay[d].volumeKg).toFixed(1)}${unit}`);
    }
    const text = lines.join('\n');
    try {
      if (Share && typeof Share.share === 'function') {
        await Share.share({ message: text });
      } else if (navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
        alert('Resumo copiado para a área de transferência');
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Relatório semanal</Text>
      <Text style={styles.subtitle}>Período: {formatDate(report.rangeStart)} - {formatDate(report.rangeEnd)}</Text>
      {(() => { const wk = getWeekNumber(new Date(report.rangeStart)); return (
        <Text style={styles.subtitle}>Semana ISO: {wk.week} ({wk.year})</Text>
      ); })()}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <TouchableOpacity style={styles.smallBtn} onPress={() => setWeekOffset((o) => o - 1)}>
          <Text style={styles.smallBtnText}>Semana anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtnGhost} onPress={() => setWeekOffset(0)}>
          <Text style={styles.smallBtnGhostText}>Voltar ao atual</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtnGhost} onPress={() => setWeekOffset((o) => o + 1)}>
          <Text style={styles.smallBtnGhostText}>Próxima semana</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <TouchableOpacity style={mode === 'week' ? styles.smallBtn : styles.smallBtnGhost} onPress={() => setMode('week')}>
          <Text style={mode === 'week' ? styles.smallBtnText : styles.smallBtnGhostText}>Semanal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={mode === 'month' ? styles.smallBtn : styles.smallBtnGhost} onPress={() => setMode('month')}>
          <Text style={mode === 'month' ? styles.smallBtnText : styles.smallBtnGhostText}>Mensal</Text>
        </TouchableOpacity>
      </View>

      {mode === 'week' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <TextInput style={styles.inputSmall} keyboardType="numeric" placeholder="Ano" value={jumpYear} onChangeText={setJumpYear} />
          <TextInput style={styles.inputSmall} keyboardType="numeric" placeholder="Semana" value={jumpWeek} onChangeText={setJumpWeek} />
          <TouchableOpacity style={styles.smallBtn} onPress={async () => {
            const y = parseInt(jumpYear || '0', 10);
            const w = parseInt(jumpWeek || '0', 10);
            if (y > 0 && w > 0) {
              const r = await getWeeklyReportFor(y, w);
              setReport(r);
              setWeekOffset(0);
            }
          }}>
            <Text style={styles.smallBtnText}>Ir para semana</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <TextInput style={styles.inputSmall} keyboardType="numeric" placeholder="Ano" value={jumpYear} onChangeText={setJumpYear} />
          <TextInput style={styles.inputSmall} keyboardType="numeric" placeholder="Mês (1-12)" value={jumpMonth} onChangeText={setJumpMonth} />
          <TouchableOpacity style={styles.smallBtn} onPress={async () => {
            const y = parseInt(jumpYear || '0', 10);
            const m = parseInt(jumpMonth || '0', 10);
            if (y > 0 && m >= 1 && m <= 12) {
              const r = await getMonthlyReport(y, m);
              setReport(r);
              setWeekOffset(0);
            }
          }}>
            <Text style={styles.smallBtnText}>Ir para mês</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.summary}>
        <Text style={styles.summaryItem}>Sets: {report.total.sets}</Text>
        <Text style={styles.summaryItem}>Reps: {report.total.reps}</Text>
        <Text style={styles.summaryItem}>Volume: {kgToUnit(report.total.volumeKg).toFixed(1)}{unit}</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <TouchableOpacity style={styles.smallBtn} onPress={exportText}>
          <Text style={styles.smallBtnText}>Copiar resumo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtnGhost} onPress={exportJson}>
          <Text style={styles.smallBtnGhostText}>Baixar JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtnGhost} onPress={exportCSV}>
          <Text style={styles.smallBtnGhostText}>Baixar CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtnGhost} onPress={printPDF}>
          <Text style={styles.smallBtnGhostText}>Imprimir/PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn} onPress={shareSummary}>
          <Text style={styles.smallBtnText}>Compartilhar</Text>
        </TouchableOpacity>
      </View>

      {days.length === 0 ? (
        <Text style={styles.empty}>Sem sessões registradas nesta semana.</Text>
      ) : (
        days.map((d) => (
          <View key={d} style={styles.card}>
            <Text style={styles.cardTitle}>{d}</Text>
            <Text style={styles.cardMeta}>Sets: {report.byDay[d].sets} • Reps: {report.byDay[d].reps} • Volume: {kgToUnit(report.byDay[d].volumeKg).toFixed(1)}{unit}</Text>
            <View style={{ marginTop: 6 }}>
              {Object.entries(report.byDay[d].exercises).map(([name, count]) => (
                <Text key={name} style={styles.exerciseLine}>• {name}: {count} sets</Text>
              ))}
            </View>
          </View>
        ))
      )}
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
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  summary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  smallBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    flexShrink: 1,
    ...shadowBtn,
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
    alignSelf: 'flex-start',
    flexShrink: 1,
  },
  smallBtnGhostText: {
    color: colors.text,
    fontWeight: '700',
  },
  inputSmall: {
    height: 36,
    minWidth: 80,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    flexGrow: 1,
    flexShrink: 1,
  },
  summaryItem: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  exerciseLine: {
    fontSize: 12,
    color: colors.text,
  },
  empty: {
    color: colors.textMuted,
  },
  });
}