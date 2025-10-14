export function generateBrowserFingerprint(): string {
  if (typeof window === 'undefined') return ''
  
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency || 0,
    navigator.deviceMemory || 0,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    navigator.platform,
    navigator.vendor,
  ]
  
  const str = components.join('|')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return `fp_${Math.abs(hash).toString(36)}`
}

export function getBrowserFingerprint(): string {
  if (typeof window === 'undefined') return ''
  
  let fingerprint = localStorage.getItem('creatix_fp')
  
  if (!fingerprint) {
    fingerprint = generateBrowserFingerprint()
    localStorage.setItem('creatix_fp', fingerprint)
  }
  
  return fingerprint
}

