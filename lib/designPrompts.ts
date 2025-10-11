import type { DocType } from './store'

export function getModernDesignPrompt(docType: DocType): string {
  const commonStyles = `
🎨 СОВРЕМЕННЫЙ ДИЗАЙН - ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:

ШРИФТЫ (подключи Google Fonts в <head>):
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

- Заголовки H1: font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: 48px;
- Заголовки H2: font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 36px;
- Заголовки H3: font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 24px;
- Текст: font-family: 'Inter', sans-serif; font-size: 16-18px; line-height: 1.6;

CSS СТИЛИ (обязательно):
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; color: #333; line-height: 1.6; }

.container { max-width: 1200px; margin: 0 auto; padding: 0 40px; }

.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  padding: 40px;
  transition: all 0.3s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
}

.btn {
  display: inline-block;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
`

  const typeSpecific: Record<DocType, string> = {
    email: `
📧 EMAIL СПЕЦИФИКА:

ВАЖНО: Email-клиенты имеют ограничения!
- Используй ТАБЛИЦЫ для layout: <table width="600" cellpadding="0" cellspacing="0">
- ВСЕ стили INLINE (не <style> теги)
- Максимальная ширина: 600px
- Безопасные шрифты: Arial, Helvetica, sans-serif (или встраивай Google Fonts через @import в style)

ДОПУСТИМЫЙ ДИЗАЙН:
- border-radius: 8px (работает в большинстве клиентов)
- box-shadow: 0 2px 8px rgba(0,0,0,0.1) (работает в Gmail, Apple Mail)
- НЕ используй сложные градиенты (используй solid colors)
- Кнопки: большие (44px высота), яркий фон, белый текст

СТРУКТУРА:
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f4f4;">
  <tr><td align="center" style="padding: 40px 0;">
    <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <tr><td style="padding: 40px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333;">
        [КОНТЕНТ]
      </td></tr>
    </table>
  </td></tr>
</table>

CTA КНОПКА:
<a href="#" style="display: inline-block; padding: 16px 32px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
  Действие
</a>
`,

    proposal: `
📊 КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ:

HERO СЕКЦИЯ (первый экран):
<section style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 100px 40px; text-align: center;">
  <div style="max-width: 1200px; margin: 0 auto;">
    <h1 style="font-family: 'Montserrat', sans-serif; font-size: 56px; font-weight: 900; margin-bottom: 24px; line-height: 1.2;">
      Заголовок с выгодой
    </h1>
    <p style="font-size: 20px; opacity: 0.95; margin-bottom: 32px;">Подзаголовок</p>
    <a href="#" class="btn btn-primary" style="background: white; color: #667eea; padding: 18px 40px; font-size: 18px;">
      Получить предложение →
    </a>
  </div>
</section>

СЕКЦИЯ ПРЕИМУЩЕСТВ (карточки):
<section style="background: #f8f9fa; padding: 80px 40px;">
  <div style="max-width: 1200px; margin: 0 auto;">
    <h2 style="text-align: center; margin-bottom: 60px;">Почему мы?</h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px;">
      <div class="card">
        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 32px;">
          ✓
        </div>
        <h3 style="margin-bottom: 12px;">Преимущество</h3>
        <p style="color: #666;">Описание</p>
      </div>
    </div>
  </div>
</section>

ТАБЛИЦА ЦЕН:
<table style="width: 100%; border-collapse: collapse; margin: 40px 0;">
  <thead>
    <tr style="background: linear-gradient(135deg, #667eea, #764ba2); color: white;">
      <th style="padding: 16px; text-align: left;">Услуга</th>
      <th style="padding: 16px; text-align: center;">Кол-во</th>
      <th style="padding: 16px; text-align: right;">Цена</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 16px;">...</td>
      <td style="padding: 16px; text-align: center;">...</td>
      <td style="padding: 16px; text-align: right; font-weight: 600;">...</td>
    </tr>
  </tbody>
  <tfoot>
    <tr style="background: #f8f9fa; font-weight: 700; font-size: 18px;">
      <td colspan="2" style="padding: 20px;">Итого:</td>
      <td style="padding: 20px; text-align: right; color: #667eea;">...</td>
    </tr>
  </tfoot>
</table>
`,

    invoice: `
💼 СЧЁТ:

ЧИСТЫЙ СОВРЕМЕННЫЙ СТИЛЬ (строгий, но не скучный):

КОНТЕЙНЕР:
<div style="max-width: 900px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 60px;">

ШАПКА:
<header style="border-bottom: 3px solid #667eea; padding-bottom: 30px; margin-bottom: 40px;">
  <h1 style="font-family: 'Montserrat', sans-serif; font-size: 32px; color: #667eea; margin-bottom: 8px;">
    Счёт № ___ от __.__.____
  </h1>
  <div style="color: #666; font-size: 14px;">ООО "Компания" | ИНН: ___</div>
</header>

РЕКВИЗИТЫ (две колонки):
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
  <div>
    <h3 style="font-size: 14px; color: #999; text-transform: uppercase; margin-bottom: 8px;">Поставщик</h3>
    <p style="font-size: 14px; line-height: 1.8;">[реквизиты]</p>
  </div>
  <div>
    <h3 style="font-size: 14px; color: #999; text-transform: uppercase; margin-bottom: 8px;">Покупатель</h3>
    <p style="font-size: 14px; line-height: 1.8;">[реквизиты]</p>
  </div>
</div>

ТАБЛИЦА (минималистичная):
<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr style="background: #f8f9fa;">
      <th style="padding: 12px; text-align: left; font-size: 12px; color: #999; text-transform: uppercase; font-weight: 600;">Наименование</th>
      <th style="padding: 12px; text-align: center; font-size: 12px; color: #999; text-transform: uppercase; font-weight: 600;">Кол-во</th>
      <th style="padding: 12px; text-align: right; font-size: 12px; color: #999; text-transform: uppercase; font-weight: 600;">Цена</th>
      <th style="padding: 12px; text-align: right; font-size: 12px; color: #999; text-transform: uppercase; font-weight: 600;">Сумма</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 16px;">...</td>
      <td style="padding: 16px; text-align: center;">...</td>
      <td style="padding: 16px; text-align: right; font-family: monospace;">...</td>
      <td style="padding: 16px; text-align: right; font-weight: 600; font-family: monospace;">...</td>
    </tr>
  </tbody>
  <tfoot>
    <tr style="border-top: 2px solid #667eea;">
      <td colspan="3" style="padding: 20px; font-weight: 700;">Итого к оплате:</td>
      <td style="padding: 20px; text-align: right; font-weight: 700; font-size: 20px; color: #667eea;">...</td>
    </tr>
  </tfoot>
</table>
`,

    presentation: `
🎤 ПРЕЗЕНТАЦИЯ КОМПАНИИ:

FULL-SCREEN СЛАЙДЫ (каждая секция = отдельная страница):

ТИТУЛЬНЫЙ СЛАЙД:
<div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center;">
  <div>
    <h1 style="font-family: 'Montserrat', sans-serif; font-size: 72px; font-weight: 900; margin-bottom: 24px;">
      Название компании
    </h1>
    <p style="font-size: 32px; opacity: 0.9;">Слоган или краткое описание</p>
  </div>
</div>

КОНТЕНТНЫЙ СЛАЙД:
<div style="height: 100vh; display: flex; align-items: center; padding: 80px; background: white;">
  <div style="max-width: 1200px; margin: 0 auto;">
    <h2 style="font-size: 56px; margin-bottom: 40px; color: #667eea;">О нас</h2>
    <p style="font-size: 24px; line-height: 1.8; color: #666;">
      Текст с крупным шрифтом для читаемости с расстояния
    </p>
  </div>
</div>

СЛАЙД С КАРТОЧКАМИ (услуги/преимущества):
<div style="height: 100vh; display: flex; align-items: center; padding: 80px; background: #f8f9fa;">
  <div style="max-width: 1400px; margin: 0 auto; width: 100%;">
    <h2 style="font-size: 56px; margin-bottom: 60px; text-align: center;">Наши услуги</h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px;">
      <div style="background: white; border-radius: 20px; padding: 50px; box-shadow: 0 8px 30px rgba(0,0,0,0.1);">
        <div style="font-size: 64px; margin-bottom: 20px;">🚀</div>
        <h3 style="font-size: 32px; margin-bottom: 16px;">Услуга 1</h3>
        <p style="font-size: 18px; color: #666;">Описание</p>
      </div>
    </div>
  </div>
</div>

ЦИФРЫ/ДОСТИЖЕНИЯ:
<div style="height: 100vh; display: flex; align-items: center; background: linear-gradient(135deg, #667eea, #764ba2); color: white;">
  <div style="max-width: 1400px; margin: 0 auto; width: 100%; display: grid; grid-template-columns: repeat(4, 1fr); gap: 60px; padding: 80px;">
    <div style="text-align: center;">
      <div style="font-size: 96px; font-weight: 900; margin-bottom: 16px;">500+</div>
      <div style="font-size: 24px; opacity: 0.9;">Клиентов</div>
    </div>
  </div>
</div>
`,

    logo: `
🎨 ЛОГОТИП:

ДЕМОНСТРАЦИЯ (сетка вариантов):
<div style="max-width: 1200px; margin: 40px auto; padding: 40px;">
  <h1 style="text-align: center; margin-bottom: 60px;">Логотип [Название]</h1>
  
  <!-- Основная версия -->
  <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 80px; text-align: center; border-radius: 20px; margin-bottom: 60px; box-shadow: 0 8px 30px rgba(0,0,0,0.1);">
    <svg viewBox="0 0 200 80" style="max-width: 500px;">
      [SVG КОД]
    </svg>
  </div>
  
  <!-- Варианты на разных фонах -->
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px;">
    <div style="background: white; padding: 60px; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
      <p style="margin-bottom: 20px; font-size: 14px; color: #999;">На белом</p>
      <svg viewBox="0 0 200 80" style="max-width: 250px;">[SVG]</svg>
    </div>
    <div style="background: #1a1a1a; padding: 60px; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
      <p style="margin-bottom: 20px; font-size: 14px; color: #999;">На черном</p>
      <svg viewBox="0 0 200 80" style="max-width: 250px;">[SVG инверсный]</svg>
    </div>
    <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 60px; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
      <p style="margin-bottom: 20px; font-size: 14px; color: white;">На цветном</p>
      <svg viewBox="0 0 200 80" style="max-width: 250px;">[SVG]</svg>
    </div>
  </div>
</div>
`,

    'product-card': `
🛍️ КАРТОЧКА ТОВАРА:

ФОРМАТ: 2000x2000px (квадрат) или 2000x2667px (3:4 для WB)

СТРУКТУРА:
<div style="width: 2000px; height: 2000px; background: white; padding: 80px; display: flex; flex-direction: column; align-items: center; justify-content: space-between;">
  
  <!-- Название -->
  <h1 style="font-family: 'Montserrat', sans-serif; font-size: 80px; font-weight: 900; text-align: center; margin-bottom: 40px; line-height: 1.2;">
    Название товара
  </h1>
  
  <!-- Изображение товара (placeholder) -->
  <div style="width: 1200px; height: 1200px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 60px rgba(0,0,0,0.1);">
    <span style="font-size: 120px;">📦</span>
  </div>
  
  <!-- Цена и скидка -->
  <div style="display: flex; align-items: baseline; gap: 40px; margin: 40px 0;">
    <span style="font-size: 140px; font-weight: 900; color: #e31e24;">2 990 ₽</span>
    <span style="font-size: 80px; color: #999; text-decoration: line-through;">4 990 ₽</span>
    <span style="background: linear-gradient(135deg, #e31e24, #c41a1f); color: white; padding: 24px 48px; border-radius: 16px; font-size: 72px; font-weight: 900; box-shadow: 0 8px 20px rgba(227, 30, 36, 0.3);">
      -40%
    </span>
  </div>
  
  <!-- Преимущества -->
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; width: 100%;">
    <div style="background: #f8f9fa; padding: 40px; border-radius: 20px; display: flex; align-items: center; gap: 30px;">
      <span style="font-size: 64px;">✓</span>
      <span style="font-size: 40px; font-weight: 600;">Преимущество 1</span>
    </div>
  </div>
  
</div>

⚠️ ОБЯЗАТЕЛЬНО:
- Белый фон (требование маркетплейсов)
- Крупные шрифты (читаются в миниатюре)
- Яркая цена и скидка
- Box-shadow для объема
`
  }

  return `${commonStyles}

${typeSpecific[docType]}

⚠️ КРИТИЧЕСКИ ВАЖНО:
- НЕ делай как газету! Используй современный веб-дизайн 2025
- Обязательно подключи Google Fonts
- Все блоки со скруглениями (border-radius)
- Добавь тени (box-shadow) для объема
- Используй цветовые акценты и градиенты (где уместно)
- Крупная типографика (не меньше 16px для текста)
- Много white space (не заполняй всё пространство)
`
}


