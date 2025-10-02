# 💪 GymCraft — App de Treinos Moderno, Simples e Inteligente

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Cross-Platform](https://img.shields.io/badge/Cross_Platform-Web%2FiOS%2FAndroid-00D8FF?style=for-the-badge)

##  

Um aplicativo moderno de treinos desenvolvido com **Expo/React Native** com suporte completo para **Web, iOS e Android**. Focado em oferecer uma experiência de usuário fluida com animações sutis, interface intuitiva e planejamento inteligente de treinos.

## 🎯 Objetivo do Projeto

Criar uma solução completa de fitness que combine:

- **🎨 Design Moderno:** Interface limpa com animações fluidas
- **🤖 Inteligência Artificial:** Planejamento personalizado de treinos
- **⏱️ Funcionalidades Práticas:** Timer integrado e acompanhamento de progresso
- **📱 Multiplataforma:** Experiência consistente em todas as plataformas
- **🌙 Acessibilidade:** Suporte a tema claro e escuro

## ✨ Funcionalidades Principais

### 🗓️ **Gestão Completa de Treinos**
- **Agenda Inteligente:** Planejamento semanal de exercícios
- **Construtor de Treinos:** Criação personalizada de rotinas
- **Detalhes Detalhados:** Visualização completa de cada treino
- **Progresso Visual:** Acompanhamento de evolução

### 🤖 **Assistente de IA Integrado**
- **Planejamento Personalizado:** Sugestões inteligentes de treinos
- **Adaptação Automática:** Ajustes baseados no seu progresso
- **Tela Dedicada:** `IAPlanner` acessível diretamente da aba de Treino
- **Recomendações Contextuais:** Exercícios baseados em seus objetivos

### ⏱️ **Timer Profissional**
- **Cronômetro Integrado:** Controle preciso de tempo por exercício
- **Intervalos Programáveis:** Descanso entre séries automatizado
- **Alertas Visuais:** Notificações durante os treinos
- **Histórico de Tempos:** Métricas de performance

### 📊 **Relatórios e Análises**
- **Estatísticas Detalhadas:** Progresso ao longo do tempo
- **Métricas de Performance:** Evolução de cargas e repetições
- **Visualizações Gráficas:** Dados apresentados de forma clara
- **Exportação de Dados:** Compartilhamento de resultados

### ⚙️ **Personalização Total**
- **Temas Dinâmicos:** Claro e escuro com persistência
- **Configurações Flexíveis:** Ajustes de preferências
- **Interface Adaptativa:** Layout que se ajusta ao dispositivo

## 🛠️ Stack Tecnológica

### **Framework Principal**
- **Expo SDK:** Desenvolvimento multiplataforma
- **React Native:** Base para iOS, Android e Web
- **React Native Web:** Suporte completo para navegadores

### **Experiência do Usuário**
- **Expo Blur:** Efeitos de blur no header e tab bar
- **Animated API:** Animações nativas de alta performance
- **Vector Icons:** Ícones consistentes em todas as plataformas
- **React Native SVG:** Gráficos e elementos vetoriais

### **Arquitetura e Estado**
- **Sistema de Temas:** Gerenciamento dinâmico de aparência
- **Persistência Local:** Armazenamento de preferências
- **Navegação por Abas:** Experiência intuitiva entre seções

## 🚀 Implementação Rápida

### ⚡ **Pré-requisitos**
- Node.js 18+
- npm 9+ ou Yarn/Pnpm
- Expo CLI (opcional)

### 🛠️ **Configuração em 3 Passos**

1. **Clone o Repositório:**
```bash
git clone https://github.com/cantalusto/gym-craft-app.git
cd gym-craft-app
```

2. **Instalação de Dependências:**
```bash
npm install
```

3. **Execução do Projeto:**
```bash
# Desenvolvimento Web
npm run web

# Ou alternativamente
npx expo start --web --port 8083

# Desenvolvimento Mobile
npx expo start
```

4. **Acesso:**
- **Web:** `http://localhost:8083`
- **Mobile:** Escaneie o QR code com Expo Go

## 🎨 Experiência do Usuário

### **Animações e Transições**
- **Header Dinâmico:** Fade e parallax suave ao rolar
- **Transições entre Abas:** Efeitos fluidos de navegação
- **Feedback Tátil:** Animações de escala nos botões
- **Performance Otimizada:** `useNativeDriver` para animações suaves

### **Design System**
- **Ícones Consistente:** Ionicons e Material Community Icons
- **Branding Visual:** Logo vetorial adaptável
- **Layout Responsivo:** Adaptação automática a diferentes telas
- **Acessibilidade:** Foco em experiência inclusiva

## 🏗️ Arquitetura do Projeto

```
gym-craft-app/
├── App.js                 # Componente principal e animações
├── src/
│   ├── screens/          # Telas da aplicação
│   │   ├── Home.js
│   │   ├── Schedule.js
│   │   ├── WorkoutBuilder.js
│   │   ├── AIPlanner.js
│   │   ├── Report.js
│   │   ├── Settings.js
│   │   └── WorkoutDetail.js
│   ├── components/       # Componentes reutilizáveis
│   │   └── Timer.js
│   ├── theme/           # Sistema de temas
│   │   ├── theme.js
│   │   └── colors.js
│   └── storage/         # Persistência de dados
│       └── store.js
├── assets/              # Recursos estáticos
└── package.json         # Dependências e scripts
```

## 🔧 Solução de Problemas Comuns

### **Web com React Native SVG**
- **Problema:** Erros de bundling no ambiente web
- **Solução:** Fallback para `Image` com SVG remoto
- **Implementação:** Renderização condicional por plataforma

### **Performance e Compatibilidade**
- **Otimizações:** Animações nativas com `useNativeDriver`
- **Compatibilidade:** Testes cross-platform contínuos
- **Bundling:** Configuração específica para cada ambiente

## 📱 Navegação e Fluxo

### **Abas Principais**
1. **🏠 Agenda:** Planejamento semanal e cronograma
2. **💪 Treino:** Construtor e executor de treinos
3. **⏱️ Timer:** Controle de tempo e intervalos
4. **📊 Relatórios:** Análise de progresso e estatísticas
5. **⚙️ Configurações:** Personalização do app

### **Fluxo de Treino**
1. Planejamento na **Agenda**
2. Construção/edição no **Construtor de Treinos**
3. Execução com **Timer integrado**
4. Análise nos **Relatórios**
5. Ajustes via **IA Planner**

## 🎯 Próximas Evoluções

### **Melhorias de UX/UI**
- [ ] Animações específicas por tela
- [ ] Estados de foco e acessibilidade web
- [ ] Componentes de loading skeleton

### **Funcionalidades Avançadas**
- [ ] Sincronização com wearables
- [ ] Comunidade e compartilhamento
- [ ] Planos de treino pré-definidos

### **Qualidade e Testes**
- [ ] Testes E2E com Playwright/Detox
- [ ] Monitoramento de performance
- [ ] Analytics de uso

## 👨‍💻 Autor

**Lucas Cantarelli Lustosa**

[![GitHub](https://img.shields.io/badge/GitHub-GymCraft_App-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/cantalusto/gym-craft-app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Lucas_Cantarelli-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/lucas-cantarelli-lustosa-aab5492ba/)

---

**💪 Transforme seus treinos com tecnologia inteligente!**