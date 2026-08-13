# CLAUDE.md — Unit Calc Pro

> Независимый PWA калькулятор, построенный по паттернам Athlete Pro (Senior Engineering Ecosystem).

## Multi-Agent Protocol
- **Изоляция**: Разработка ведется мультиагентно в изолированных worktrees.
- **Handoff**: Файл `NEXT_SESSION.md` в корне является единой точкой синхронизации памяти агентов между сессиями.
- **Гейты (Gate)**: Не верим словам, только выводу скриптов. Любое изменение бизнес-логики обязано проходить через `npm test`.

## Architecture & Code Style
- **Store/View separation**:
  - `*.store.js` — State и бизнес-логика (ноль обращений к DOM, только вычисления юнит-экономики).
  - `*.view.js` — DOM, события, графики (Chart.js), привязка Store через `subscribe()`.
- **Security (CSP & Anti-XSS)**:
  - Никаких raw `innerHTML`. Используется функция `html` (tagged template literal) из `shared/utils.js`.
  - В `index.html` прописан жесткий `Content-Security-Policy`.
- **Design System**:
  - Стиль "Air Minimalism".
  - Все цвета и шрифты берутся ТОЛЬКО из `css/tokens.css` (через переменные `var(--...)`). Использование hex-цветов в JS запрещено.

## Tests & Build
- Юнит-тесты: запускать `npm test` для проверки математики (распределение прибыли 50/50, НДС 13%).
- Service Worker: список ассетов генерируется через `npm run build:sw`. Запрещено руками редактировать массив ASSETS в `sw.js`.
