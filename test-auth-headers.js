/**
 * Тестирование различных вариантов передачи токена
 */

const TOCHKA_BASE_URL = 'https://enter.tochka.com';
const TOCHKA_CLIENT_ID = '8161e24317f44aa387b813c8673a5014';
const TOCHKA_CLIENT_SECRET = 'abe1861057a5461bb80115bfe3b0d8a9';

async function testAuthHeaders() {
  console.log('🔍 Тестирование различных способов передачи токена...\n');

  // Получаем токен
  console.log('1️⃣ Получение OAuth токена...');
  const tokenUrl = `${TOCHKA_BASE_URL}/connect/token`;

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: TOCHKA_CLIENT_ID,
    client_secret: TOCHKA_CLIENT_SECRET,
  });

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!tokenResponse.ok) {
    console.error('❌ Не удалось получить токен');
    return;
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  console.log(`✅ OAuth токен получен\n`);
  console.log(`Token: ${accessToken}\n`);

  // Попробуем /uapi/ путь с разными заголовками
  const testUrl = `${TOCHKA_BASE_URL}/uapi/open_banking/v1/customers`;

  const headerVariants = [
    {
      name: 'Standard Bearer',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    },
    {
      name: 'x-access-token',
      headers: {
        'x-access-token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    },
    {
      name: 'X-Auth-Token',
      headers: {
        'X-Auth-Token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    },
    {
      name: 'Access-Token',
      headers: {
        'Access-Token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    },
    {
      name: 'Bearer + Client-Id',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': TOCHKA_CLIENT_ID,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    },
  ];

  console.log(`2️⃣ Тестирование различных заголовков для: ${testUrl}\n`);

  for (const variant of headerVariants) {
    console.log(`Пробуем: ${variant.name}`);
    console.log(`   Заголовки:`, Object.keys(variant.headers).join(', '));

    try {
      const response = await fetch(testUrl, {
        headers: variant.headers,
      });

      console.log(`   Статус: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('   ✅✅✅ УСПЕХ! Работает! ✅✅✅');
        console.log('   Ответ:');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
        console.log(`🎯 Правильный метод авторизации: ${variant.name}`);
        return;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`   ❌ Исключение: ${error.message}`);
    }

    console.log('');
  }

  console.log('❌ Ни один из вариантов не подошел');
}

testAuthHeaders().catch(console.error);
