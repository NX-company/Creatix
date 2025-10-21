/**
 * Тест с самым новым JWT токеном
 */

const TOCHKA_BASE_URL = 'https://enter.tochka.com';
const TOCHKA_JWT_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJmZWI1ZDAwZjQ1MzE1NTcwYzAxZWZkNDFkOTBkODg1OSIsInN1YiI6IjZhMjYxNTYwLTQ2NmQtNDc0YS1iYjRiLWMyODU4YjM5YTAzMyIsImN1c3RvbWVyX2NvZGUiOiIzMDUyMDg5ODcifQ.aonD-9faYvA8suPqD3ow-LJGNbcEbSJnkOtfKKmIG_ijiuhGaqfPieGvC8QDcL9VPbMeV4LmdB5WQVs2L9BU6UinHVc8vieLAAz4CKM5Tjlmp3u68gGUiyQvx6QKwVjf8p1C-Q9Y4uh66NVtJGHlpmjDkQ5BpXdFeVum0IWI09xVumWkq7mmoz8MP56hYDKHKv0QQ9PbLDLQgY7x_sxb5Pm8L4MhsLCv4IymXPOPQ2r8TCkkghaVHtxJNfsfS-II5PT6u_Ykeev8i2WjYB4Hc45qag1B4kk5zqSe1W1yx-XH0hw6Qr7yM_R6xhr1vImeHX46-bRti8SPdoljFgPbQdFYlQz4RcXKY-SPyNFlb5OTcmxidTalxVKM0TNBp2f3bDmL97d-iDSSwbn9Wj0qAZBOYtIICkghwecvysIBSj9s90EF7jb9lz6Sj_A5fyHx7RgfFfFanABxJqupzhivZY2jmMPbPUrGuzv3ZPR3eBNzVdKVu6aEZ8HQMfqMtZys';
const TOCHKA_CLIENT_ID = 'feb5d00f45315570c01efd41d90d8859';
const TOCHKA_CUSTOMER_CODE = '305208987';

async function testLatestJWT() {
  console.log('🔍 Тестирование с НОВЫМ JWT токеном...\n');
  console.log(`Client ID: ${TOCHKA_CLIENT_ID}`);
  console.log(`Token: ${TOCHKA_JWT_TOKEN.substring(0, 50)}...\n`);

  const tests = [
    {
      name: '1. Customers List',
      url: '/uapi/open_banking/v1/customers',
      method: 'GET'
    },
    {
      name: '2. Retailers Status (Эквайринг)',
      url: '/uapi/acquiring/v1/retailers',
      method: 'GET'
    },
    {
      name: '3. Create Payment Link (10₽)',
      url: '/uapi/acquiring/v1/payments',
      method: 'POST',
      body: {
        amount: 10,
        customerCode: TOCHKA_CUSTOMER_CODE,
        purpose: 'Тестовый платёж Creatix - проверка API',
        paymentMode: ['card', 'sbp', 'tinkoff'],
        redirectUrl: 'https://aicreatix.ru/payment-success?type=test',
        failRedirectUrl: 'https://aicreatix.ru/payment-failure?type=test',
        consumerId: 'test-user-new-jwt',
        ttl: 60,
        saveCard: false,
      }
    },
  ];

  for (const test of tests) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 ${test.name}`);
    console.log(`${'='.repeat(70)}`);

    const fullUrl = `${TOCHKA_BASE_URL}${test.url}`;
    console.log(`URL: ${fullUrl}`);
    console.log(`Method: ${test.method}`);

    const options = {
      method: test.method,
      headers: {
        'Authorization': `Bearer ${TOCHKA_JWT_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (test.body) {
      options.body = JSON.stringify(test.body);
      console.log('\nRequest Body:');
      console.log(JSON.stringify(test.body, null, 2));
    }

    try {
      const response = await fetch(fullUrl, options);
      console.log(`\n🔄 Статус: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('\n✅✅✅ УСПЕХ! API РАБОТАЕТ! ✅✅✅');
        console.log('\n📦 Ответ от API:');
        console.log(JSON.stringify(data, null, 2));

        // Если это создание платежа, покажем ссылку
        if (test.name.includes('Payment Link') && data.paymentUrl) {
          console.log('\n🔗🔗🔗 ПЛАТЕЖНАЯ ССЫЛКА:');
          console.log(data.paymentUrl);
          console.log('\n💡 Откройте эту ссылку в браузере для тестовой оплаты 10₽');
        }

        // Если это retailers, проверим статус
        if (test.name.includes('Retailers')) {
          if (Array.isArray(data)) {
            const active = data.find(r => r.status === 'REG' && r.isActive);
            if (active) {
              console.log('\n✅ Эквайринг АКТИВЕН и готов к работе!');
            } else {
              console.log('\n⚠️  Эквайринг не активен');
            }
          }
        }
      } else {
        const errorText = await response.text();
        console.log('\n❌ Ошибка:');
        console.log(errorText);

        if (response.status === 501) {
          console.log('\n💡 Код 501 означает, что метод не реализован.');
          console.log('   Возможные причины:');
          console.log('   - Эквайринг еще не подключен в интернет-банке');
          console.log('   - JWT-ключ не имеет прав на acquiring');
          console.log('   - Нужно создать новый JWT-ключ с правами acquiring');
        }
      }
    } catch (error) {
      console.log(`\n❌ Исключение: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log('✅ Тестирование завершено!');
  console.log(`${'='.repeat(70)}\n`);
}

testLatestJWT().catch(console.error);
