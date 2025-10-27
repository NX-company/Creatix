import { createTochkaClient } from '../lib/tochka'

const operationId = process.argv[2]

if (!operationId) {
  console.error('❌ Usage: tsx check-payment-status.ts <operationId>')
  process.exit(1)
}

async function checkPaymentStatus() {
  try {
    const tochkaClient = createTochkaClient('v1.0')

    console.log(`🔍 Checking payment status for operationId: ${operationId}`)

    const paymentInfo = await tochkaClient.getPaymentInfo(operationId)

    console.log('\n📦 Payment Info from Tochka Bank:')
    console.log(JSON.stringify(paymentInfo, null, 2))

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkPaymentStatus()
