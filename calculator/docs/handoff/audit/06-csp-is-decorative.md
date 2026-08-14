# 06 — CSP декоративный: `unsafe-inline` + `unsafe-eval` в `default-src`

**Приоритет:** P1 · **Область:** Безопасность · **Оценка:** 2–3 ч

## Проблема

`CLAUDE.md` утверждает: «В `index.html` прописан жесткий Content-Security-Policy».
Фактически (`index.html:6`):

```
default-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com
  https://fonts.gstatic.com https://cdn.jsdelivr.net https://*.flightradar24.com
  https://*.flightaware.com;
style-src ...; font-src ...; img-src ...; script-src-attr 'unsafe-inline';
```

Директивы `script-src` нет вообще → скрипты наследуют `default-src`, а там есть
и `'unsafe-inline'`, и `'unsafe-eval'`. То есть политика **не блокирует именно тот класс
атак, ради которого её пишут**. Плюс `script-src-attr 'unsafe-inline'` отдельно
разрешает inline-обработчики в атрибутах.

Это не значит, что приложение дырявое: единственный источник недоверенных данных —
поля формы, и эскейпер `html` в `shared/utils.js` написан корректно (правильная
обработка `SafeHTML`, экранирование пяти символов). Проблема в том, что **защита
однослойная**: любая будущая ошибка в шаблоне сразу становится исполняемым XSS,
второго рубежа нет. А документация уверяет, что рубеж есть.

Дополнительно: `*.flightradar24.com` и `*.flightaware.com` в `default-src` — разрешение
на подключения, которых в коде нет (см. карточку 02).

## Что сделать

1. Задать `script-src 'self' https://cdn.jsdelivr.net;` — без `unsafe-*`.
2. Убрать `script-src-attr 'unsafe-inline'`; при поломке — найти inline-атрибуты
   в `index.html` и перевести на `addEventListener`.
3. Убрать `'unsafe-inline' 'unsafe-eval'` из `default-src`. Оставить `'unsafe-inline'`
   только в `style-src` (нужен для inline-стилей свайпа в `trips.view.js`), либо убрать
   и его, переведя `style="opacity:0"` / `transform` на CSS-классы и custom properties.
4. Добавить `connect-src 'self';` и `object-src 'none'; base-uri 'self';`
   Домены радаров вернуть тогда, когда появится реальная интеграция.
5. Привести формулировку в `CLAUDE.md` в соответствие с фактом.

## Критерий приёмки

DevTools → Console пуст при полном прогоне сценариев (все вкладки, модалки, свайп,
экспорт), при этом `script-src` не содержит `unsafe-*`.
