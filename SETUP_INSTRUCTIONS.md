# NX Studio Setup Instructions

## Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys (OpenAI, OpenRouter, Replicate)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15
- React 18
- TypeScript
- OpenAI SDK
- Replicate SDK
- Playwright (for PDF generation)
- ExcelJS, docx, jspdf
- jszip (for ZIP archives)
- And more...

### 2. Configure Environment Variables

Copy the template file:

```bash
copy ENV_TEMPLATE.txt .env.local
```

Edit `.env.local` and fill in your API keys:

```env
# Required for PRO mode (GPT-4o and DALL-E 3)
OPENAI_API_KEY=sk-...

# Required for Free and Advanced modes (Gemini models)
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...

# Required for Advanced mode (Flux image generation)
REPLICATE_API_TOKEN=r8_...

# Optional: Proxy settings (if you're in a restricted region)
PROXY_HOST=your-proxy-host.com
PROXY_PORT=8080
PROXY_LOGIN=your-login
PROXY_PASSWORD=your-password
```

### 3. Get API Keys

#### OpenAI API Key
- Visit: https://platform.openai.com/api-keys
- Create a new secret key
- Add billing information (required for GPT-4o and DALL-E 3)

#### OpenRouter API Key
- Visit: https://openrouter.ai/keys
- Sign up and create an API key
- Add credits to your account
- This key is exposed to the client (NEXT_PUBLIC_ prefix)

#### Replicate API Token
- Visit: https://replicate.com/account/api-tokens
- Sign up and create a token
- Add billing information

### 4. Install Playwright Browsers

Playwright is used for PDF and image generation:

```bash
npx playwright install chromium
```

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Features by Mode

### Free Mode
- Basic document generation (Gemini 2.5 Flash Lite)
- Upload images
- Generate PDF, DOC, Excel files

### Advanced Mode
- Multimodal AI (Gemini 2.0 Flash)
- Website parsing
- AI image generation (Flux Schnell)
- Quality assurance system

### PRO Mode
- Premium AI models (GPT-4o)
- HD image generation (DALL-E 3)
- Video analysis
- Advanced multimodal features

## Troubleshooting

### "API key not configured" error
- Check that .env.local file exists
- Verify API keys are correct
- Restart the dev server after changing .env.local

### Playwright errors
- Run: `npx playwright install chromium`
- On Windows: May need to install Visual C++ Redistributable

### Large files not uploading
- Check file size limits in `lib/constants.ts`
- Images: 10MB max
- Videos: 50MB max
- Other files: 25MB max

### Storage migration errors
- Clear browser localStorage: DevTools → Application → Local Storage → Clear
- Refresh the page

## Security Notes

- Never commit .env.local to Git
- API keys in NEXT_PUBLIC_* are exposed to browser
- All sensitive API calls now go through server routes
- Proxy credentials are only used server-side

## Performance Tips

- Uploaded images are stored in memory (not localStorage)
- localStorage saves are debounced (500ms delay)
- API requests have timeouts (60-120s depending on operation)
- ZIP compression is enabled for file downloads


