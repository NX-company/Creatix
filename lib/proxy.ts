import { HttpsProxyAgent } from 'https-proxy-agent'

export function getProxyAgent() {
  const proxyHost = process.env.PROXY_HOST
  const proxyPort = process.env.PROXY_PORT
  const proxyLogin = process.env.PROXY_LOGIN
  const proxyPassword = process.env.PROXY_PASSWORD

  if (!proxyHost || !proxyPort || !proxyLogin || !proxyPassword) {
    return null
  }

  const proxyUrl = `http://${proxyLogin}:${proxyPassword}@${proxyHost}:${proxyPort}`
  return new HttpsProxyAgent(proxyUrl)
}