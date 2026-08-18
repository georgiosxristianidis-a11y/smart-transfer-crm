# Task Handoff: CSV / WhatsApp Batch Import & CRM Dispatch View

## Summary
Реализован интеллектуальный модуль парсинга и пакетного импорта трансферов (CSV, TSV, файлы, неструктурированные сообщения WhatsApp из суточных листов отелей на 15+ заказов) и расширен CRM-интерфейс диспетчеризации.

## Key Changes
- `calculator/js/shared/import.service.js`: Движок распознавания разделителей (`,` `;` `\t`), колонок RU/EN/GR, времени, сумм, телефонов, номеров комнат, рейсов (`FlightService`) и типов оплаты.
- `calculator/js/trips.store.js`: Расширена модель `Trip` (`phone`, `paymentStatus`, `pax`, `roomNumber`, `notes`), добавлены `importTripsBatch()` и `updateTripPaymentStatus()`, расширен `exportCSV()`.
- `calculator/js/trips.view.js`: Модалка импорта с живым предпросмотром таблицы, CRM-фильтры (Все, Активные, К оплате, Завершенные), поиск, 1-тап переключение статусов оплаты, кнопки WhatsApp и звонка.
- `calculator/index.html`: Разметка модалки `#modal-import-trips`, панель поиска/фильтров `#crm-toolbar`, кнопка `Импорт (CSV / WA)`.
- `calculator/css/tokens.css` & `style.css`: Цветовые токены для статусов оплаты (Emerald, Amber, Sky, Purple, Rose), дизайн модалки и превью-таблицы.
- `calculator/test/import.service.test.js` & `calculator/test/trips.store.test.js`: 100% покрытие unit-тестами.

## Gate & Verification
- `npm test`: 823/823 tests passing (0 failures).
- `npm run lint`: 0 errors.
- XSS: все пользовательские данные экранируются через SafeHTML `html` теги.
