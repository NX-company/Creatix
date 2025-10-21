/**
 * Тестирование разных BASE_URL для Tochka API
 */

const TOCHKA_JWT_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI5ZDgyMDFmZjc4OTdlMDM2YzBiMzBhNWY4OTc0NGE4OSIsInN1YiI6IjZhMjYxNTYwLTQ2NmQtNDc0YS1iYjRiLWMyODU4YjM5YTAzMyIsImN1c3RvbWVyX2NvZGUiOiIzMDUyMDg5ODcifQ.Dxt-Y9H87nQDI1a7q2vmzeT1PD3EIcAUPyChin3pBFoOCEOBZnb6_970gyHhhyQofh0Xmkuhj6_Ameh03kufKPNOerrPpHzwW4vaSLjrOXJn_4oaNqZdDd5a9lFX9PjtSn23EqLvN-DZzC2XKYeVg2k7i-aQfaMx2I0EmUzUKw6ZEwHMEk63wN89nGAh_gW4DmOQHJBVwofDbFoPCaH0T8DimD1sdpSc3C2qiMH5XYcZQUHeuiAVarNxnswDIOodZXM0ISKvudGwjfX6GGkRAmmLDWgrvpLxMsYQGk3wuJ6YI3TZUotfqkAv8eADjEHXATFGdwYS6-aPqGQiP3vaFZ2SeTvegOEerleIPSJV-FBlp2k3cnzbqxl-73E3rCOcb3Vxa5dZMMyymAZWEf-mKHdTWoiOSXdZE0Mfis7h2u_kc0r5SlPdUez5_bH8ElOIiG-hXdU-jKeVcr9OXqvGPuwtRC-oGCq1-A5eDJzamIscDsFm7z6j0xNqit3fOojr';
const TOCHKA_CUSTOMER_CODE = '305208987';

const baseUrls = [
  'https://enter.tochka.com',
  'https://api.tochka.com',
  'https://business.tochka.com',
  'https://openapi.tochka.com',
];

const endpoints = [
  '/uapi/acquiring/v1/retailers',
  '/api/acquiring/v1/retailers',
  '/acquiring/v1/retailers',
];

async function testUrls() {
  console.log('🔍 Тестирование различных URL для Tochka API...\n');

  for (const baseUrl of baseUrls) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🌐 BASE URL: ${baseUrl}`);
    console.log(`${'='.repeat(70)}\n`);

    for (const endpoint of endpoints) {
      const fullUrl = `${baseUrl}${endpoint}`;
      console.log(`Тест: ${fullUrl}`);

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
          console.log('   ✅✅✅ УСПЕХ! ✅✅✅');
          console.log('   Ответ:', JSON.stringify(data, null, 2));
          console.log(`\n🎯 Найден правильный URL: ${fullUrl}\n`);
          return { baseUrl, endpoint, fullUrl };
        } else if (response.status !== 404 && response.status !== 501) {
          const errorText = await response.text();
          console.log(`   ⚠️  ${errorText.substring(0, 100)}`);
        } else {
          console.log(`   ❌ ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Ошибка: ${error.message}`);
      }
    }
  }

  console.log('\n❌ Не найден рабочий URL');
}

testUrls().catch(console.error);
