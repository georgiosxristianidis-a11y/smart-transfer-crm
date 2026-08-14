# 08 — ESLint и eslint-plugin-security установлены, но не запускаются никогда

**Приоритет:** P1 · **Область:** Инженерные гейты · **Оценка:** 1 ч

## Проблема

`package.json` объявляет:

```json
"devDependencies": { "eslint": "^8.57.0", "eslint-plugin-security": "^3.0.0" }
```

При этом в проекте **нет конфига** (`.eslintrc*` / `eslint.config.js` отсутствуют)
и **нет скрипта** `lint`. Единственные скрипты — `test`, `dev`, `serve`, `build:sw`, `lhci`.
То есть линтер не выполнялся ни разу: это заявка на безопасность, а не безопасность.

`CLAUDE.md` формулирует принцип прямо: «Не верим словам, только выводу скриптов».
Здесь ровно тот случай, который принцип и должен ловить.

Симптомы, которые линтер поймал бы автоматически:
- мёртвый импорт `DB` в `fuel.store.js:1`
- неиспользуемая константа `SCOPE_PREFIX` в `sw.js:2`
- устаревший `String.prototype.substr` в `trips.store.js:31`
- мёртвый метод-обёртка `getStore` поверх `_getStore` в `db.js:82-84`

## Что сделать

1. Создать `eslint.config.js` (flat config, ESLint 8.57 его поддерживает) с
   `languageOptions: { ecmaVersion: 2022, sourceType: 'module' }`, отдельными
   `globals` для браузера (`js/`), Node (`scripts/`, `test/`) и Service Worker (`sw.js`).
2. Подключить `plugin:security/recommended` — ради него плагин и ставился.
3. Добавить скрипты:

```json
"lint": "eslint js scripts sw.js test",
"check": "npm run lint && npm test"
```

4. Прогнать, починить найденное, зафиксировать нулевой выхлоп.
5. Добавить `.lighthouseci/` и `lhr-*.html` в `.gitignore` — сгенерированный отчёт
   Lighthouse сейчас лежит в дереве и засоряет любой рекурсивный поиск
   (13 ложных срабатываний при поиске техдолга).

## Критерий приёмки

`npm run check` завершается с кодом 0 и без предупреждений на чистом дереве.
