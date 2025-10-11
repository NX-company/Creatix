# 🤖 Система AI Агентов с QA и Feedback Loop

## ✅ РЕАЛИЗОВАНО

Создана полная система агентов которые работают как **единая команда** с автоматической проверкой качества и улучшением результата.

---

## 🏗️ Архитектура системы

```
┌─────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                          │
│         (координирует всех агентов)                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Feedback Loop (max 3 итерации)                         │
│                                                          │
│  Step 1: 📝 TEXT AGENT                                  │
│    ↓ генерирует контент на основе запроса              │
│    ↓ учитывает feedback из предыдущей итерации          │
│                                                          │
│  Step 2: 🔍 CONTENT ANALYZER AGENT                      │
│    ↓ анализирует сгенерированный контент               │
│    ↓ извлекает главную тему (название, продукт)        │
│    ↓ создает план для 3 изображений                    │
│                                                          │
│  Step 3: 🎨 IMAGE GENERATION AGENT                      │
│    ↓ генерирует изображения по плану                   │
│    ↓ использует СПЕЦИФИЧНЫЕ промпты, не generic        │
│                                                          │
│  Step 4: 🏗️ HTML COMPOSER AGENT                         │
│    ↓ собирает финальный HTML документ                  │
│    ↓ размещает изображения логично                     │
│                                                          │
│  Step 5: ✅ QA AGENT (ПРОВЕРКА КАЧЕСТВА)                │
│    ↓ проверяет:                                         │
│      • Content Quality (специфичность, детали)         │
│      • Image Relevance (соответствие теме)             │
│      • Consistency (контент + картинки = одна тема)    │
│    ↓                                                    │
│    ├─ Score >= 75 → ✅ APPROVED! → ГОТОВО!             │
│    └─ Score < 75 → ❌ REJECTED → Feedback → Retry      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Созданные файлы

### **1. `lib/config/agents.ts`**
Конфигурация моделей для всех агентов:
```typescript
export const AGENT_MODELS = {
  text: 'google/gemini-2.0-flash-001',
  contentAnalyzer: 'google/gemini-2.0-flash-001',
  htmlComposer: 'google/gemini-2.0-flash-001',
  qa: 'google/gemini-2.0-flash-001', // ⭐ Легко сменить на Claude
  freeMode: 'google/gemini-2.5-flash-lite',
}

export const QA_CONFIG = {
  maxIterations: 3,           // Максимум 3 попытки
  approvalThreshold: 75,      // Score >= 75 для одобрения
  enableQA: true,             // Включить/выключить QA
}
```

### **2. `lib/agents/contentAnalyzer.ts`**
Агент анализа контента:
- Читает сгенерированный текст
- Извлекает главную тему (компания, продукт, индустрия)
- Создает СПЕЦИФИЧНЫЕ промпты для изображений
- Учитывает feedback от QA

**Пример работы:**
```typescript
Input: 
  userPrompt: "создай презентацию компании"
  content: { title: "Кофейня Бодрое Утро", ... }

Output:
  {
    mainTheme: "Bodrое Utro coffee shop",
    companyName: "Бодрое Утро",
    industry: "food service",
    imagePrompts: [
      {
        type: "logo",
        prompt: "Bodrое Utro coffee shop logo, warm colors, cozy style",
        reasoning: "Matches company name and industry"
      },
      {
        type: "background",
        prompt: "Coffee shop interior, warm lighting, artisan atmosphere",
        reasoning: "Reflects cozy coffee shop theme"
      },
      {
        type: "illustration",
        prompt: "Barista making coffee, craftsmanship focus",
        reasoning: "Shows the service aspect"
      }
    ]
  }
```

### **3. `lib/agents/qaAgent.ts`**
Агент проверки качества:
- Проверяет контент (специфичность, детали)
- Проверяет изображения (соответствие теме)
- Проверяет консистентность (единая тема)
- Выставляет оценки 0-100
- Генерирует детальный feedback

**Критерии оценки:**
```typescript
Content Quality (0-100):
  ✅ Specific and detailed (not generic)
  ✅ Matches user request
  ✅ Professional language
  ❌ Generic phrases like "наша компания лучшая"
  ❌ Placeholder text

Image Relevance (0-100):
  ✅ Prompts are specific to theme
  ✅ Match document content
  ❌ Generic: "business logo", "corporate background"
  ❌ Don't match content theme

Consistency (0-100):
  ✅ Content and images tell same story
  ❌ Content about X, images about Y
