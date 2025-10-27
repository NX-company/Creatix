/**
 * Простой скрипт для настройки webhook Точка Банка
 * Использует готовый TOCHKA_OAUTH_ACCESS_TOKEN из окружения
 */

async function setupWebhook() {
  try {
    const accessToken = process.env.TOCHKA_OAUTH_ACCESS_TOKEN
    const clientId = process.env.TOCHKA_OAUTH_CLIENT_ID || process.env.TOCHKA_CLIENT_ID

    if (!accessToken) {
      throw new Error('TOCHKA_OAUTH_ACCESS_TOKEN not found')
    }

    if (!clientId) {
      throw new Error('TOCHKA_OAUTH_CLIENT_ID or TOCHKA_CLIENT_ID not found')
    }

    console.log('📋 Client ID:', clientId)
    console.log('🔑 Using access token from environment')

    // 1. Получить текущие настройки
    console.log('\n📥 Getting current webhook settings...')

    const getUrl = `https://enter.tochka.com/uapi/webhook/v1.0/${clientId}`
    console.log('GET:', getUrl)

    const getResponse = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!getResponse.ok) {
      const errorText = await getResponse.text()
      console.log(`⚠️  Current settings not found (${getResponse.status}):`)
      console.log(errorText)
    } else {
      const currentSettings = await getResponse.json()
      console.log('📦 Current settings:', JSON.stringify(currentSettings, null, 2))
    }

    // 2. Настроить webhook
    console.log('\n🔧 Configuring webhook...')

    const webhookConfig = {
      url: 'https://aicreatix.ru/api/payments/webhook',
      events: [
        'acquiringInternetPayment',
        'incomingSbpPayment',
      ],
    }

    console.log('📤 Config:', JSON.stringify(webhookConfig, null, 2))

    const putUrl = `https://enter.tochka.com/uapi/webhook/v1.0/${clientId}`
    console.log('PUT:', putUrl)

    const putResponse = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(webhookConfig),
    })

    const putText = await putResponse.text()

    if (!putResponse.ok) {
      throw new Error(`Failed to configure webhook: ${putResponse.status} - ${putText}`)
    }

    console.log('✅ Webhook configured!')
    console.log('Response:', putText)

    // 3. Тест
    console.log('\n🧪 Sending test webhook...')

    const testUrl = `https://enter.tochka.com/uapi/webhook/v1.0/${clientId}/test_send`
    console.log('POST:', testUrl)

    const testResponse = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        event: 'acquiringInternetPayment',
      }),
    })

    const testText = await testResponse.text()

    if (!testResponse.ok) {
      console.log(`⚠️  Test failed (${testResponse.status}):`, testText)
    } else {
      console.log('✅ Test webhook sent!')
      console.log('Response:', testText)
    }

    console.log('\n✅ DONE! Check server logs for test webhook')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

setupWebhook()
