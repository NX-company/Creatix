import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendVerificationEmailParams {
  to: string
  token: string
  name?: string | null
}

export async function sendVerificationEmail({
  to,
  token,
  name,
}: SendVerificationEmailParams) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`
  const fromEmail = 'onboarding@resend.dev'

  try {
    const { data, error } = await resend.emails.send({
      from: `Creatix <${fromEmail}>`,
      to: [to],
      subject: 'Подтвердите ваш email - Creatix',
      html: getVerificationEmailTemplate(verifyUrl, name || 'Пользователь'),
    })

    if (error) {
      console.error('❌ Error sending verification email:', error)
      throw error
    }

    console.log('✅ Verification email sent:', { to, emailId: data?.id })
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('❌ Failed to send verification email:', error)
    throw error
  }
}

interface SendWelcomeEmailParams {
  to: string
  name?: string | null
}

export async function sendWelcomeEmail({
  to,
  name,
}: SendWelcomeEmailParams) {
  const fromEmail = 'onboarding@resend.dev'
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  try {
    const { data, error } = await resend.emails.send({
      from: `Creatix <${fromEmail}>`,
      to: [to],
      subject: 'Добро пожаловать в Creatix! 🎉',
      html: getWelcomeEmailTemplate(name || 'Пользователь', appUrl),
    })

    if (error) {
      console.error('❌ Error sending welcome email:', error)
      throw error
    }

    console.log('✅ Welcome email sent:', { to, emailId: data?.id })
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error)
    throw error
  }
}

function getVerificationEmailTemplate(verifyUrl: string, name: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Подтвердите ваш email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f0f;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #FF6B9D 0%, #8B5CF6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                    Creatix
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 20px 40px 40px;">
                  <h2 style="margin: 0 0 20px; font-size: 24px; color: #ffffff; font-weight: 600;">
                    Привет, ${name}! 👋
                  </h2>
                  
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #b0b0b0;">
                    Спасибо за регистрацию в <strong style="color: #ffffff;">Creatix</strong> — вашем умном помощнике для создания презентаций, лендингов и многого другого!
                  </p>
                  
                  <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #b0b0b0;">
                    Чтобы начать пользоваться всеми возможностями платформы, подтвердите ваш email:
                  </p>
                  
                  <!-- Button -->
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td style="border-radius: 8px; background: linear-gradient(135deg, #FF6B9D 0%, #8B5CF6 100%);">
                        <a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                          ✉️ Подтвердить email
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #808080;">
                    Или скопируйте эту ссылку в браузер:
                  </p>
                  <p style="margin: 10px 0 0; font-size: 13px; line-height: 1.4; color: #606060; word-break: break-all;">
                    ${verifyUrl}
                  </p>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #2a2a3e;">
                  
                  <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #808080;">
                    Если вы не регистрировались на Creatix, просто проигнорируйте это письмо.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #0d0d1a; text-align: center;">
                  <p style="margin: 0 0 10px; font-size: 12px; color: #606060;">
                    © ${new Date().getFullYear()} Creatix. Все права защищены.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #606060;">
                    <a href="mailto:aisnab@bk.ru" style="color: #8B5CF6; text-decoration: none;">aisnab@bk.ru</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

function getWelcomeEmailTemplate(name: string, appUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Добро пожаловать в Creatix!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f0f;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #FF6B9D 0%, #8B5CF6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                    Creatix
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 20px 40px 40px;">
                  <h2 style="margin: 0 0 20px; font-size: 24px; color: #ffffff; font-weight: 600;">
                    Добро пожаловать, ${name}! 🎉
                  </h2>
                  
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #b0b0b0;">
                    Ваш email успешно подтвержден! Теперь вы можете полностью использовать все возможности <strong style="color: #ffffff;">Creatix</strong>.
                  </p>
                  
                  <div style="margin: 30px 0; padding: 20px; background-color: #1a1a2e; border-radius: 8px; border-left: 4px solid #8B5CF6;">
                    <h3 style="margin: 0 0 15px; font-size: 18px; color: #ffffff;">
                      🚀 Что вы можете делать:
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #b0b0b0;">
                      <li>Создавать презентации с AI</li>
                      <li>Генерировать лендинги</li>
                      <li>Создавать резюме и коммерческие предложения</li>
                      <li>Использовать умную генерацию изображений</li>
                    </ul>
                  </div>
                  
                  <!-- Button -->
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 30px auto 0;">
                    <tr>
                      <td style="border-radius: 8px; background: linear-gradient(135deg, #FF6B9D 0%, #8B5CF6 100%);">
                        <a href="${appUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                          🎨 Начать создавать
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #2a2a3e;">
                  
                  <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #808080;">
                    Если у вас есть вопросы, напишите нам на <a href="mailto:aisnab@bk.ru" style="color: #8B5CF6; text-decoration: none;">aisnab@bk.ru</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #0d0d1a; text-align: center;">
                  <p style="margin: 0 0 10px; font-size: 12px; color: #606060;">
                    © ${new Date().getFullYear()} Creatix. Все права защищены.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #606060;">
                    <a href="mailto:aisnab@bk.ru" style="color: #8B5CF6; text-decoration: none;">aisnab@bk.ru</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