```

**Пример QA отчета:**
```typescript
{
  approved: false,
  score: 62,
  contentScore: 85,
  imageScore: 35,
  consistencyScore: 65,
  issues: [
    {
      agent: "images",
      severity: "critical",
      category: "generic_prompts",
      description: "Image prompts are too generic: 'business logo'",
      suggestion: "Use 'Bodrое Utro coffee shop logo' instead"
    }
  ],
  feedback: "Content is good but images don't match coffee shop theme"
}
```

### **4. `lib/agents/imageAgent.ts`**
Обновленный агент генерации изображений:
- Новая функция `generateImagesFromPlan()` - генерирует по плану от Analyzer
- Старая функция сохранена для обратной совместимости
- Логи показывают тип и промпт каждого изображения

### **5. `lib/agents/orchestrator.ts`**
Обновленный оркестратор с feedback loop:
- Итерационный процесс (до 3 попыток)
- Передает feedback между агентами
- Логирует каждый шаг процесса
- Возвращает QA отчет и количество итераций

---

## 🎯 Как это работает

### **Сценарий 1: Одобрено с первого раза** ✅

```
User: "создай презентацию iPhone 15 Pro"

🔄 ========== ITERATION 1/3 ==========

📝 Step 1: Text Agent - Generating...
  Generated: {title: "iPhone 15 Pro", features: [...]}

🔍 Step 2: Content Analyzer - Planning images...
  🎯 Theme: "iPhone 15 Pro smartphone"
  📋 Image plan: 3 images
     1. [logo] "iPhone 15 Pro logo, Apple style..."
     2. [product] "iPhone 15 Pro titanium, product photo..."
     3. [illustration] "iPhone 15 Pro features showcase..."

🎨 Step 3: Image Agent - Generating...
  📝 Type: logo
  📝 Prompt: "iPhone 15 Pro logo, Apple style..."
  ✅ Image 1 generated
  
  📝 Type: product
  📝 Prompt: "iPhone 15 Pro titanium, product photo..."
  ✅ Image 2 generated
  
  📝 Type: illustration
  📝 Prompt: "iPhone 15 Pro features showcase..."
  ✅ Image 3 generated

🏗️  Step 4: HTML Composer - Building...

✅ Step 5: QA Agent - Quality review...
📊 QA Scores:
   Overall: 92/100
   Content: 95/100
   Images: 90/100
   Consistency: 90/100
✅ QA Agent: APPROVED!

🎉 QA APPROVED on iteration 1! Score: 92/100

✅ Orchestrator: Document generation complete!
   Iterations: 1
   Final QA Score: 92/100
```

---

### **Сценарий 2: Улучшение через feedback** 🔄

```
User: "создай презентацию компании"

🔄 ========== ITERATION 1/3 ==========

📝 Step 1: Text Agent - Generating...
  Generated: {title: "Презентация нашей компании", ...}

🔍 Step 2: Content Analyzer - Planning images...
  🎯 Theme: "business company"
  📋 Image plan: 3 images
     1. [logo] "professional company logo..."
     2. [background] "business background..."

🎨 Step 3: Image Agent - Generating...
  (generates generic images)

✅ Step 5: QA Agent - Quality review...
📊 QA Scores:
   Overall: 45/100
   Content: 60/100 (too generic)
   Images: 35/100 (generic prompts)
   Consistency: 40/100 (no clear theme)

❌ QA Agent: NOT APPROVED. Found 2 issues:
   1. [critical/text] Content is too generic, no company name
   2. [critical/images] Generic prompts won't look professional

🔄 Preparing to retry with improvements...

🔄 ========== ITERATION 2/3 ==========

📋 Previous QA feedback:
[text] Add specific company name and details
[images] Use specific theme from content

📝 Step 1: Text Agent - Generating...
  (prompt includes feedback)
  Generated: {title: "Кофейня Бодрое Утро", ...}

🔍 Step 2: Content Analyzer - Planning images...
  🎯 Theme: "Bodrое Utro coffee shop"
  📋 Image plan: 3 images
     1. [logo] "Bodrое Utro coffee shop logo, warm style..."
     2. [background] "Coffee shop interior, cozy..."

🎨 Step 3: Image Agent - Generating...
  (generates coffee-themed images)

✅ Step 5: QA Agent - Quality review...
📊 QA Scores:
   Overall: 88/100
   Content: 92/100 ✅
   Images: 85/100 ✅
   Consistency: 87/100 ✅

✅ QA Agent: APPROVED!

