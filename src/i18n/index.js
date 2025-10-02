import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { getLanguageName, setLanguageName } from '../storage/store';

const I18nContext = createContext({
  lang: 'pt',
  setLang: () => {},
  t: (key) => key,
});

const translations = {
  pt: {
    'app.subtitle': 'Treinos modernos, simples e inteligentes',
    'settings.title': 'Configurações',
    'settings.theme.title': 'Tema',
    'settings.theme.meta': 'Ative o modo escuro para uma interface com contraste reduzido e fundo escuro.',
    'settings.theme.enable': 'Ativar modo escuro',
    'settings.theme.disable': 'Desativar modo escuro',
    'settings.units.title': 'Unidades',
    'settings.units.meta': 'Altere entre kg e lb para pesos.',
    'common.kg': 'kg',
    'common.lb': 'lb',
    'settings.rest.title': 'Descanso padrão',
    'settings.rest.meta': 'Defina os segundos de descanso padrão usados no Timer.',
    'settings.rest.save': 'Salvar descanso padrão',
    'settings.language.title': 'Idioma',
    'settings.language.meta': 'Escolha o idioma do app. A detecção automática usa o idioma do dispositivo.',
    'settings.language.pt': 'Português',
    'settings.language.en': 'English',
    'schedule.title': 'Agenda semanal',
    'schedule.helper': 'Agrupe seus treinos por dia. Você pode adicionar rótulos simples (ex: "Perna") ou vincular um treino salvo.',
    'schedule.none': 'Nenhum treino para este dia.',
    'schedule.remove': 'Remover',
    'schedule.addWorkout': 'Adicionar treino',
    'schedule.linkSaved': 'Vincular treino salvo:',
    'schedule.createNew': 'Criar novo treino',
    'schedule.save': 'Salvar agenda',
    // Tabs and common
    'app.tabs.schedule': 'Agenda',
    'app.tabs.workout': 'Treino',
    'app.tabs.timer': 'Timer',
    'app.tabs.reports': 'Relatórios',
    'app.tabs.settings': 'Configurações',
    'common.save': 'Salvar',
    'common.edit': 'Editar',
    'common.delete': 'Excluir',
    'common.back': 'Voltar',
    'common.remove': 'Remover',
    'common.of': 'de',
    'ai.openGeneratedWorkout': 'Abrindo treino gerado pela IA',
    // Home
    'home.welcome': 'Bem-vindo ao GymCraft',
    'home.subtitle': 'Monte treinos, controle descansos e gere planos com IA.',
    'home.tipTitle': 'Dica do dia',
    'home.tipText': 'Priorize técnica sobre carga. Ajuste o descanso conforme seu objetivo.',
    'home.incTitle': 'Configurações de incremento',
    'home.incMeta': 'Ajuste o passo dos botões +/- na sessão.',
    'home.incKg': 'Incremento (kg)',
    'home.incLb': 'Incremento (lb)',
    // Workout Builder
    'wb.buildTitle': 'Montar treino',
    'wb.unit.kg': 'kg',
    'wb.unit.lb': 'lb',
    'wb.workoutName': 'Nome do treino',
    'wb.workoutName.ph': 'Perna, Peito e Tríceps...',
    'wb.exercise': 'Exercício',
    'wb.exercise.ph': 'Supino reto, Agachamento...',
    'wb.series': 'Séries',
    'wb.reps': 'Reps',
    'wb.restSec': 'Descanso (s)',
    'wb.weight': 'Peso',
    'wb.addExercise': 'Adicionar exercício',
    'wb.aiBuild': 'Montar treinos com IA',
    'wb.yourWorkout': 'Seu treino',
    'wb.empty': 'Nenhum exercício adicionado ainda.',
    'wb.update': 'Atualizar treino',
    'wb.saveLocal': 'Salvar treino (local)',
    'wb.exitEdit': 'Sair da edição',
    'wb.newWorkout': 'Novo treino',
    'wb.savedTitle': 'Treinos salvos',
    'wb.savedEmpty': 'Nenhum treino salvo ainda.',
    'wb.exercisesCount': 'exercícios',
    // Workout shared tokens
    'workout.series': 'séries',
    'workout.reps': 'reps',
    'workout.rest': 'descanso',
    'workout.secondsSuffix': 's',
    // Workout Detail
    'wd.noneSelected': 'Nenhum treino selecionado',
    'wd.exitEdit': 'Sair da edição',
    'wd.editWorkout': 'Editar treino',
    'wd.edit.series': 'Séries',
    'wd.edit.reps': 'Reps',
    'wd.edit.restSec': 'Descanso (s)',
    'wd.edit.weightPerSet': 'Peso por série',
    'wd.set': 'Série',
    'wd.index': '#',
    'wd.skipRest': 'Pular descanso',
    'wd.finishSetAndRest': 'Concluir série e descansar',
    'wd.endWorkout': 'Encerrar treino',
    'wd.saveChanges': 'Salvar alterações',
    'wd.startWorkout': 'Iniciar treino',
    'wd.noExercises': 'Nenhum exercício no treino',
    'wd.session.now': 'Agora',
    'wd.session.currentWeight': 'Peso atual',
    'wd.session.currentPR': 'PR atual',
    'wd.session.newPR': 'Novo PR!',
    // AI Planner
    'ai.title': 'Treino via IA',
    'ai.helper': 'Selecione preferências e gere um plano para a semana inteira ou apenas nos dias escolhidos.',
    'ai.backToWorkout': 'Voltar para Treino',
    'ai.goal': 'Objetivo',
    'ai.goal.estetica': 'Estética',
    'ai.goal.forca': 'Força',
    'ai.days': 'Dias de treino (deixe vazio para semana inteira)',
    'ai.timeAvailable': 'Tempo disponível (minutos)',
    'ai.timeAvailable.ph': 'ex: 45',
    'ai.minExercises': 'Mínimo de exercícios por treino',
    'ai.minExercises.ph': 'ex: 5',
    'ai.equipment': 'Equipamentos disponíveis',
    'ai.issues': 'Dores / restrições',
    'ai.focus': 'Foco muscular',
    'ai.generateAI': 'Gerar treino com IA',
    'ai.generateDemo': 'Gerar treino (demo offline)',
    'ai.savePlan': 'Salvar plano em Treinos e Agenda',
    'ai.planGenerated': 'Plano gerado',
    'ai.openFirst': 'Abrir primeiro treino',
    'ai.saveSuccess.title': 'Plano salvo',
    'ai.saveSuccess.msg': '{count} treinos criados e vinculados na Agenda.',
    'ai.saveInfo': 'Plano salvo: {count} treinos criados e vinculados na Agenda.',
    'ai.saveFail': 'Falha ao salvar plano. Tente novamente.',
    // Muscles display
    'muscle.Peito': 'Peito',
    'muscle.Costas': 'Costas',
    'muscle.Pernas': 'Pernas',
    'muscle.Ombros': 'Ombros',
    'muscle.Braços': 'Braços',
    'muscle.Core': 'Core',
    // Report
    'report.title.weekly': 'Relatório semanal',
    'report.period': 'Período',
    'report.isoWeek': 'Semana ISO',
    'report.prevWeek': 'Semana anterior',
    'report.backToCurrent': 'Voltar ao atual',
    'report.nextWeek': 'Próxima semana',
    'report.mode.week': 'Semanal',
    'report.mode.month': 'Mensal',
    'report.jumpWeek.go': 'Ir para semana',
    'report.jumpMonth.go': 'Ir para mês',
    'report.summary.sets': 'Sets',
    'report.summary.reps': 'Reps',
    'report.summary.volume': 'Volume',
    'report.copy': 'Copiar resumo',
    'report.downloadJson': 'Baixar JSON',
    'report.downloadCsv': 'Baixar CSV',
    'report.print': 'Imprimir/PDF',
    'report.share': 'Compartilhar',
    'report.empty': 'Sem sessões registradas nesta semana.',
    'report.alert.reportCopied': 'Relatório copiado para a área de transferência',
    'report.alert.summaryCopied': 'Resumo copiado para a área de transferência',
    'report.csv.headerDate': 'Data',
    'report.csv.headerSets': 'Sets',
    'report.csv.headerReps': 'Reps',
    'report.csv.headerVolume': 'Volume',
    'report.fileNamePrefix': 'relatorio',
    'report.day.sets': 'Sets',
    'report.day.reps': 'Reps',
    'report.day.volume': 'Volume',
    'report.exerciseLine': 'sets',
    // Timer
    'timer.mode.rest': 'Descanso',
    'timer.mode.stopwatch': 'Cronômetro',
    'timer.restLabel': 'Tempo de descanso (segundos)',
    'timer.start': 'Iniciar',
    'timer.pause': 'Pausar',
    'timer.reset': 'Resetar',
    // Days mapping (display only)
    'day.Segunda': 'Segunda',
    'day.Terça': 'Terça',
    'day.Quarta': 'Quarta',
    'day.Quinta': 'Quinta',
    'day.Sexta': 'Sexta',
    'day.Sábado': 'Sábado',
    'day.Domingo': 'Domingo',
  },
  en: {
    'app.subtitle': 'Modern, simple and smart workouts',
    'settings.title': 'Settings',
    'settings.theme.title': 'Theme',
    'settings.theme.meta': 'Enable dark mode for a low-contrast dark background.',
    'settings.theme.enable': 'Enable dark mode',
    'settings.theme.disable': 'Disable dark mode',
    'settings.units.title': 'Units',
    'settings.units.meta': 'Switch between kg and lb for weights.',
    'common.kg': 'kg',
    'common.lb': 'lb',
    'settings.rest.title': 'Default Rest',
    'settings.rest.meta': 'Set the default rest seconds used in the Timer.',
    'settings.rest.save': 'Save default rest',
    'settings.language.title': 'Language',
    'settings.language.meta': 'Choose the app language. Auto detection uses your device language.',
    'settings.language.pt': 'Portuguese',
    'settings.language.en': 'English',
    'schedule.title': 'Weekly schedule',
    'schedule.helper': 'Group your workouts by day. You can add simple labels (e.g. "Legs") or link a saved workout.',
    'schedule.none': 'No workouts for this day.',
    'schedule.remove': 'Remove',
    'schedule.addWorkout': 'Add workout',
    'schedule.linkSaved': 'Link saved workout:',
    'schedule.createNew': 'Create new workout',
    'schedule.save': 'Save schedule',
    // Tabs and common
    'app.tabs.schedule': 'Schedule',
    'app.tabs.workout': 'Workout',
    'app.tabs.timer': 'Timer',
    'app.tabs.reports': 'Reports',
    'app.tabs.settings': 'Settings',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.back': 'Back',
    'common.remove': 'Remove',
    'common.of': 'of',
    'ai.openGeneratedWorkout': 'Opening AI-generated workout',
    // Home
    'home.welcome': 'Welcome to GymCraft',
    'home.subtitle': 'Build workouts, manage rest and generate AI plans.',
    'home.tipTitle': 'Tip of the day',
    'home.tipText': 'Prioritize technique over load. Adjust rest to your goal.',
    'home.incTitle': 'Increment settings',
    'home.incMeta': 'Adjust +/- button step during sessions.',
    'home.incKg': 'Increment (kg)',
    'home.incLb': 'Increment (lb)',
    // Workout Builder
    'wb.buildTitle': 'Build workout',
    'wb.unit.kg': 'kg',
    'wb.unit.lb': 'lb',
    'wb.workoutName': 'Workout name',
    'wb.workoutName.ph': 'Legs, Chest & Triceps...',
    'wb.exercise': 'Exercise',
    'wb.exercise.ph': 'Bench press, Squat...',
    'wb.series': 'Sets',
    'wb.reps': 'Reps',
    'wb.restSec': 'Rest (s)',
    'wb.weight': 'Weight',
    'wb.addExercise': 'Add exercise',
    'wb.aiBuild': 'Build workouts with AI',
    'wb.yourWorkout': 'Your workout',
    'wb.empty': 'No exercises added yet.',
    'wb.update': 'Update workout',
    'wb.saveLocal': 'Save workout (local)',
    'wb.exitEdit': 'Exit edit mode',
    'wb.newWorkout': 'New workout',
    'wb.savedTitle': 'Saved workouts',
    'wb.savedEmpty': 'No saved workouts yet.',
    'wb.exercisesCount': 'exercises',
    // Workout shared tokens
    'workout.series': 'sets',
    'workout.reps': 'reps',
    'workout.rest': 'rest',
    'workout.secondsSuffix': 's',
    // Workout Detail
    'wd.noneSelected': 'No workout selected',
    'wd.exitEdit': 'Exit edit mode',
    'wd.editWorkout': 'Edit workout',
    'wd.edit.series': 'Sets',
    'wd.edit.reps': 'Reps',
    'wd.edit.restSec': 'Rest (s)',
    'wd.edit.weightPerSet': 'Weight per set',
    'wd.set': 'Set',
    'wd.index': '#',
    'wd.skipRest': 'Skip rest',
    'wd.finishSetAndRest': 'Finish set and rest',
    'wd.endWorkout': 'End workout',
    'wd.saveChanges': 'Save changes',
    'wd.startWorkout': 'Start workout',
    'wd.noExercises': 'No exercises in workout',
    'wd.session.now': 'Now',
    'wd.session.currentWeight': 'Current weight',
    'wd.session.currentPR': 'Current PR',
    'wd.session.newPR': 'New PR!',
    // AI Planner
    'ai.title': 'AI Planner',
    'ai.helper': 'Select preferences and generate a plan for the whole week or only chosen days.',
    'ai.backToWorkout': 'Back to Workout',
    'ai.goal': 'Goal',
    'ai.goal.estetica': 'Aesthetics',
    'ai.goal.forca': 'Strength',
    'ai.days': 'Training days (leave empty for the whole week)',
    'ai.timeAvailable': 'Time available (minutes)',
    'ai.timeAvailable.ph': 'e.g. 45',
    'ai.minExercises': 'Minimum exercises per workout',
    'ai.minExercises.ph': 'e.g. 5',
    'ai.equipment': 'Available equipment',
    'ai.issues': 'Injuries / restrictions',
    'ai.focus': 'Muscle focus',
    'ai.generateAI': 'Generate workout with AI',
    'ai.generateDemo': 'Generate workout (offline demo)',
    'ai.savePlan': 'Save plan to Workouts and Schedule',
    'ai.planGenerated': 'Generated plan',
    'ai.openFirst': 'Open first workout',
    'ai.saveSuccess.title': 'Plan saved',
    'ai.saveSuccess.msg': '{count} workouts created and linked to Schedule.',
    'ai.saveInfo': 'Plan saved: {count} workouts created and linked to Schedule.',
    'ai.saveFail': 'Failed to save plan. Try again.',
    // Muscles display
    'muscle.Peito': 'Chest',
    'muscle.Costas': 'Back',
    'muscle.Pernas': 'Legs',
    'muscle.Ombros': 'Shoulders',
    'muscle.Braços': 'Arms',
    'muscle.Core': 'Core',
    // Report
    'report.title.weekly': 'Weekly report',
    'report.period': 'Period',
    'report.isoWeek': 'ISO week',
    'report.prevWeek': 'Previous week',
    'report.backToCurrent': 'Back to current',
    'report.nextWeek': 'Next week',
    'report.mode.week': 'Weekly',
    'report.mode.month': 'Monthly',
    'report.jumpWeek.go': 'Go to week',
    'report.jumpMonth.go': 'Go to month',
    'report.summary.sets': 'Sets',
    'report.summary.reps': 'Reps',
    'report.summary.volume': 'Volume',
    'report.copy': 'Copy summary',
    'report.downloadJson': 'Download JSON',
    'report.downloadCsv': 'Download CSV',
    'report.print': 'Print/PDF',
    'report.share': 'Share',
    'report.empty': 'No sessions recorded this week.',
    'report.alert.reportCopied': 'Report copied to clipboard',
    'report.alert.summaryCopied': 'Summary copied to clipboard',
    'report.csv.headerDate': 'Date',
    'report.csv.headerSets': 'Sets',
    'report.csv.headerReps': 'Reps',
    'report.csv.headerVolume': 'Volume',
    'report.fileNamePrefix': 'report',
    'report.day.sets': 'Sets',
    'report.day.reps': 'Reps',
    'report.day.volume': 'Volume',
    'report.exerciseLine': 'sets',
    // Timer
    'timer.mode.rest': 'Rest',
    'timer.mode.stopwatch': 'Stopwatch',
    'timer.restLabel': 'Rest time (seconds)',
    'timer.start': 'Start',
    'timer.pause': 'Pause',
    'timer.reset': 'Reset',
    'day.Segunda': 'Monday',
    'day.Terça': 'Tuesday',
    'day.Quarta': 'Wednesday',
    'day.Quinta': 'Thursday',
    'day.Sexta': 'Friday',
    'day.Sábado': 'Saturday',
    'day.Domingo': 'Sunday',
  },
};

function detectLanguage() {
  // Try stored language first (handled in provider). Fallback detection:
  if (Platform.OS === 'web') {
    const navLang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'pt-BR';
    return navLang.toLowerCase().startsWith('pt') ? 'pt' : 'en';
  }
  try {
    const intlLocale = Intl?.DateTimeFormat?.().resolvedOptions?.().locale || 'pt-BR';
    return String(intlLocale).toLowerCase().startsWith('pt') ? 'pt' : 'en';
  } catch (e) {
    return 'pt';
  }
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('pt');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await getLanguageName();
      const initial = stored || detectLanguage();
      setLangState(initial);
      setReady(true);
    })();
  }, []);

  const setLang = async (next) => {
    const safe = next === 'en' ? 'en' : 'pt';
    await setLanguageName(safe);
    setLangState(safe);
  };

  const t = useMemo(() => {
    const dict = translations[lang] || translations.pt;
    return (key) => {
      const val = dict[key];
      if (typeof val === 'string') return val;
      // fallback to pt then key
      const fallback = translations.pt[key];
      return typeof fallback === 'string' ? fallback : key;
    };
  }, [lang]);

  const value = { lang, setLang, t };

  if (!ready) return children; // render children once ready to avoid flicker
  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}