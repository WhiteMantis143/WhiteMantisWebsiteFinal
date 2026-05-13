import { NextRequest, NextResponse } from 'next/server'

const ANDROID_PACKAGE = 'com.whitemantis.app'

function htmlPage(intentUri: string, isError: boolean, debugFields?: string): NextResponse {
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
    .debug{margin-top:16px;font-size:11px;color:#999;word-break:break-all;text-align:left}
  </style>
</head>
<body>
  <div class="card">
    <h2>${isError ? 'Sign-in failed' : 'Signed in!'}</h2>
    <p>${isError ? 'Something went wrong. Please try again.' : 'Tap below to return to the app.'}</p>
    <a class="btn" href="${intentUri}">${isError ? 'Go back to App' : 'Open App'}</a>
    ${debugFields ? `<div class="debug">Fields received: ${debugFields}</div>` : ''}
  </div>
</body>
</html>`
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    // Collect field NAMES only (no values) for debug display
    const fieldNames: string[] = []
    formData.forEach((_value, key) => { fieldNames.push(key) })
    const debugFields = fieldNames.join(', ')

    // Apple sends id_token with implicit flow, code with code flow
    const idToken = formData.get('id_token') as string | null
    const code = formData.get('code') as string | null
    const userJson = formData.get('user') as string | null

    const tokenToUse = idToken || code

    if (!tokenToUse) {
      const errorIntent = `intent://apple-auth?error=missing_token#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
      return htmlPage(errorIntent, true, debugFields)
    }

    let firstName = '', lastName = ''
    if (userJson) {
      try {
        const u = JSON.parse(userJson)
        firstName = u?.name?.firstName || ''
        lastName = u?.name?.lastName || ''
      } catch {}
    }

    // Pass token type so the app knows what it received
    const tokenType = idToken ? 'id_token' : 'code'
    const params = new URLSearchParams({ token: tokenToUse, tokenType, firstName, lastName })
    const intentUri = `intent://apple-auth?${params}#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
    return htmlPage(intentUri, false)
  } catch {
    const errorIntent = `intent://apple-auth?error=server_error#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
    return htmlPage(errorIntent, true, 'exception')
  }
}