🎉 QA APPROVED on iteration 2! Score: 88/100
```

---

## 🔧 Настройки системы

### **Изменить максимальное количество итераций:**
```typescript
// lib/config/agents.ts
export const QA_CONFIG = {
  maxIterations: 5, // было 3
  approvalThreshold: 75,
  enableQA: true,
}
```

### **Изменить порог одобрения:**
```typescript
export const QA_CONFIG = {
  maxIterations: 3,
  approvalThreshold: 80, // было 75, теперь строже
  enableQA: true,
}
```

### **Отключить QA (для тестирования):**
```typescript
export const QA_CONFIG = {
  maxIterations: 3,
  approvalThreshold: 75,
  enableQA: false, // было true
}
```

### **Использовать Claude для QA:**
```typescript
export const AGENT_MODELS = {
  text: 'google/gemini-2.0-flash-001',
  contentAnalyzer: 'google/gemini-2.0-flash-001',
  htmlComposer: 'google/gemini-2.0-flash-001',
  qa: 'anthropic/claude-3.5-sonnet', // ⭐ Сменили модель
  freeMode: 'google/gemini-2.5-flash-lite',
}
```

---

## 📊 Примеры работы

### **Тест 1: Презентация огурца** 🥒

**До (старая система):**
```
Images:
  - "professional company logo" ❌
  - "business background" ❌
  - "corporate teamwork" ❌
```

**После (новая система):**
```
Iteration 1:
  Content Analyzer: "cucumber vegetable"
  Images:
    - "cucumber logo, fresh green design" ✅
    - "cucumber themed background, agricultural" ✅
    - "fresh cucumber concept, farm to table" ✅
  
  QA Score: 85/100 ✅
  APPROVED on iteration 1!
```

### **Тест 2: Карточка товара без деталей**

```
User: "карточка товара"

Iteration 1:
  Content: "Товар" (generic)
  Images: "product photo" (generic)
  QA Score: 50/100 ❌
  
Iteration 2:
  Content: "Смартфон Samsung Galaxy S24" (specific)
  Images: "Samsung Galaxy S24 product photo" (specific)
  QA Score: 88/100 ✅
  APPROVED!
```

---

## 💰 Стоимость

### **С QA на Gemini 2.0 Flash:**
```
Workers (4 агента × ~1000 tokens): $0.0004
QA (1 агент × ~1500 tokens): $0.00015
Images (3 × Flux): $0.009

ИТОГО за документ:
  - 1 iteration: ~$0.010
  - 2 iterations: ~$0.020
  - 3 iterations: ~$0.030
```

### **С QA на Claude 3.5 Sonnet:**
```
Workers: $0.0004
QA (Claude): $0.0045
Images: $0.009

ИТОГО за документ:
  - 1 iteration: ~$0.014
  - 2 iterations: ~$0.028
```

---

## ✅ Преимущества системы

### **1. Качество**
- ✅ Агенты работают как команда
- ✅ Контент и изображения всегда согласованы
- ✅ Автоматическая проверка качества
- ✅ Улучшение через feedback

### **2. Надежность**
- ✅ До 3 попыток создать хороший результат
- ✅ Четкие критерии оценки
- ✅ Детальные логи всех шагов

### **3. Универсальность**
- ✅ Работает для ЛЮБЫХ тем (не нужен словарь)
- ✅ AI сам извлекает тему из контента
- ✅ Генерирует специфичные промпты

### **4. Прозрачность**
- ✅ Пользователь видит QA оценку
- ✅ Логи показывают что делает каждый агент
- ✅ Понятно сколько итераций потребовалось

---

## 🧪 Как протестировать

### **Тест 1: Специфичная тема**
```
Input: "создай презентацию кофейни Бодрое Утро"
Expected:
  ✅ Content mentions "Бодрое Утро"
  ✅ Images: coffee shop themed
  ✅ QA approves on iteration 1
  ✅ Score >= 80
```

### **Тест 2: Generic запрос**
```
Input: "создай презентацию компании"
Expected:
  ❌ Iteration 1: rejected (generic)
  ✅ Iteration 2: approved with specific company
  ✅ Images match the company theme
```

### **Тест 3: Разные темы**
```
- "презентация огурца" → cucumber images
- "карточка iPhone 15" → iPhone photos
- "КП для стоматологии" → dental theme
- "логотип пиццерии" → pizza restaurant
```

---

## 🚀 Готово к работе!

Откройте http://localhost:3000 и попробуйте:

1. **Режим "Бесплатный"**: без AI изображений и QA
2. **Режим "Продвинутый"**: с Content Analyzer + QA + AI изображения
3. **Режим "PRO"**: заглушка

**Проверьте консоль браузера** - там будут детальные логи всех агентов! 🔍


