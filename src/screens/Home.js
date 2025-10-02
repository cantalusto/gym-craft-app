import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/theme';
import { useI18n } from '../i18n';
import { getSessionIncrements, setSessionIncrements } from '../storage/store';

export default function Home() {
  const colors = useTheme();
  const { t } = useI18n();
  const styles = makeStyles(colors);
  const [incKg, setIncKg] = useState('2.5');
  const [incLb, setIncLb] = useState('5');

  useEffect(() => {
    (async () => {
      const inc = await getSessionIncrements();
      setIncKg(String(inc.kg));
      setIncLb(String(inc.lb));
    })();
  }, []);

  const saveIncrements = async () => {
    const kg = parseFloat(incKg || '2.5') || 2.5;
    const lb = parseFloat(incLb || '5') || 5;
    await setSessionIncrements({ kg, lb });
  };
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t('home.welcome')}</Text>
        <Text style={styles.heroText}>{t('home.subtitle')}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('home.tipTitle')}</Text>
        <Text style={styles.cardMeta}>{t('home.tipText')}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('home.incTitle')}</Text>
        <Text style={styles.cardMeta}>{t('home.incMeta')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t('home.incKg')}</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={incKg} onChangeText={setIncKg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t('home.incLb')}</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={incLb} onChangeText={setIncLb} />
          </View>
        </View>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary, { marginTop: 8 }]} onPress={saveIncrements}>
          <Text style={styles.btnTextDark}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  heroText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  card: {
    marginTop: 12,
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
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textMuted,
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
  btnTextDark: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
});