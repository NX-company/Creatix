/**
 * Тестовый скрипт для проверки подключения к API Точка Банка
 * Использует новую структуру API с универсальными endpoint'ами
 */

const TOCHKA_JWT_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI5ZDgyMDFmZjc4OTdlMDM2YzBiMzBhNWY4OTc0NGE4OSIsInN1YiI6IjZhMjYxNTYwLTQ2NmQtNDc0YS1iYjRiLWMyODU4YjM5YTAzMyIsImN1c3RvbWVyX2NvZGUiOiIzMDUyMDg5ODcifQ.Dxt-Y9H87nQDI1a7q2vmzeT1PD3EIcAUPyChin3pBFoOCEOBZnb6_970gyHhhyQofh0Xmkuhj6_Ameh03kufKPNOerrPpHzwW4vaSLjrOXJn_4oaNqZdDd5a9lFX9PjtSn23EqLvN-DZzC2XKYeVg2k7i-aQfaMx2I0EmUzUKw6ZEwHMEk63wN89nGAh_gW4DmOQHJBVwofDbFoPCaH0T8DimD1sdpSc3C2qiMH5XYcZQUHeuiAVarNxnswDIOodZXM0ISKvudGwjfX6GGkRAmmLDWgrvpLxMsYQGk3wuJ6YI3TZUotfqkAv8eADjEHXATFGdwYS6-aPqGQiP3vaFZ2SeTvegOEerleIPSJV-FBlp2k3cnzbqxl-73E3rCOcb3Vxa5dZMMyymAZWEf-mKHdTWoiOSXdZE0Mfis7h2u_kc0r5SlPdUez5_bH8ElOIiG-hXdU-jKeVcr9OXqvGPuwtRC-oGCq1-A5eDJzamIscDsFm7z6j0xNqit3fOojr';
const TOCHKA_BASE_URL = 'https://enter.tochka.com';
const TOCHKA_CUSTOMER_CODE = '305208987';
const API_VERSION = 'v1';

