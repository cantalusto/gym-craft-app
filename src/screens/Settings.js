import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { useTheme } from '../theme/theme';
import { useI18n } from '../i18n';
import { getThemeName, setThemeName, getUnit, setUnit, getDefaultRestSeconds, setDefaultRestSeconds } from '../storage/store';

export default function Settings({ onThemeChanged }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const { t, lang, setLang } = useI18n();

  const [themeName, setThemeNameState] = useState('light');
  const [unit, setUnitState] = useState('kg');
  const [restSeconds, setRestSeconds] = useState('60');

  useEffect(() => {
    (async () => {
      const tn = await getThemeName();
      setThemeNameState(tn);
      const u = await getUnit();
      setUnitState(u);
      const r = await getDefaultRestSeconds();
      setRestSeconds(String(r));
    })();
  }, []);

  const toggleTheme = async () => {
    const next = themeName === 'dark' ? 'light' : 'dark';
    const saved = await setThemeName(next);
    setThemeNameState(saved);
    if (onThemeChanged) onThemeChanged(saved);
  };

  const toggleUnit = async () => {
    const next = unit === 'lb' ? 'kg' : 'lb';
    const saved = await setUnit(next);
    setUnitState(saved);
  };

  const saveRest = async () => {
    const v = parseInt(restSeconds || '60', 10) || 60;
    const saved = await setDefaultRestSeconds(v);
    setRestSeconds(String(saved));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.theme.title')}</Text>
        <Text style={styles.cardMeta}>{t('settings.theme.meta')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TouchableOpacity style={styles.btn} onPress={toggleTheme}>
            <Text style={styles.btnTextDark}>{themeName === 'dark' ? t('settings.theme.disable') : t('settings.theme.enable')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.units.title')}</Text>
        <Text style={styles.cardMeta}>{t('settings.units.meta')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TouchableOpacity style={unit === 'kg' ? styles.switchBtnActive : styles.switchBtn} onPress={toggleUnit}>
            <Text style={unit === 'kg' ? styles.switchTextActive : styles.switchText}>{t('common.kg')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={unit === 'lb' ? styles.switchBtnActive : styles.switchBtn} onPress={toggleUnit}>
            <Text style={unit === 'lb' ? styles.switchTextActive : styles.switchText}>{t('common.lb')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.rest.title')}</Text>
        <Text style={styles.cardMeta}>{t('settings.rest.meta')}</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={restSeconds} onChangeText={setRestSeconds} />
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={saveRest}>
          <Text style={styles.btnTextDark}>{t('settings.rest.save')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.language.title')}</Text>
        <Text style={styles.cardMeta}>{t('settings.language.meta')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TouchableOpacity
            style={lang === 'pt' ? styles.switchBtnActive : styles.switchBtn}
            onPress={() => setLang('pt')}
          >
            <Text style={lang === 'pt' ? styles.switchTextActive : styles.switchText}>{t('settings.language.pt')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={lang === 'en' ? styles.switchBtnActive : styles.switchBtn}
            onPress={() => setLang('en')}
          >
            <Text style={lang === 'en' ? styles.switchTextActive : styles.switchText}>{t('settings.language.en')}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    ...shadowSoft,
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
    marginBottom: 6,
  },
  btn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    ...shadowBtn,
  },
  btnSecondary: {
    backgroundColor: colors.secondary,
  },
  btnTextDark: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  input: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    marginTop: 6,
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
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  switchTextActive: {
    color: colors.onPrimary,
    fontWeight: '600',
  },
  });
}