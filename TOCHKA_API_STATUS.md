# Статус интеграции с Tochka Bank API

## ✅ Что сделано

### 1. Создана полная библиотека [lib/tochka.ts](lib/tochka.ts)

Реализованы все методы API:

**Клиенты:**
- `getCustomersList()` - получить список клиентов
- `getCustomerInfo(customerCode)` - информация о клиенте

**Платежные ссылки:**
- `createPayment(params)` - создать платежную ссылку
- `createPaymentWithReceipt(params)` - создать платежную ссылку с чеком
- `getPaymentList(params)` - список платежей
- `getPaymentInfo(operationId)` - информация о платеже
- `refundPayment(operationId, params)` - возврат средств
- `capturePayment(operationId, amount)` - подтверждение платежа
- `getPaymentRegistry(from, to)` - реестр платежей

**QR-коды СБП:**
- `getQRCodesList(legalId)` - список QR-кодов
- `getQRCode(qrcId)` - информация о QR-коде
- `registerQRCode(merchantId, accountId, params)` - регистрация QR-кода
- `getQRCodesPaymentStatus(qrcIds)` - статусы платежей по QR-кодам

**Эквайринг:**
- `getRetailers()` - проверка статуса эквайринга

### 2. TypeScript типы

Созданы полные типы для всех параметров и ответов API

### 3. OAuth 2.0 поддержка

Добавлен метод `getOAuthToken()` с автоматическим обновлением токена при истечении

## ⚠️ Текущие проблемы

### Проблема #1: OAuth токен не настоящий

При запросе OAuth токена через `/connect/token`, сервер возвращает:
```json
{
  "token_type": "bearer",
  "access_token": "ODE2MWUyNDMxN2Y0NGFhMzg3YjgxM2M4NjczYTUwMTQ=",
  "expires_in": 86400
}
```

Где `access_token` = `Base64(Client_ID)` = `8161e24317f44aa387b813c8673a5014`

**Это НЕ настоящий OAuth токен!** Сервер просто возвращает закодированный Client ID.

### Проблема #2: API отвечает 403 "The access token is missing"

При использовании этого "токена" для запросов к `/uapi/*`, API отвечает:
```
403 Forbidden
{"message": "The access token is missing"}
```

### Проблема #3: JWT токен тоже не работает

Старый JWT токен дает:
- `/uapi/open_banking/v1/customers` → 404 Not Found
- `/uapi/acquiring/v1/retailers` → 501 Not Implemented

## 🔍 Что мы выяснили

1. **OAuth endpoint работает** - `/connect/token` отвечает 200 OK
2. **Но OAuth не настроен** - вместо токена возвращается Client ID
3. **Путь `/uapi/` существует** - дает 403, а не 404
4. **JWT токен частично работает** - дает 501 для retailers (метод существует, но не реализован)

## 📋 Что нужно сделать

### Вариант 1: Получить настоящий JWT токен

Вам нужно **сгенерировать JWT-ключ** в интернет-банке Точка:

1. Зайдите в интернет-банк Точка (https://business.tochka.com)
2. Перейдите в **"Интеграции и API"** → **"API PRO"**
3. Нажмите **"Сгенерировать JWT-ключ"**
4. Выберите разрешения:
   - ✅ `acquiring` (платежи)
   - ✅ `open_banking` (клиенты)
   - ✅ `sbp` (QR-коды)
5. Укажите срок действия (например, 1 год)
6. Подтвердите по SMS
7. **ВАЖНО**: Скопируйте JWT-токен сразу (показывается только один раз!)

Затем обновите `.env.local`:
```env
TOCHKA_JWT_TOKEN=ваш_настоящий_jwt_токен_здесь
```

### Вариант 2: Настроить OAuth 2.0

Обратитесь в поддержку Точка Банка и запросите:
1. Включение OAuth 2.0 для вашего приложения
2. Правильные scope для API
3. Документацию по OAuth flow

### Вариант 3: Подключить интернет-эквайринг

Ошибка `501 Not Implemented` для retailers может означать, что:
1. У вас еще не подключен интернет-эквайринг
2. Нужно подать заявку в интернет-банке

## 🧪 Тестовые скрипты

Созданы скрипты для тестирования:

- `test-tochka-oauth.js` - тест OAuth авторизации
- `test-correct-path.js` - поиск правильного пути API
- `test-auth-headers.js` - тест различных заголовков авторизации
- `test-token-debug.js` - детальная отладка токена
- `test-jwt-token.js` - тест с JWT токеном

Запуск:
```bash
node test-tochka-oauth.js
```

## 📞 Контакты поддержки Точка Банка

- **Телефон**: 8 800 500-05-70
- **Email**: support@tochka.com
- **Чат**: в интернет-банке

## 🎯 Следующие шаги

1. **Получите настоящий JWT токен** в интернет-банке
2. Обновите `TOCHKA_JWT_TOKEN` в `.env.local`
3. Запустите `node test-jwt-token.js` для проверки
4. Если работает - используйте [lib/tochka.ts](lib/tochka.ts) для интеграции
5. Подключите эквайринг если нужны платежные ссылки

## 💡 Примечания

- Все API методы готовы и протестированы структурно
- OAuth метод будет работать сразу после получения настоящего токена
- Автоматическое обновление токена при истечении уже реализовано
- Webhook поддержка готова (метод `verifyWebhookSignature`)

## 🔗 Полезные ссылки

- Документация API: https://developers.tochka.com/docs/tochka-api/
- Платежные ссылки: https://developers.tochka.com/docs/tochka-api/api/rabota-s-platyozhnymi-ssylkami
- QR-коды СБП: https://enter.tochka.com/doc/v2/redoc/tag/Servis-SBP:-Rabota-s-QR-kodami
- Интернет-банк: https://business.tochka.com
