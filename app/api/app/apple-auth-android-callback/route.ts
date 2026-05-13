import { NextRequest, NextResponse } from 'next/server'
import * as jose from 'jose'

const ANDROID_PACKAGE = process.env.ANDROID_APP_PACKAGE || 'com.whitemantis.app'
const APPLE_ID = process.env.APPLE_ID || ''
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || ''
const APPLE_KEY_ID = process.env.APPLE_KEY_ID || ''
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY || ''
const APPLE_ANDROID_REDIRECT_URI = process.env.APPLE_ANDROID_REDIRECT_URI || ''

function formatPrivateKey(raw: string): string {
  if (!raw || raw.trim() === '') throw new Error('APPLE_PRIVATE_KEY env var is not set')

  let key = raw
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '')
    .trim()

  if (key.startsWith('-----BEGIN PRIVATE KEY-----')) return key

  const b64lines = key.replace(/\s/g, '').match(/.{1,64}/g)?.join('\n') || ''
  return `-----BEGIN PRIVATE KEY-----\n${b64lines}\n-----END PRIVATE KEY-----`
}

async function generateClientSecret(): Promise<string> {
  if (!APPLE_TEAM_ID) throw new Error('APPLE_TEAM_ID env var is not set')
  if (!APPLE_KEY_ID) throw new Error('APPLE_KEY_ID env var is not set')
  if (!APPLE_ID) throw new Error('APPLE_ID env var is not set')

  const pk = await jose.importPKCS8(formatPrivateKey(APPLE_PRIVATE_KEY), 'ES256')
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: APPLE_KEY_ID })
    .setIssuer(APPLE_TEAM_ID)
    .setIssuedAt()
    .setExpirationTime('1h')
    .setAudience('https://appleid.apple.com')
    .setSubject(APPLE_ID)
    .sign(pk)
}

async function exchangeCodeForIdToken(code: string): Promise<string> {
  if (!APPLE_ANDROID_REDIRECT_URI) throw new Error('APPLE_ANDROID_REDIRECT_URI env var is not set')

  const clientSecret = await generateClientSecret()
  const body = new URLSearchParams({
    client_id: APPLE_ID,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: APPLE_ANDROID_REDIRECT_URI,
  })

  const res = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const data = await res.json()
  if (!res.ok || !data.id_token) {
    throw new Error(`Apple code exchange failed: ${JSON.stringify(data)}`)
  }
  return data.id_token as string
}

function htmlPage(intentUri: string, isError: boolean, errorDetail?: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${isError ? 'Sign-in Error' : 'Sign-in Successful'}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f0eb}
    .card{text-align:center;padding:40px 32px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:340px;width:90%}
    h2{color:${isError ? '#c0392b' : '#2d2d2d'};font-size:22px;margin-bottom:12px}
    p{color:#666;font-size:15px;margin-bottom:24px;line-height:1.5}
    a.btn{display:block;padding:16px;background:#6C7A5F;color:#fff;text-decoration:none;border-radius:10px;font-size:17px;font-weight:600;letter-spacing:.3px}
    a.btn:active{opacity:.85}
    .err{margin-top:16px;font-size:11px;color:#aaa;word-break:break-all;text-align:left}
  </style>
</head>
<body>
  <div class="card">
    <h2>${isError ? 'Sign-in failed' : 'Signed in!'}</h2>
    <p>${isError ? 'Something went wrong. Please try again.' : 'Tap below to return to the app.'}</p>
    <a class="btn" href="${intentUri}">${isError ? 'Go back to App' : 'Open App'}</a>
    ${errorDetail ? `<div class="err">${errorDetail}</div>` : ''}
  </div>
</body>
</html>`
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } })
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const idToken = formData.get('id_token') as string | null
    const code = formData.get('code') as string | null
    const userJson = formData.get('user') as string | null

    let firstName = '', lastName = ''
    if (userJson) {
      try {
        const u = JSON.parse(userJson)
        firstName = u?.name?.firstName || ''
        lastName = u?.name?.lastName || ''
      } catch {}
    }

    let finalIdToken = idToken
    if (!finalIdToken && code) {
      finalIdToken = await exchangeCodeForIdToken(code)
    }

    if (!finalIdToken) {
      const errorIntent = `intent://apple-auth?error=missing_token#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
      return htmlPage(errorIntent, true, 'No id_token or code received from Apple')
    }

    const params = new URLSearchParams({ token: finalIdToken, tokenType: 'id_token', firstName, lastName })
    const intentUri = `intent://apple-auth?${params}#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
    return htmlPage(intentUri, false)
  } catch (err) {
    console.error('[AppleAndroidCallback] Error:', err)
    const detail = String(err).substring(0, 120)
    const errorIntent = `intent://apple-auth?error=server_error#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
    return htmlPage(errorIntent, true, detail)
  }
}
