/**
 * Тестовый скрипт для проверки OAuth 2.0 авторизации Точка Банка
 */

const TOCHKA_BASE_URL = 'https://enter.tochka.com';
const TOCHKA_CLIENT_ID = '8161e24317f44aa387b813c8673a5014';
const TOCHKA_CLIENT_SECRET = 'abe1861057a5461bb80115bfe3b0d8a9';
const TOCHKA_CUSTOMER_CODE = '305208987';

async function testOAuth() {
  console.log('🔐 Тестирование OAuth 2.0 авторизации Точка Банка...\n');

  // Шаг 1: Получить access token
  console.log('1️⃣ Получение access token...');
  try {
    const tokenUrl = `${TOCHKA_BASE_URL}/connect/token`;

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: TOCHKA_CLIENT_ID,
      client_secret: TOCHKA_CLIENT_SECRET,
    });

    console.log(`   URL: ${tokenUrl}`);
    console.log(`   Client ID: ${TOCHKA_CLIENT_ID}`);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    console.log(`   Статус: ${tokenResponse.status} ${tokenResponse.statusText}`);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('   ❌ Ошибка:', errorText);
      throw new Error(`Failed to get token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('   ✅ Access token получен!');
    console.log(`   Token type: ${tokenData.token_type}`);
    console.log(`   Expires in: ${tokenData.expires_in} seconds`);
    console.log(`   Access token: ${tokenData.access_token.substring(0, 50)}...`);
    console.log('');

    const accessToken = tokenData.access_token;

    // Шаг 2: Протестировать API запросы с полученным токеном
    console.log('2️⃣ Проверка API с полученным токеном...\n');

    // Тест 2.1: Получить список клиентов
    console.log('   📋 Получение списка клиентов...');
    try {
      const customersUrl = `${TOCHKA_BASE_URL}/api/v2/open_banking/v1/customers`;
      console.log(`   URL: ${customersUrl}`);

      const customersResponse = await fetch(customersUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log(`   Статус: ${customersResponse.status} ${customersResponse.statusText}`);

      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        console.log('   ✅ Список клиентов получен:');
        console.log(JSON.stringify(customersData, null, 2));
      } else {
        const errorText = await customersResponse.text();
        console.log(`   ❌ Ошибка: ${errorText}`);
      }
    } catch (error) {
      console.error('   ❌ Исключение:', error.message);
    }
    console.log('');

    // Тест 2.2: Проверить статус эквайринга
    console.log('   🏪 Проверка статуса эквайринга...');
    try {
      const retailersUrl = `${TOCHKA_BASE_URL}/api/v2/acquiring/v1/retailers`;
      console.log(`   URL: ${retailersUrl}`);

      const retailersResponse = await fetch(retailersUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log(`   Статус: ${retailersResponse.status} ${retailersResponse.statusText}`);

      if (retailersResponse.ok) {
        const retailersData = await retailersResponse.json();
        console.log('   ✅ Статус эквайринга получен:');
        console.log(JSON.stringify(retailersData, null, 2));

        if (Array.isArray(retailersData)) {
          const activeRetailer = retailersData.find(r => r.status === 'REG' && r.isActive === true);
          if (activeRetailer) {
            console.log('   ✅ Эквайринг АКТИВЕН и готов к работе!');
          }
        }
      } else {
        const errorText = await retailersResponse.text();
        console.log(`   ❌ Ошибка: ${errorText}`);
      }
    } catch (error) {
      console.error('   ❌ Исключение:', error.message);
    }
    console.log('');

    // Тест 2.3: Создать тестовую платежную ссылку
    console.log('   💳 Создание тестовой платежной ссылки (10₽)...');
    try {
      const paymentsUrl = `${TOCHKA_BASE_URL}/api/v2/acquiring/v1/payments`;
      console.log(`   URL: ${paymentsUrl}`);

      const paymentPayload = {
        amount: 10,
        customerCode: TOCHKA_CUSTOMER_CODE,
        purpose: 'Тестовый платёж Creatix OAuth',
        paymentMode: ['card', 'sbp', 'tinkoff'],
        redirectUrl: 'https://aicreatix.ru/payment-success?type=test',
        failRedirectUrl: 'https://aicreatix.ru/payment-failure?type=test',
        consumerId: 'test-oauth-user',
        ttl: 60,
        saveCard: false,
      };

      console.log('   Параметры платежа:');
      console.log(JSON.stringify(paymentPayload, null, 2));

      const paymentResponse = await fetch(paymentsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(paymentPayload),
      });

      console.log(`   Статус: ${paymentResponse.status} ${paymentResponse.statusText}`);

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        console.log('   ✅ Платежная ссылка создана!');
        console.log(JSON.stringify(paymentData, null, 2));
        console.log('');
        console.log('   🔗 Ссылка для оплаты:');
        console.log(`   ${paymentData.paymentUrl || paymentData.link || paymentData.url}`);
      } else {
        const errorText = await paymentResponse.text();
        console.log(`   ❌ Ошибка: ${errorText}`);
      }
    } catch (error) {
      console.error('   ❌ Исключение:', error.message);
    }
    console.log('');

    console.log('✅ Тестирование завершено!');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
  }
}

testOAuth().catch(console.error);
