import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, Animated, Image, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';

import Home from './src/screens/Home';
import WorkoutBuilder from './src/screens/WorkoutBuilder';
import Schedule from './src/screens/Schedule';
import Timer from './src/components/Timer';
import AIPlanner from './src/screens/AIPlanner';
import Report from './src/screens/Report';
import WorkoutDetail from './src/screens/WorkoutDetail';
import Settings from './src/screens/Settings';
import { ThemeProvider, useTheme } from './src/theme/theme';
import { I18nProvider, useI18n } from './src/i18n';
import { getThemeName, setThemeName } from './src/storage/store';

export default function App() {
  const [tab, setTab] = useState('Treino');
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [startEdit, setStartEdit] = useState(false);
  const [openBannerMessage, setOpenBannerMessage] = useState('');
  const [themeName, setThemeNameState] = useState('light');

  useEffect(() => {
    (async () => {
      const tn = await getThemeName();
      setThemeNameState(tn);
    })();
  }, []);

  const handleThemeChanged = async (name) => {
    const saved = await setThemeName(name);
    setThemeNameState(saved);
  };

  return (
    <I18nProvider>
      <ThemeProvider themeName={themeName}>
        <AppContent
          tab={tab}
          setTab={setTab}
          selectedWorkout={selectedWorkout}
          setSelectedWorkout={setSelectedWorkout}
          startEdit={startEdit}
          setStartEdit={setStartEdit}
          openBannerMessage={openBannerMessage}
          setOpenBannerMessage={setOpenBannerMessage}
          onThemeChanged={handleThemeChanged}
        />
      </ThemeProvider>
    </I18nProvider>
  );
}

