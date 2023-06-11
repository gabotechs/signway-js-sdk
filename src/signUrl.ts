import * as signing_functions from './signingFunctions'
import * as crypto from 'crypto'

export interface SignUrlOptions {
  id: string
  secret: string
  host: string
  proxyUrl: string
  expiry: number
  method: string
  headers?: Record<string, string>
  body?: string
}

export function signUrl ({
  id,
  secret,
  host,
  proxyUrl,
  expiry,
  method,
  headers = {},
  body
}: SignUrlOptions): string {
  if (!host.endsWith('/')) {
    host += '/'
  }
  const dt = new Date()
  if (body !== undefined) {
    headers['Content-Length'] = body.length.toString()
  }
  const unsignedUrl = host + signing_functions.authorizationQueryParamsNoSig(
    id,
    dt,
    expiry,
    proxyUrl,
    headers,
    body !== undefined
  )
  const canonicalReq = signing_functions.canonicalRequest(
    method,
    unsignedUrl,
    headers,
    body ?? ''
  )
  const toSign = signing_functions.stringToSign(
    dt,
    canonicalReq
  )
  const signingKey = signing_functions.signingKey(
    dt,
    secret
  )

  const h = crypto.createHmac('sha256', signingKey)
  h.update(toSign)
  const signature = h.digest('hex')

  return `${unsignedUrl}&${signing_functions.X_SIGNATURE}=${signature}`
}
