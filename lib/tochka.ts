/**
 * Библиотека для работы с API Точка Банка
 * Документация: https://developers.tochka.com/docs/tochka-api/
 */

// ============================================
// ТИПЫ ДЛЯ ПЛАТЕЖНЫХ ССЫЛОК
// ============================================

export interface TochkaPaymentParams {
  amount: number // Сумма в рублях
  customerCode?: string // Уникальный код клиента (опционально, подставится автоматически)
  purpose: string // Назначение платежа
  paymentMode: ('card' | 'tinkoff' | 'sbp')[] // Способы оплаты
  redirectUrl: string // URL после успешной оплаты
  failRedirectUrl: string // URL после неудачной оплаты
  saveCard?: boolean // Предложить сохранить карту
  consumerId?: string // ID покупателя
  ttl?: number // Время действия ссылки в минутах (1-44640, по умолчанию 10080)
}

export interface TochkaPaymentWithReceiptParams extends TochkaPaymentParams {
  client: {
    email: string // Email покупателя для отправки чека
  }
  items: Array<{
    name: string // Название товара/услуги
    amount: number // Цена за единицу
    quantity: number // Количество
  }>
}

export interface TochkaPaymentResponse {
  paymentId: string
  paymentUrl: string
  status: string
  expiresAt: string
}

export interface TochkaPaymentInfo {
  operationId: string
  status: string
  amount: number
  currency: string
  purpose: string
  paymentMode: string[]
  createdAt: string
  expiresAt: string
  consumerId?: string
}

export interface TochkaPaymentListParams {
  from?: string // Дата начала (ISO 8601)
  to?: string // Дата окончания (ISO 8601)
  status?: string // Статус платежа
  limit?: number // Лимит записей
  offset?: number // Смещение
}

export interface TochkaRefundParams {
  amount?: number // Сумма возврата (если не указана - полный возврат)
  reason?: string // Причина возврата
}

export interface TochkaWebhookPayload {
  paymentId: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  amount: number
  customerCode: string
  consumerId?: string
  paymentDate?: string
}

// ============================================
// ТИПЫ ДЛЯ QR-КОДОВ СБП
// ============================================

export interface TochkaQRCodeParams {
  accountId: string // ID счета
  merchantId: string // ID мерчанта (ТСП)
  currency?: string // Валюта (по умолчанию RUB)
  amount?: number // Сумма (для динамических QR-кодов)
  paymentPurpose?: string // Назначение платежа
  qrcType?: 'QRDynamic' | 'QRStatic' // Тип QR-кода (по умолчанию QRDynamic)
  imageFormat?: 'image/png' | 'image/svg+xml' // Формат изображения
  mediaType?: 'image/png' | 'image/svg+xml' // Тип медиа
  width?: number // Ширина изображения (по умолчанию 0)
  height?: number // Высота изображения (по умолчанию 0)
  sourceQRCode?: string // Исходный QR-код
}

export interface TochkaQRCodeResponse {
  qrcId: string // ID QR-кода в СБП
  payload: string // Содержимое QR-кода
  qrcType: 'QRDynamic' | 'QRStatic'
  status: 'Active' | 'Inactive'
  image?: {
    width: number
    height: number
    mediaType: string
    content: string // Base64
  }
  createdAt: string
  currency?: string
  amount?: number
  paymentPurpose?: string
}

export interface TochkaQRCodePaymentStatus {
  qrcId: string
  code: string // Код статуса
  status: string // Текстовое описание статуса
  message?: string // Сообщение
  trxId?: string // ID транзакции
}

// ============================================
// ТИПЫ ДЛЯ КЛИЕНТОВ
// ============================================

export interface TochkaCustomer {
  customerCode: string
  customerType: 'Business' | 'Individual'
  name: string
  inn?: string
  kpp?: string
  accounts?: Array<{
    accountNumber: string
    currency: string
    balance?: number
  }>
}

export interface TochkaRetailerInfo {
  merchantId: string
  status: string
  isActive: boolean
  name?: string
}

/**
 * Класс для работы с API Точка Банка
 */
