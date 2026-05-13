import { NextRequest, NextResponse } from 'next/server'
import * as jose from 'jose'

const ANDROID_PACKAGE = process.env.ANDROID_APP_PACKAGE || 'com.whitemantis.app'
const APPLE_ID = process.env.APPLE_ID || ''
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || ''
const APPLE_KEY_ID = process.env.APPLE_KEY_ID || ''
const APPLE_PRIVATE_KEY = (process.env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
// Must EXACTLY match the redirect URI registered in Apple Developer Console for this Service ID
const APPLE_ANDROID_REDIRECT_URI = process.env.APPLE_ANDROID_REDIRECT_URI || ''

async function generateClientSecret(): Promise<string> {
  const pk = await jose.importPKCS8(APPLE_PRIVATE_KEY, 'ES256')
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

function htmlPage(intentUri: string, isError: boolean): NextResponse {
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
    p{color:#666;font-size:15px;margin-bottom:32px;line-height:1.5}
    a.btn{display:block;padding:16px;background:#6C7A5F;color:#fff;text-decoration:none;border-radius:10px;font-size:17px;font-weight:600;letter-spacing:.3px}
    a.btn:active{opacity:.85}
  </style>
</head>
<body>
  <div class="card">
    <h2>${isError ? 'Sign-in failed' : 'Signed in!'}</h2>
    <p>${isError ? 'Something went wrong. Please try again.' : 'Tap below to return to the app.'}</p>
    <a class="btn" href="${intentUri}">${isError ? 'Go back to App' : 'Open App'}</a>
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
      // Apple sent authorization code — exchange it for id_token on server
      finalIdToken = await exchangeCodeForIdToken(code)
    }

    if (!finalIdToken) {
      const errorIntent = `intent://apple-auth?error=missing_token#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
      return htmlPage(errorIntent, true)
    }

    // Always pass id_token — backend verifyAppleToken expects JWT format
    const params = new URLSearchParams({ token: finalIdToken, tokenType: 'id_token', firstName, lastName })
    const intentUri = `intent://apple-auth?${params}#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
    return htmlPage(intentUri, false)
  } catch (err) {
    console.error('[AppleAndroidCallback] Error:', err)
    const errorIntent = `intent://apple-auth?error=server_error#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
    return htmlPage(errorIntent, true)
  }
}
