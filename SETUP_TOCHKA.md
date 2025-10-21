# Инструкция по настройке Точка Банка для реальных платежей

## Предварительные требования

1. **Открытый счёт в Точка Банке** (ООО или ИП)
2. **Подключённый интернет-эквайринг** в настройках банка
3. Доступ к интернет-банку Точка

---

## Шаг 1: Подключение интернет-эквайринга

### 1.1. Зайдите в интернет-банк Точка
- https://tochka.com/

### 1.2. Подключите интернет-эквайринг
1. Перейдите в раздел **"Торговый эквайринг"** или **"Интернет-эквайринг"**
2. Нажмите **"Подключить"**
3. Заполните заявку:
   - Название магазина/сервиса: **Creatix**
   - URL сайта: **https://ваш-домен.ru** (или ngrok для теста)
   - Описание услуг: **Платформа для создания документов**
   - Средний чек: **300 рублей**
4. Подождите одобрения (обычно 1-2 рабочих дня)

### 1.3. Проверьте статус эквайринга
Статус должен быть: **REG** и **isActive: true**

---

## Шаг 2: Получение API credentials

### 2.1. Генерация JWT-токена

1. Зайдите в **"Интеграции и API"** → **"API PRO"** или **"Открытый API"**
2. Нажмите **"Сгенерировать JWT-ключ"**
3. Заполните форму:
   - **Название**: "Creatix Payment Integration"
   - **Разрешения**:
     - ✅ `acquiring` (работа с платежами)
     - ✅ `open_banking` (доступ к информации о счетах)
   - **Срок действия**: выберите подходящий (например, 1 год)
4. Подтвердите по SMS-коду
5. **ВАЖНО**: Скопируйте JWT-токен сразу (он показывается только один раз!)

### 2.2. Получение Client ID

- `client_id` показывается вместе с JWT-токеном
- Скопируйте его

**Пример:**
```
JWT Token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Client ID: 1234567890abcdef
```

---

## Шаг 3: Получение customerCode

### 3.1. Выполните запрос к API

**Windows (PowerShell):**
```powershell
$token = "ваш_jwt_token_здесь"
$headers = @{
    "Authorization" = "Bearer $token"
}
Invoke-RestMethod -Uri "https://enter.tochka.com/api/v2/open_banking/v1/customers" -Headers $headers
```

**Linux/Mac (curl):**
```bash
curl -X GET "https://enter.tochka.com/api/v2/open_banking/v1/customers" \
  -H "Authorization: Bearer ваш_jwt_token_здесь"
```

### 3.2. Найдите свой customerCode в ответе

**Пример ответа:**
```json
{
  "customers": [
    {
      "customerCode": "ABC123456789",  ← ВОТ ОН!
      "customerType": "Business",
      "name": "ООО ВАША КОМПАНИЯ",
      "inn": "1234567890",
      "kpp": "123456789",
      "accounts": [
        {
          "accountNumber": "40702810123456789012",
          "currency": "RUB",
          "balance": 50000.00
        }
      ]
    }
  ]
}
```

**ВАЖНО**: Берите `customerCode` именно с `customerType: "Business"`, а не "Individual"!

---

## Шаг 4: Обновление .env.local

Откройте файл `.env.local` и замените значения:

```env
# Tochka Bank Payment Configuration
NEXT_PUBLIC_PAYMENT_TEST_MODE=true  ← Оставьте true для тестовых сумм 10₽

# Tochka Bank API credentials
TOCHKA_API_URL=https://enter.tochka.com/api/v2
TOCHKA_JWT_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...  ← ВАШ JWT TOKEN
TOCHKA_CLIENT_ID=1234567890abcdef  ← ВАШ CLIENT ID
TOCHKA_CUSTOMER_CODE=ABC123456789  ← ВАШ CUSTOMER CODE

# Webhook secret (придумайте любую случайную строку)
TOCHKA_WEBHOOK_SECRET=super_secret_key_12345
```

---

## Шаг 5: Настройка Webhook для получения уведомлений

### 5.1. Проблема локальной разработки
Точка Банк не может отправить webhook на `http://localhost:3000`

### 5.2. Решения:

#### Вариант A: Использовать ngrok (для теста)

1. Установите ngrok: https://ngrok.com/download
2. Запустите туннель:
```bash
ngrok http 3000
```
3. Получите публичный URL (например, `https://abc123.ngrok.io`)
4. Обновите `.env.local`:
```env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```
5. Перезапустите сервер: `npm run dev`

#### Вариант B: Развернуть на тестовом сервере
- Vercel: `vercel deploy`
- Railway: `railway up`
- Другой VPS

### 5.3. Настроить webhook в Точка Банке

