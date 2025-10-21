/**
 * Тест с реальным JWT токеном
 */

const TOCHKA_BASE_URL = 'https://enter.tochka.com';
const TOCHKA_JWT_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI5ZDgyMDFmZjc4OTdlMDM2YzBiMzBhNWY4OTc0NGE4OSIsInN1YiI6IjZhMjYxNTYwLTQ2NmQtNDc0YS1iYjRiLWMyODU4YjM5YTAzMyIsImN1c3RvbWVyX2NvZGUiOiIzMDUyMDg5ODcifQ.Dxt-Y9H87nQDI1a7q2vmzeT1PD3EIcAUPyChin3pBFoOCEOBZnb6_970gyHhhyQofh0Xmkuhj6_Ameh03kufKPNOerrPpHzwW4vaSLjrOXJn_4oaNqZdDd5a9lFX9PjtSn23EqLvN-DZzC2XKYeVg2k7i-aQfaMx2I0EmUzUKw6ZEwHMEk63wN89nGAh_gW4DmOQHJBVwofDbFoPCaH0T8DimD1sdpSc3C2qiMH5XYcZQUHeuiAVarNxnswDIOodZXM0ISKvudGwjfX6GGkRAmmLDWgrvpLxMsYQGk3wuJ6YI3TZUotfqkAv8eADjEHXATFGdwYS6-aPqGQiP3vaFZ2SeTvegOEerleIPSJV-FBlp2k3cnzbqxl-73E3rCOcb3Vxa5dZMMyymAZWEf-mKHdTWoiOSXdZE0Mfis7h2u_kc0r5SlPdUez5_bH8ElOIiG-hXdU-jKeVcr9OXqvGPuwtRC-oGCq1-A5eDJzamIscDsFm7z6j0xNqit3fOojr';

async function testJWT() {
  console.log('🔍 Тестирование с JWT токеном...\n');

  const tests = [
    { name: 'Customers', url: '/uapi/open_banking/v1/customers' },
    { name: 'Retailers', url: '/uapi/acquiring/v1/retailers' },
  ];

  for (const test of tests) {
    console.log(`📋 Тест: ${test.name}`);
    const fullUrl = `${TOCHKA_BASE_URL}${test.url}`;
    console.log(`   URL: ${fullUrl}`);

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
        console.log(JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log(`   ❌ ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Исключение: ${error.message}`);
    }

    console.log('');
  }
}

testJWT().catch(console.error);
