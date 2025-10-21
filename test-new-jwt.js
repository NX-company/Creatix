/**
 * Тест с новым JWT токеном
 */

const TOCHKA_BASE_URL = 'https://enter.tochka.com';
const TOCHKA_JWT_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI5ZDgyMDFmZjc4OTdlMDM2YzBiMzBhNWY4OTc0NGE4OSIsInN1YiI6IjZhMjYxNTYwLTQ2NmQtNDc0YS1iYjRiLWMyODU4YjM5YTAzMyIsImN1c3RvbWVyX2NvZGUiOiIzMDUyMDg5ODcifQ.Dxt-Y9H87nQDI1a7q2vmzeT1PD3EIcAUPyChin3pBFoOCEOBZnb6_970gyHhhyQofh0Xmkuhj6_Ameh03kufKPNOerrPpHzwW4vaSLjrOXJn_4oaNqZdDd5a9lFX9PjtSn23EqLvN-DZzC2XKYeVg2k7i-aQfaMx2I0EmUzUKw6ZEwHMEk63wN89nGAh_gW4DmOQHJBVwofDbFoPCaH0T8DimD1sdpSc3C2qiMH5XYcZQUHeuiAVarNxnswDIOodZXM0ISKvudGwjfX6GGkRAmmLDWgrvpLxMsYQGk3wuJ6YI3TZUotfqkAv8eADjEHXATFGdwYS6-aPqGQiP3vaFZ2SeTvegOEerleIPSJV-FBlp2k3cnzbqxl-73E3rCOcb3Vxa5dZMMyymAZWEf-mKHdTWoiOSXdZE0Mfis7h2u_kc0r5SlPdUez5_bH8ElOIiG-hXdU-jKeVcr9OXqvGPuwtRC-oGCq1-A5eDJzamIscDsFm7z6j0xNqit3fOojr';
const TOCHKA_CUSTOMER_CODE = '305208987';

async function testNewJWT() {
  console.log('🔍 Тестирование с новым JWT токеном...\n');
  console.log(`Token: ${TOCHKA_JWT_TOKEN.substring(0, 50)}...\n`);

  const tests = [
    {
      name: 'Customers List',
      url: '/uapi/open_banking/v1/customers',
      method: 'GET'
    },
    {
      name: 'Retailers Status',
      url: '/uapi/acquiring/v1/retailers',
      method: 'GET'
    },
    {
      name: 'Create Payment Link',
      url: '/uapi/acquiring/v1/payments',
      method: 'POST',
      body: {
        amount: 10,
        customerCode: TOCHKA_CUSTOMER_CODE,
        purpose: 'Тестовый платёж Creatix',
        paymentMode: ['card', 'sbp', 'tinkoff'],
        redirectUrl: 'https://aicreatix.ru/payment-success?type=test',
        failRedirectUrl: 'https://aicreatix.ru/payment-failure?type=test',
        consumerId: 'test-user-jwt',
        ttl: 60,
        saveCard: false,
      }
    },
  ];

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Тест: ${test.name}`);
    console.log(`${'='.repeat(60)}`);

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
      console.log(`\nСтатус: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('\n✅✅✅ УСПЕХ! API РАБОТАЕТ! ✅✅✅');
        console.log('\nОтвет от API:');
        console.log(JSON.stringify(data, null, 2));

        // Если это создание платежа, покажем ссылку
        if (test.name === 'Create Payment Link' && data.paymentUrl) {
          console.log('\n🔗 Платежная ссылка:');
          console.log(data.paymentUrl);
        }
      } else {
        const errorText = await response.text();
        console.log('\n❌ Ошибка:');
        console.log(errorText);
      }
    } catch (error) {
      console.log(`\n❌ Исключение: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Тестирование завершено!');
  console.log(`${'='.repeat(60)}\n`);
}

testNewJWT().catch(console.error);
