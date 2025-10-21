/**
 * Поиск правильного пути к API после получения OAuth токена
 */

const TOCHKA_BASE_URL = 'https://enter.tochka.com';
const TOCHKA_CLIENT_ID = '8161e24317f44aa387b813c8673a5014';
const TOCHKA_CLIENT_SECRET = 'abe1861057a5461bb80115bfe3b0d8a9';

// Различные варианты путей для тестирования
const pathVariants = [
  '/uapi/open_banking/v1/customers',
  '/uapi/open_banking/v2/customers',
  '/api/v1/open_banking/v1/customers',
  '/api/v2/open_banking/v1/customers',
  '/api/v2/open_banking/v2/customers',
  '/api/open_banking/v1/customers',
  '/open-api/v1/customers',
  '/sbp-api/open_banking/v1/customers',
];

async function findCorrectPath() {
  console.log('🔍 Поиск правильного пути к API Точка Банка...\n');

  // Сначала получаем токен
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

  console.log(`✅ OAuth токен получен (expires in ${tokenData.expires_in}s)\n`);

  // Тестируем разные пути
  console.log('2️⃣ Тестирование различных путей API...\n');

  for (const path of pathVariants) {
    const fullUrl = `${TOCHKA_BASE_URL}${path}`;
    console.log(`Пробуем: ${fullUrl}`);

    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log(`   Статус: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('   ✅✅✅ УСПЕХ! Это правильный путь! ✅✅✅');
        console.log('   Ответ:');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
        console.log(`🎯 Найден правильный путь: ${path}`);
        return path;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ ${errorText.substring(0, 80)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Исключение: ${error.message}`);
    }

    console.log('');
  }

  console.log('❌ Ни один из путей не подошел. Возможно требуется другой endpoint.');
}

findCorrectPath().catch(console.error);