1. Зайдите в интернет-банк Точка
2. Найдите раздел **"Webhooks"** или **"Уведомления"** в настройках API
3. Добавьте webhook:
   - **URL**: `https://ваш-домен.ru/api/payments/webhook`
   - **События**:
     - ✅ `payment.success`
     - ✅ `payment.completed`
     - ✅ `payment.failed`
   - **Secret**: тот же, что в `TOCHKA_WEBHOOK_SECRET`

---

## Шаг 6: Проверка настройки

### 6.1. Проверьте статус эквайринга через API

Создайте тестовый скрипт:

```javascript
// test-tochka-setup.js
const fetch = require('node-fetch');

const TOCHKA_JWT_TOKEN = 'ваш_jwt_token';
const TOCHKA_API_URL = 'https://enter.tochka.com/api/v2';

async function checkRetailers() {
  const response = await fetch(
    `${TOCHKA_API_URL}/acquiring/v1/retailers`,
    {
      headers: {
        'Authorization': `Bearer ${TOCHKA_JWT_TOKEN}`,
      },
    }
  );

  const data = await response.json();
  console.log('Retailers status:', JSON.stringify(data, null, 2));

  // Проверка статуса
  if (data.status === 'REG' && data.isActive === true) {
    console.log('✅ Эквайринг активен и готов к работе!');
  } else {
    console.log('❌ Эквайринг не активен. Статус:', data.status);
  }
}

checkRetailers();
```

Запустите:
```bash
node test-tochka-setup.js
```

---

## Шаг 7: Тестовый платёж (10₽)

### 7.1. Запустите приложение
```bash
npm run dev
```

### 7.2. Откройте в браузере
http://localhost:3000 (или ваш ngrok URL)

### 7.3. Выполните тест
1. Войдите в аккаунт или зарегистрируйтесь
2. Нажмите **"Улучшить тариф"**
3. Выберите **ADVANCED (10₽)**
4. Согласитесь с условиями
5. Нажмите **"Купить ADVANCED за 10₽"**
6. Вас перенаправит на страницу оплаты Точка Банка
7. Введите данные тестовой карты:
   - **Номер**: `5555 5555 5555 4444` (для теста)
   - **Срок**: любая будущая дата (например, `12/25`)
   - **CVV**: `123`
8. Нажмите **"Оплатить"**
9. Вернётесь на страницу `/payment-success`

### 7.4. Проверьте результат

**A. В консоли сервера должны быть логи:**
```
🏦 Creating Tochka payment:
   amount: 10
   purpose: "Подписка Creatix ADVANCED"
✅ Payment link created: {...}
🔔 Webhook received from Tochka Bank
✅ Payment successful: payment_id_123
✅ User upgraded to ADVANCED
```

**B. В базе данных:**
- Проверьте, что `appMode` изменился на `ADVANCED`
- Проверьте, что создалась транзакция со статусом `COMPLETED`

**C. В интернет-банке Точка:**
- Зайдите в раздел **"Операции"** или **"История"**
- Должна быть операция на **+10₽** с назначением "Подписка Creatix ADVANCED"

---

## Шаг 8: Переключение на продакшен (реальные цены)

Когда всё протестировано, измените `.env.local`:

```env
NEXT_PUBLIC_PAYMENT_TEST_MODE=false
```

Цены станут реальными:
- ADVANCED: **1000₽**
- PRO: **2500₽**
- Бонусный пак: **300₽**

---

## Troubleshooting (Решение проблем)

### Ошибка: "Invalid JWT token"
- Проверьте, что токен скопирован полностью (он очень длинный)
- Проверьте, что токен не истёк
- Убедитесь, что разрешения `acquiring` и `open_banking` включены

### Ошибка: "Customer code not found"
- Убедитесь, что взяли `customerCode` с `customerType: "Business"`
- Проверьте, что аккаунт активен

### Webhook не приходит
- Проверьте, что ngrok запущен и URL актуален
- Проверьте, что webhook настроен в интернет-банке
- Посмотрите логи webhook в настройках Точка Банка

### Эквайринг не активен
- Дождитесь одобрения заявки (1-2 рабочих дня)
- Свяжитесь с поддержкой Точка Банка

---

## Контакты поддержки Точка Банка

- Телефон: 8 800 500-05-70
- Email: support@tochka.com
- Чат в интернет-банке

---

## Итоговый чеклист

- [ ] Счёт в Точка Банке открыт
- [ ] Интернет-эквайринг подключён и активен (статус REG, isActive: true)
- [ ] JWT-токен получен и скопирован
- [ ] Client ID получен
- [ ] customerCode получен через API
- [ ] .env.local заполнен корректными данными
- [ ] ngrok запущен (или приложение развёрнуто публично)
- [ ] Webhook настроен в Точка Банке
- [ ] Тестовый платёж 10₽ прошёл успешно
- [ ] Деньги поступили на счёт в Точка Банке
- [ ] Webhook обработан корректно
- [ ] Подписка активирована в базе данных

---

**Всё готово!** Теперь платежи будут реально поступать на ваш счёт в Точка Банке! 💰
