import { NextRequest, NextResponse } from 'next/server'

const ANDROID_PACKAGE = 'com.whitemantis.app'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const idToken = formData.get('id_token') as string | null
        const userJson = formData.get('user') as string | null

        if (!idToken) {
            const errorIntent = `intent://apple-auth?error=missing_token#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
            return NextResponse.redirect(errorIntent, { status: 302 })
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
        return NextResponse.redirect(intentUri, { status: 302 })
    } catch (err) {
        const errorIntent = `intent://apple-auth?error=server_error#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
        return NextResponse.redirect(errorIntent, { status: 302 })
    }
}