function AppContent({ tab, setTab, selectedWorkout, setSelectedWorkout, startEdit, setStartEdit, openBannerMessage, setOpenBannerMessage, onThemeChanged }) {
  const colors = useTheme();
  const { t } = useI18n();
  const isDark = (colors.background === '#121212' || colors.background === '#000000');
  const [tabbarHeight, setTabbarHeight] = useState(0);
  const iconAnim = useRef(new Animated.Value(1)).current;
  const contentAnim = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const nativeDriver = Platform.OS !== 'web';
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.92], extrapolate: 'clamp' });
  const headerTranslateY = scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -8], extrapolate: 'clamp' });
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 48,
      paddingHorizontal: 20,
      paddingBottom: 12,
      backgroundColor: 'transparent',
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      marginTop: 4,
      color: colors.textMuted,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    brandIcon: {
      marginRight: 8,
    },
    content: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      paddingBottom: (tabbarHeight ? tabbarHeight + 12 : 80),
    },
    tabbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 8,
      backgroundColor: 'transparent',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 8,
      marginHorizontal: 2,
      borderRadius: 22,
    },
    tabItemActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },
    tabTextActive: {
      color: colors.onPrimary,
    },
  });

  const tabs = [
    { key: 'Agenda' },
    { key: 'Treino' },
    { key: 'Timer' },
    { key: 'Relatórios' },
    { key: 'Configurações' },
  ];

  useEffect(() => {
    // animação sutil do ícone ao trocar de abas
    iconAnim.setValue(0.9);
    Animated.timing(iconAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: nativeDriver,
    }).start();
    // transição suave do conteúdo ao trocar de abas/detalhe
    contentAnim.setValue(0);
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: nativeDriver,
    }).start();
  }, [tab, selectedWorkout]);

  const renderIcon = (key, active) => {
    const color = active ? colors.onPrimary : colors.textMuted;
    switch (key) {
      case 'Agenda':
        return <Ionicons name="calendar-outline" size={22} color={color} />;
      case 'Treino':
        return <MaterialCommunityIcons name="dumbbell" size={22} color={color} />;
      case 'Timer':
        return <Ionicons name="timer-outline" size={22} color={color} />;
      case 'Relatórios':
        return <Ionicons name="bar-chart-outline" size={22} color={color} />;
      case 'Configurações':
        return <Ionicons name="settings-outline" size={22} color={color} />;
      default:
        return null;
    }
  };

  // botão de aba com animação de press
  const TabButton = ({ active, children, onPress }) => {
    const pressAnim = useRef(new Animated.Value(1)).current;
    const onPressIn = () => {
      Animated.spring(pressAnim, { toValue: 0.96, useNativeDriver: nativeDriver, speed: 40, bounciness: 0 }).start();
    };
    const onPressOut = () => {
      Animated.spring(pressAnim, { toValue: 1, useNativeDriver: nativeDriver, speed: 40, bounciness: 8 }).start();
    };
    return (
      <Animated.View style={{ transform: [{ scale: pressAnim }], flex: 1 }}>
        <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={[styles.tabItem, active && styles.tabItemActive]}>
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={(colors.background === '#121212' || colors.background === '#000000') ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={Animated.event([
          { nativeEvent: { contentOffset: { y: scrollY } } }
        ], { useNativeDriver: nativeDriver })}
      >
        <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }}>
          <BlurView intensity={isDark ? 18 : 12} tint={isDark ? 'dark' : 'light'} style={styles.header}>
          <Animated.View
            style={{
              opacity: iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
              transform: [{ scale: iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
            }}
          >
            <View style={styles.brandRow}>
              {Platform.OS === 'web' ? (
                <Image
                  source={{ uri: 'https://www.svgrepo.com/show/325261/gym.svg' }}
                  style={[styles.brandIcon, { width: 28, height: 28 }]}
                  resizeMode="contain"
                />
              ) : (
                <MaterialCommunityIcons name="dumbbell" size={28} color={colors.text} style={styles.brandIcon} />
              )}
              <Text style={styles.title}>GymCraft</Text>
            </View>
          </Animated.View>
          <Text style={styles.subtitle}>{t('app.subtitle')}</Text>
          </BlurView>
        </Animated.View>

        <Animated.View style={{
          opacity: contentAnim,
          transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
        }}>
          {selectedWorkout ? (
            <WorkoutDetail
              workout={selectedWorkout}
              startInEditMode={startEdit}
              openBannerMessage={openBannerMessage}
              onClose={() => { setSelectedWorkout(null); setStartEdit(false); setOpenBannerMessage(''); }}
              onUpdateWorkout={(w) => setSelectedWorkout(w)}
            />
          ) : (
            <>
              {tab === 'Home' && <Home />}
              {tab === 'Agenda' && (
                <Schedule
                  onOpenWorkout={(w) => { setSelectedWorkout(w); setStartEdit(false); }}
                  onCreateNewWorkout={() => setTab('Treino')}
                />
              )}
              {tab === 'Treino' && (
                <WorkoutBuilder
                  onOpenWorkout={(w, edit=false) => { setSelectedWorkout(w); setStartEdit(!!edit); }}
                  onOpenAIPlanner={() => setTab('IA')}
                />
              )}
              {tab === 'Timer' && <Timer />}
              {tab === 'IA' && (
                <AIPlanner
                  onBackToTreino={() => setTab('Treino')}
                  onGoToSchedule={() => setTab('Agenda')}
                  onOpenFirstSavedWorkout={(w) => {
                    setSelectedWorkout(w);
                    setStartEdit(false);
                    setOpenBannerMessage(`${t('ai.openGeneratedWorkout')}: ${w.name}`);
                    setTab('Treino');
                  }}
                />
              )}
              {tab === 'Relatórios' && <Report />}
              {tab === 'Configurações' && (
                <Settings onThemeChanged={onThemeChanged} />
              )}
            </>
          )}
        </Animated.View>
      </Animated.ScrollView>

      <BlurView intensity={isDark ? 18 : 12} tint={isDark ? 'dark' : 'light'} style={styles.tabbar} onLayout={(e) => setTabbarHeight(e.nativeEvent.layout.height)}>
        {tabs.map((t) => (
          <TabButton key={t.key} active={tab === t.key} onPress={() => setTab(t.key)}>
            {renderIcon(t.key, tab === t.key)}
          </TabButton>
        ))}
      </BlurView>
    </View>
  );
}