async function testTochkaAPI() {
  console.log('🔍 Проверка подключения к API Точка Банка...\n');

  // Тест 1: Получить список клиентов
  console.log('1️⃣ Получение списка клиентов...');
  try {
    const customersResponse = await fetch(
      `${TOCHKA_BASE_URL}/api/v2/open_banking/${API_VERSION}/customers`,
      {
        headers: {
          'Authorization': `Bearer ${TOCHKA_JWT_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    if (!customersResponse.ok) {
      const errorText = await customersResponse.text();
      throw new Error(`HTTP ${customersResponse.status}: ${errorText}`);
    }

    const customersData = await customersResponse.json();
    console.log('✅ Список клиентов получен:');
    console.log(JSON.stringify(customersData, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Ошибка получения клиентов:', error.message);
    console.log('');
  }

  // Тест 2: Проверить статус эквайринга
  console.log('2️⃣ Проверка статуса эквайринга...');
  try {
    const retailersResponse = await fetch(
      `${TOCHKA_BASE_URL}/api/v2/acquiring/${API_VERSION}/retailers`,
      {
        headers: {
          'Authorization': `Bearer ${TOCHKA_JWT_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    if (!retailersResponse.ok) {
      const errorText = await retailersResponse.text();
      throw new Error(`HTTP ${retailersResponse.status}: ${errorText}`);
    }

    const retailersData = await retailersResponse.json();
    console.log('✅ Статус эквайринга получен:');
    console.log(JSON.stringify(retailersData, null, 2));

    // Проверка статуса
    if (Array.isArray(retailersData)) {
      const activeRetailer = retailersData.find(r => r.status === 'REG' && r.isActive === true);
      if (activeRetailer) {
        console.log('✅ Эквайринг АКТИВЕН и готов к работе!');
      } else {
        console.log('⚠️  Эквайринг НЕ активен. Нужно подключить в интернет-банке.');
      }
    } else if (retailersData.status === 'REG' && retailersData.isActive === true) {
      console.log('✅ Эквайринг АКТИВЕН и готов к работе!');
    } else {
      console.log('⚠️  Эквайринг НЕ активен. Статус:', retailersData.status || 'неизвестно');
    }
    console.log('');
  } catch (error) {
    console.error('❌ Ошибка проверки эквайринга:', error.message);
    console.log('⚠️  Возможно, интернет-эквайринг еще не подключен.');
    console.log('   Подключите его в интернет-банке Точка → Торговый эквайринг');
    console.log('');
  }

  // Тест 3: Создать тестовую платёжную ссылку (10₽)
  console.log('3️⃣ Создание тестовой платёжной ссылки (10₽)...');
  try {
    const paymentPayload = {
      amount: 10,
      customerCode: TOCHKA_CUSTOMER_CODE,
      purpose: 'Тестовый платёж Creatix API v1',
      paymentMode: ['card', 'sbp', 'tinkoff'],
      redirectUrl: 'http://localhost:3000/payment-success?type=test',
      failRedirectUrl: 'http://localhost:3000/payment-failure?type=test',
      consumerId: 'test-user-123',
      ttl: 60, // 60 минут
      saveCard: false,
    };

    console.log('📤 Отправляем запрос с параметрами:');
    console.log(JSON.stringify(paymentPayload, null, 2));

    const paymentResponse = await fetch(
      `${TOCHKA_BASE_URL}/api/v2/acquiring/${API_VERSION}/payments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOCHKA_JWT_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(paymentPayload),
      }
    );

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      throw new Error(`HTTP ${paymentResponse.status}: ${errorText}`);
    }

    const paymentData = await paymentResponse.json();
    console.log('✅ Платёжная ссылка создана!');
    console.log(JSON.stringify(paymentData, null, 2));
    console.log('');
    console.log('🔗 Ссылка для оплаты:');
    console.log(paymentData.paymentUrl || paymentData.link || paymentData.url);
    console.log('');
    console.log('💡 Откройте эту ссылку в браузере и оплатите 10₽ для теста');
    console.log('   Доступные способы оплаты: карта, СБП, T-Pay');
    console.log('');
  } catch (error) {
    console.error('❌ Ошибка создания платежа:', error.message);
    console.log('⚠️  Убедитесь, что эквайринг подключен и активен');
    console.log('');
  }

  console.log('✅ Тестирование завершено!');
  console.log('');
  console.log('📋 Итоговая информация:');
  console.log(`   JWT Token: ${TOCHKA_JWT_TOKEN.substring(0, 50)}...`);
  console.log(`   Customer Code: ${TOCHKA_CUSTOMER_CODE}`);
  console.log(`   Base URL: ${TOCHKA_BASE_URL}`);
  console.log(`   API Version: ${API_VERSION}`);
  console.log('');
  console.log('📚 Доступные методы API:');
  console.log('   ✓ GET  /uapi/open_banking/v1/customers - список клиентов');
  console.log('   ✓ GET  /uapi/acquiring/v1/retailers - статус эквайринга');
  console.log('   ✓ POST /uapi/acquiring/v1/payments - создать платежную ссылку');
  console.log('   ✓ POST /uapi/acquiring/v1/payments/with_receipt - платеж с чеком');
  console.log('   ✓ GET  /uapi/acquiring/v1/payments - список платежей');
  console.log('   ✓ GET  /uapi/acquiring/v1/payments/{id} - информация о платеже');
  console.log('   ✓ POST /uapi/acquiring/v1/payments/{id}/refund - возврат');
  console.log('   ✓ POST /uapi/acquiring/v1/payments/{id}/capture - подтверждение');
  console.log('   ✓ GET  /uapi/sbp/v1/qr-code/legal-entity/{id} - список QR-кодов');
  console.log('   ✓ POST /uapi/sbp/v1/qr-code/merchant/{mid}/account/{aid} - создать QR-код');
}

// Запуск теста
testTochkaAPI().catch(console.error);
