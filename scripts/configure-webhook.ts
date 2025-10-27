import { createTochkaClient } from '../lib/tochka'

async function configureWebhook() {
  try {
    const tochkaClient = createTochkaClient('v1.0')

    // Получить OAuth токен
    console.log('🔐 Getting OAuth token...')
    const token = await tochkaClient.getOAuthToken()
    console.log('✅ Token obtained')

    const clientId = process.env.TOCHKA_OAUTH_CLIENT_ID || process.env.TOCHKA_CLIENT_ID

    if (!clientId) {
      throw new Error('TOCHKA_OAUTH_CLIENT_ID or TOCHKA_CLIENT_ID not found in environment')
    }

    console.log(`📋 Client ID: ${clientId}`)

    // 1. Получить текущие настройки webhook
    console.log('\n📥 Getting current webhook settings...')

    const getResponse = await fetch(
      `https://enter.tochka.com/uapi/webhook/v1.0/${clientId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!getResponse.ok) {
      const errorText = await getResponse.text()
      console.log(`⚠️  Current settings not found (${getResponse.status}):`, errorText)
    } else {
      const currentSettings = await getResponse.json()
      console.log('📦 Current settings:', JSON.stringify(currentSettings, null, 2))
    }

    // 2. Настроить webhook URL и события
    console.log('\n🔧 Configuring webhook...')

    const webhookConfig = {
      url: 'https://aicreatix.ru/api/payments/webhook',
      events: [
        'acquiringInternetPayment',  // Платежи через карты
        'incomingSbpPayment',        // Платежи через СБП
      ],
    }

    console.log('📤 Sending configuration:', JSON.stringify(webhookConfig, null, 2))

    const putResponse = await fetch(
      `https://enter.tochka.com/uapi/webhook/v1.0/${clientId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(webhookConfig),
      }
    )

    if (!putResponse.ok) {
      const errorText = await putResponse.text()
      throw new Error(`Failed to configure webhook: ${putResponse.status} - ${errorText}`)
    }

    const result = await putResponse.json()
    console.log('✅ Webhook configured successfully!')
    console.log('📦 Response:', JSON.stringify(result, null, 2))

    // 3. Протестировать отправку webhook
    console.log('\n🧪 Testing webhook delivery...')

    const testResponse = await fetch(
      `https://enter.tochka.com/uapi/webhook/v1.0/${clientId}/test_send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          event: 'acquiringInternetPayment',
        }),
      }
    )

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.log(`⚠️  Test webhook failed (${testResponse.status}):`, errorText)
    } else {
      const testResult = await testResponse.json()
      console.log('✅ Test webhook sent!')
      console.log('📦 Response:', JSON.stringify(testResult, null, 2))
    }

    console.log('\n✅ Webhook configuration completed!')
    console.log('📋 Summary:')
    console.log('   URL: https://aicreatix.ru/api/payments/webhook')
    console.log('   Events: acquiringInternetPayment, incomingSbpPayment')
    console.log('\n⚠️  Check your server logs for the test webhook!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

configureWebhook()
