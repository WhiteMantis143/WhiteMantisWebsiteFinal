import { NextRequest, NextResponse } from 'next/server'

const ANDROID_PACKAGE = 'com.whitemantis.app'

function htmlRedirect(intentUri: string): NextResponse {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>window.location.href=${JSON.stringify(intentUri)};</script></body></html>`
    return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
    })
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const idToken = formData.get('id_token') as string | null
        const userJson = formData.get('user') as string | null

        if (!idToken) {
            const errorIntent = `intent://apple-auth?error=missing_token#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
            return htmlRedirect(errorIntent)
        }

        let firstName = '', lastName = ''
        if (userJson) {
            try {
                const u = JSON.parse(userJson)
                firstName = u?.name?.firstName || ''
                lastName = u?.name?.lastName || ''
            } catch {}
        }

        const params = new URLSearchParams({ token: idToken, firstName, lastName })
        const intentUri = `intent://apple-auth?${params}#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
        return htmlRedirect(intentUri)
    } catch (err) {
        const errorIntent = `intent://apple-auth?error=server_error#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
        return htmlRedirect(errorIntent)
    }
}
