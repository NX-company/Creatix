/**
 * Детальная отладка получения токена
 */

const TOCHKA_BASE_URL = 'https://enter.tochka.com';
const TOCHKA_CLIENT_ID = '8161e24317f44aa387b813c8673a5014';
const TOCHKA_CLIENT_SECRET = 'abe1861057a5461bb80115bfe3b0d8a9';

async function debugToken() {
  console.log('🔍 Детальная отладка OAuth токена...\n');

  const tokenUrl = `${TOCHKA_BASE_URL}/connect/token`;

  // Вариант 1: Без scope
  console.log('1️⃣ Попытка без scope...');
  await testTokenRequest(tokenUrl, {
    grant_type: 'client_credentials',
    client_id: TOCHKA_CLIENT_ID,
    client_secret: TOCHKA_CLIENT_SECRET,
  });

  // Вариант 2: С разными scope
  const scopes = [
    'acquiring',
    'payments',
    'openbanking',
    'open_banking',
    'sbp',
    'acquiring payments',
    'acquiring sbp',
  ];

  for (const scope of scopes) {
    console.log(`\n2️⃣ Попытка со scope: "${scope}"...`);
    await testTokenRequest(tokenUrl, {
      grant_type: 'client_credentials',
      client_id: TOCHKA_CLIENT_ID,
      client_secret: TOCHKA_CLIENT_SECRET,
      scope: scope,
    });
  }
}

async function testTokenRequest(url, params) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
    });

    console.log(`   Статус: ${response.status} ${response.statusText}`);

    const data = await response.json();

    if (response.ok) {
      console.log('   ✅ Полный ответ:');
      console.log(JSON.stringify(data, null, 2));

      // Декодируем токен если это JWT
      if (data.access_token) {
        console.log(`\n   Токен: ${data.access_token}`);

        // Проверим, это JWT или просто base64?
        const parts = data.access_token.split('.');
        if (parts.length === 3) {
          console.log('   🔍 Это JWT токен! Декодируем...');
          try {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            console.log('   Payload:', JSON.stringify(payload, null, 2));
          } catch (e) {
            console.log('   ❌ Не удалось декодировать JWT');
          }
        } else {
          console.log('   ℹ️  Это не JWT токен (не 3 части)');
          // Попробуем декодировать как base64
          try {
            const decoded = Buffer.from(data.access_token, 'base64').toString();
            console.log(`   Base64 decoded: ${decoded}`);
          } catch (e) {
            console.log('   ℹ️  Не base64');
          }
        }
      }
    } else {
      console.log('   ❌ Ошибка:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('   ❌ Исключение:', error.message);
  }
}

debugToken().catch(console.error);
