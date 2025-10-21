/**
 * Тест для определения правильного пути к API Точка Банка
 */

const TOCHKA_JWT_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI5ZDgyMDFmZjc4OTdlMDM2YzBiMzBhNWY4OTc0NGE4OSIsInN1YiI6IjZhMjYxNTYwLTQ2NmQtNDc0YS1iYjRiLWMyODU4YjM5YTAzMyIsImN1c3RvbWVyX2NvZGUiOiIzMDUyMDg5ODcifQ.Dxt-Y9H87nQDI1a7q2vmzeT1PD3EIcAUPyChin3pBFoOCEOBZnb6_970gyHhhyQofh0Xmkuhj6_Ameh03kufKPNOerrPpHzwW4vaSLjrOXJn_4oaNqZdDd5a9lFX9PjtSn23EqLvN-DZzC2XKYeVg2k7i-aQfaMx2I0EmUzUKw6ZEwHMEk63wN89nGAh_gW4DmOQHJBVwofDbFoPCaH0T8DimD1sdpSc3C2qiMH5XYcZQUHeuiAVarNxnswDIOodZXM0ISKvudGwjfX6GGkRAmmLDWgrvpLxMsYQGk3wuJ6YI3TZUotfqkAv8eADjEHXATFGdwYS6-aPqGQiP3vaFZ2SeTvegOEerleIPSJV-FBlp2k3cnzbqxl-73E3rCOcb3Vxa5dZMMyymAZWEf-mKHdTWoiOSXdZE0Mfis7h2u_kc0r5SlPdUez5_bH8ElOIiG-hXdU-jKeVcr9OXqvGPuwtRC-oGCq1-A5eDJzamIscDsFm7z6j0xNqit3fOojr';
const TOCHKA_BASE_URL = 'https://enter.tochka.com';

// Возможные варианты путей для тестирования
const pathVariants = [
  '/api/v1/open_banking/v1/customers',
  '/api/v2/open_banking/v1/customers',
  '/api/v2/open_banking/v2/customers',
  '/uapi/open_banking/v1/customers',
  '/open_banking/v1/customers',
  '/api/open_banking/v1/customers',
];

async function testPaths() {
  console.log('🧪 Тестирование различных вариантов путей API...\n');

  for (const path of pathVariants) {
    const fullUrl = `${TOCHKA_BASE_URL}${path}`;
    console.log(`Пробуем: ${fullUrl}`);

    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${TOCHKA_JWT_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log(`   Статус: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ УСПЕХ! Это правильный путь!');
        console.log('   Ответ:', JSON.stringify(data, null, 2));
        console.log('');
        return path;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Ошибка: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Исключение: ${error.message}`);
    }

    console.log('');
  }

  console.log('❌ Ни один из вариантов не подошел');
}

testPaths().catch(console.error);