export class TochkaClient {
  private baseUrl: string
  private jwtToken: string
  private clientId: string
  private clientSecret: string
  private redirectUrl: string
  private customerCode: string
  private apiVersion: string
  private accessToken: string | null = null

  constructor(apiVersion: string = 'v1.0') {
    this.baseUrl = process.env.TOCHKA_API_URL || 'https://enter.tochka.com'
    this.jwtToken = process.env.TOCHKA_JWT_TOKEN || ''
    this.clientId = process.env.TOCHKA_CLIENT_ID || ''
    this.clientSecret = process.env.TOCHKA_CLIENT_SECRET || ''
    this.redirectUrl = process.env.TOCHKA_REDIRECT_URL || ''
    this.customerCode = process.env.TOCHKA_CUSTOMER_CODE || ''
    this.apiVersion = apiVersion

    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️  Tochka Bank OAuth credentials not configured')
    }
  }

  /**
   * Получить OAuth 2.0 токен с помощью Client Credentials flow
   * Документация: https://developers.tochka.com/docs/tochka-api/authorization
   */
  async getOAuthToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken
    }

    console.log('🔐 Getting OAuth 2.0 access token...')

    const tokenUrl = `${this.baseUrl}/connect/token`

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    })

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ OAuth token error:', errorText)
        throw new Error(`Failed to get OAuth token: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token

      console.log('✅ OAuth token obtained successfully')

      // Если есть expires_in, можно настроить автоматическое обновление
      if (data.expires_in) {
        console.log(`   Token expires in ${data.expires_in} seconds`)
      }

      return this.accessToken!
    } catch (error) {
      console.error('❌ Failed to get OAuth token:', error)
      throw error
    }
  }

  /**
   * Построить путь к API endpoint
   * Формат: /uapi/{service}/{apiVersion}/{path}
   * Например: /uapi/acquiring/v1/payments
   */
  private buildPath(service: string, path: string): string {
    // Точка использует формат /uapi/{service}/{apiVersion}/{path}
    return `/uapi/${service}/${this.apiVersion}/${path}`
  }

  /**
   * Базовый метод для выполнения запросов к API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Получить OAuth токен если еще не получен
    let token = this.accessToken
    if (!token) {
      // Попробуем использовать JWT токен если OAuth не сработает
      token = this.jwtToken
      if (!token) {
        // Если нет JWT, получаем OAuth токен
        token = await this.getOAuthToken()
      }
    }

    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Tochka API Error [${response.status}]:`, errorText)

      // Если ошибка 401 и у нас был OAuth токен, сбросим его и попробуем получить новый
      if (response.status === 401 && this.accessToken) {
        console.log('🔄 Access token expired, refreshing...')
        this.accessToken = null
        // Рекурсивно повторить запрос с новым токеном
        return this.request<T>(endpoint, options)
      }

      throw new Error(`Tochka API Error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  // ============================================
  // МЕТОДЫ ДЛЯ РАБОТЫ С КЛИЕНТАМИ
  // ============================================

  /**
   * Получить список клиентов для определения customerCode
   * Метод: GET /open_banking/{apiVersion}/customers
   * Документация: https://developers.tochka.com/docs/tochka-api/api/get-customers-list-open-banking-api-version-customers-get
   */
  async getCustomersList(): Promise<{ customers: TochkaCustomer[] }> {
    console.log('🔍 Getting customers list from Tochka API...')
    return this.request<{ customers: TochkaCustomer[] }>(
      this.buildPath('open_banking', 'customers')
    )
  }

  /**
   * Получить информацию о конкретном клиенте
   * Метод: GET /open_banking/{apiVersion}/customers/{customerCode}
   * Документация: https://developers.tochka.com/docs/tochka-api/api/get-customer-info-open-banking-api-version-customers-customer-code-get
   */
  async getCustomerInfo(customerCode?: string): Promise<TochkaCustomer> {
    const code = customerCode || this.customerCode
    console.log(`🔍 Getting customer info for ${code}...`)
    return this.request<TochkaCustomer>(
      this.buildPath('open_banking', `customers/${code}`)
    )
  }

  // ============================================
  // МЕТОДЫ ДЛЯ РАБОТЫ С ЭКВАЙРИНГОМ
  // ============================================

  /**
   * Проверить статус подключения интернет-эквайринга
   * Метод: GET /acquiring/{apiVersion}/retailers
   * Документация: https://developers.tochka.com/docs/tochka-api/api/get-retailers-acquiring-api-version-retailers-get
   * Статус REG и isActive: true означает, что эквайринг готов к работе
   */
  async getRetailers(): Promise<any> {
    console.log('🔍 Checking acquiring status...')
    const response = await this.request<any>(
      this.buildPath('acquiring', `retailers?customerCode=${this.customerCode}`)
    )
    // API возвращает { Data: { Retailer: [...] }, Links: {...}, Meta: {...} }
    return response
  }

  // ============================================
  // МЕТОДЫ ДЛЯ РАБОТЫ С ПЛАТЕЖНЫМИ ССЫЛКАМИ
  // ============================================

  /**
   * Создать платёжную ссылку
   * Метод: POST /acquiring/{apiVersion}/payments
   * Документация: https://developers.tochka.com/docs/tochka-api/api/create-payment-operation-acquiring-api-version-payments-post
   */
  async createPayment(params: TochkaPaymentParams): Promise<any> {
    // Формат согласно документации: { Data: { ... } }
    const payload = {
      Data: {
        customerCode: params.customerCode || this.customerCode,
        amount: params.amount.toString(), // API требует строку
        purpose: params.purpose,
        redirectUrl: params.redirectUrl,
        failRedirectUrl: params.failRedirectUrl,
        paymentMode: params.paymentMode || ['card', 'sbp'],
        saveCard: params.saveCard || false,
        consumerId: params.consumerId,
        ttl: params.ttl || 10080,
      }
    }

    console.log('🏦 Creating Tochka payment:', {
      amount: payload.Data.amount,
      purpose: payload.Data.purpose,
      paymentMode: payload.Data.paymentMode,
      ttl: payload.Data.ttl,
    })

    const result = await this.request<any>(
      this.buildPath('acquiring', 'payments'),
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )

    // API возвращает { Data: { paymentLink, operationId, status, ... }, Links: {...}, Meta: {...} }
    if (result.Data?.paymentLink) {
      console.log('✅ Payment link created:', result.Data.paymentLink)
      console.log('   Operation ID:', result.Data.operationId)
      console.log('   Status:', result.Data.status)
    }

    return result
  }

  /**
   * Создать платёжную ссылку с отправкой чека покупателю
   * Метод: POST /acquiring/{apiVersion}/payments_with_receipt
   * Документация: https://developers.tochka.com/docs/tochka-api/api/create-payment-operation-with-receipt-acquiring-api-version-payments-with-receipt-post
   */
  async createPaymentWithReceipt(
    params: TochkaPaymentWithReceiptParams
  ): Promise<any> {
    // Формат согласно документации: { Data: { ... } }
    const payload = {
      Data: {
        amount: params.amount.toString(), // API требует строку
        customerCode: params.customerCode || this.customerCode,
        purpose: params.purpose,
        paymentMode: params.paymentMode || ['card', 'sbp'],
        redirectUrl: params.redirectUrl,
        failRedirectUrl: params.failRedirectUrl,
        saveCard: params.saveCard || false,
        consumerId: params.consumerId,
        ttl: params.ttl || 10080,
        Client: params.client, // Заглавная C согласно API
        Items: params.items,   // Заглавная I согласно API
      }
    }

    console.log('🏦 Creating payment with receipt:', {
      amount: payload.Data.amount,
      purpose: payload.Data.purpose,
      email: params.client.email,
      items: params.items.length,
    })

    const result = await this.request<any>(
      this.buildPath('acquiring', 'payments_with_receipt'), // payments_with_receipt, НЕ payments/with_receipt
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )

    // API возвращает { Data: { paymentLink, operationId, ... }, Links: {...}, Meta: {...} }
    if (result.Data?.paymentLink) {
      console.log('✅ Payment link created:', result.Data.paymentLink)
    }

    return result
  }

  /**
   * Получить список платежей
   * Метод: GET /acquiring/{apiVersion}/payments
   * Документация: https://developers.tochka.com/docs/tochka-api/api/get-payment-operation-list-acquiring-api-version-payments-get
   */
  async getPaymentList(params?: TochkaPaymentListParams): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params?.from) queryParams.append('from', params.from)
    if (params?.to) queryParams.append('to', params.to)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const query = queryParams.toString()
    const endpoint = `${this.buildPath('acquiring', 'payments')}${query ? `?${query}` : ''}`

    console.log('🔍 Getting payment list...')
    return this.request(endpoint)
  }

  /**
   * Получить информацию о конкретном платеже
   * Метод: GET /acquiring/{apiVersion}/payments/{operationId}
   * Документация: https://developers.tochka.com/docs/tochka-api/api/get-payment-operation-info-acquiring-api-version-payments-operation-id-get
   */
  async getPaymentInfo(operationId: string): Promise<TochkaPaymentInfo> {
    console.log(`🔍 Getting payment info for ${operationId}...`)
    return this.request<TochkaPaymentInfo>(
      this.buildPath('acquiring', `payments/${operationId}`)
    )
  }

  /**
   * Возврат средств по платежу
   * Метод: POST /acquiring/{apiVersion}/payments/{operationId}/refund
   * Документация: https://developers.tochka.com/docs/tochka-api/api/refund-payment-operation-acquiring-api-version-payments-operation-id-refund-post
   */
  async refundPayment(operationId: string, params?: TochkaRefundParams): Promise<any> {
    const payload = {
      amount: params?.amount,
      reason: params?.reason || 'Возврат средств',
    }

    console.log(`💸 Refunding payment ${operationId}:`, payload)

    return this.request(
      this.buildPath('acquiring', `payments/${operationId}/refund`),
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  }

  /**
   * Подтверждение платежа (capture)
   * Метод: POST /acquiring/{apiVersion}/payments/{operationId}/capture
   * Документация: https://developers.tochka.com/docs/tochka-api/api/capture-payment-acquiring-api-version-payments-operation-id-capture-post
   */
  async capturePayment(operationId: string, amount?: number): Promise<any> {
    const payload = amount ? { amount } : {}

    console.log(`✅ Capturing payment ${operationId}:`, payload)

    return this.request(
      this.buildPath('acquiring', `payments/${operationId}/capture`),
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  }

  /**
   * Получить реестр платежей
   * Метод: GET /acquiring/{apiVersion}/registry
   * Документация: https://developers.tochka.com/docs/tochka-api/api/get-payment-registry-acquiring-api-version-registry-get
   */
  async getPaymentRegistry(from?: string, to?: string): Promise<any> {
    const queryParams = new URLSearchParams()
    if (from) queryParams.append('from', from)
    if (to) queryParams.append('to', to)

    const query = queryParams.toString()
    const endpoint = `${this.buildPath('acquiring', 'registry')}${query ? `?${query}` : ''}`

    console.log('📊 Getting payment registry...')
    return this.request(endpoint)
  }

  // ============================================
  // МЕТОДЫ ДЛЯ РАБОТЫ С QR-КОДАМИ СБП
  // ============================================

  /**
   * Получить список QR-кодов
   * Метод: GET /sbp/{apiVersion}/qr-code/legal-entity/{legalId}
   * Документация: https://developers.tochka.com/docs/tochka-api/api/get-qr-codes-list-sbp-api-version-qr-code-legal-entity-legal-id-get
   */
  async getQRCodesList(legalId: string): Promise<{ qrcodeList: TochkaQRCodeResponse[] }> {
    console.log(`🔍 Getting QR codes list for legal entity ${legalId}...`)
    return this.request<{ qrcodeList: TochkaQRCodeResponse[] }>(
      this.buildPath('sbp', `qr-code/legal-entity/${legalId}`)
    )
  }

  /**
   * Получить информацию о конкретном QR-коде
   * Метод: GET /sbp/{apiVersion}/qr-code/{qrcId}
   * Документация: https://developers.tochka.com/docs/tochka-api/api/get-qr-code-sbp-api-version-qr-code-qrc-id-get
   */
  async getQRCode(qrcId: string): Promise<TochkaQRCodeResponse> {
    console.log(`🔍 Getting QR code ${qrcId}...`)
    return this.request<TochkaQRCodeResponse>(
      this.buildPath('sbp', `qr-code/${qrcId}`)
    )
  }

  /**
   * Зарегистрировать новый QR-код в СБП
   * Метод: POST /sbp/{apiVersion}/qr-code/merchant/{merchantId}/account/{accountId}
   * Документация: https://developers.tochka.com/docs/tochka-api/api/register-qr-code-sbp-api-version-qr-code-merchant-merchant-id-account-id-post
   */
  async registerQRCode(
    merchantId: string,
    accountId: string,
    params: Partial<TochkaQRCodeParams>
  ): Promise<TochkaQRCodeResponse> {
    const payload = {
      currency: params.currency || 'RUB',
      amount: params.amount,
      paymentPurpose: params.paymentPurpose || 'Оплата по счету',
      qrcType: params.qrcType || 'QRDynamic',
      imageFormat: params.imageFormat || 'image/png',
      mediaType: params.mediaType || 'image/png',
      width: params.width || 0,
      height: params.height || 0,
      sourceQRCode: params.sourceQRCode,
    }

    console.log(`📱 Registering QR code for merchant ${merchantId}, account ${accountId}:`, {
      qrcType: payload.qrcType,
      amount: payload.amount,
    })

    return this.request<TochkaQRCodeResponse>(
      this.buildPath('sbp', `qr-code/merchant/${merchantId}/account/${accountId}`),
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  }

  /**
   * Получить статусы платежей по динамическим QR-кодам
   * Метод: GET /sbp/{apiVersion}/qr-codes/{qrc_ids}/payment-status
   * Документация: https://developers.tochka.com/docs/tochka-api/api/get-qr-codes-payment-status-sbp-api-version-qr-codes-qrc-ids-payment-status-get
   */
  async getQRCodesPaymentStatus(qrcIds: string[]): Promise<{ paymentList: TochkaQRCodePaymentStatus[] }> {
    const qrcIdsString = qrcIds.join(',')
    console.log(`🔍 Getting payment status for QR codes: ${qrcIdsString}`)

    return this.request<{ paymentList: TochkaQRCodePaymentStatus[] }>(
      this.buildPath('sbp', `qr-codes/${qrcIdsString}/payment-status`)
    )
  }

  // ============================================
  // ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ
  // ============================================

  /**
   * Проверить статус платежа (алиас для getPaymentInfo)
   * @deprecated Используйте getPaymentInfo вместо этого
   */
  async getPaymentStatus(paymentId: string): Promise<any> {
    return this.getPaymentInfo(paymentId)
  }

  /**
   * Проверить подпись webhook'а от Точка Банка
   * Использует HMAC-SHA256 для проверки подлинности webhook
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = process.env.TOCHKA_WEBHOOK_SECRET || ''

    if (!webhookSecret) {
      console.warn('⚠️  Webhook secret not configured')
      return false
    }

    if (!signature) {
      console.warn('⚠️  No signature provided in webhook request')
      return false
    }

    try {
      // Создаём HMAC-SHA256 подпись
      const crypto = require('crypto')
      const hmac = crypto.createHmac('sha256', webhookSecret)
      hmac.update(payload)
      const expectedSignature = hmac.digest('hex')

      // Сравниваем подписи (защита от timing attacks)
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )

      if (!isValid) {
        console.error('❌ Webhook signature mismatch')
        console.error('   Expected:', expectedSignature)
        console.error('   Received:', signature)
      }

      return isValid
    } catch (error) {
      console.error('❌ Error verifying webhook signature:', error)
      return false
    }
  }
}

/**
 * Создать экземпляр клиента Точка Банка
 * @param apiVersion - версия API (v1 или v2), по умолчанию v1
 */
export function createTochkaClient(apiVersion: string = 'v1'): TochkaClient {
  return new TochkaClient(apiVersion)
}

// Экспорт по умолчанию
export default TochkaClient
