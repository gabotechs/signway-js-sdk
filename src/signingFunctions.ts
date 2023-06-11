import * as crypto from 'crypto'

const X_ALGORITHM = 'X-Sw-Algorithm'
const ALGORITHM = 'SW1-HMAC-SHA256'
const X_CREDENTIAL = 'X-Sw-Credential'
const X_DATE = 'X-Sw-Date'
const X_EXPIRES = 'X-Sw-Expires'
const X_SIGNED_HEADERS = 'X-Sw-SignedHeaders'
const X_SIGNED_BODY = 'X-Sw-Body'
const X_PROXY = 'X-Sw-Proxy'
export const X_SIGNATURE = 'X-Sw-Signature'

function padZero (n: number): string {
  return n.toString().padStart(2, '0')
}

function formatLongDatetime (dt: Date): string {
  const year = dt.getUTCFullYear()
  const month = padZero(dt.getUTCMonth() + 1)
  const day = padZero(dt.getUTCDate())
  const hour = padZero(dt.getUTCHours())
  const min = padZero(dt.getUTCMinutes())
  const secs = padZero(dt.getUTCSeconds())
  return `${year}${month}${day}T${hour}${min}${secs}Z`
}

function formatShortDatetime (dt: Date): string {
  const year = dt.getUTCFullYear()
  const month = padZero(dt.getUTCMonth() + 1)
  const day = padZero(dt.getUTCDate())
  return `${year}${month}${day}`
}

function canonicalUriString (uri: string): string {
  const decoded = new URL(uri)
  return decoded.pathname
}

function canonicalQueryString (uri: string): string {
  const decoded = new URL(uri)
  const params: string[] = []
  decoded.searchParams.forEach((value, key) => {
    const encodedKey = encodeURIComponent(key)
    const encodedValue = encodeURIComponent(value)

    params.push(`${encodedKey}=${encodedValue}`)
  })
  params.sort()
  return params.join('&')
}

function canonicalHeaderString (headers: Record<string, string>): string {
  const headersList = []
  for (const k in headers) {
    const v = headers[k]
    headersList.push(`${k.toLowerCase()}:${v.trim()}`)
  }
  headersList.sort()
  return headersList.join('\n')
}

function signedHeaderString (headers: Record<string, string>): string {
  const headersList = []
  for (const k in headers) {
    headersList.push(k.toLowerCase())
  }
  headersList.sort()
  return headersList.join(';')
}

export function canonicalRequest (
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string
): string {
  return `\
${method}
${canonicalUriString(url)}
${canonicalQueryString(url)}
${canonicalHeaderString(headers)}

${signedHeaderString(headers)}
${body}`
}

function scopeString (dt: Date): string {
  return formatShortDatetime(dt)
}

export function stringToSign (dt: Date, canonicalReq: string): string {
  return `\
${ALGORITHM}
${formatLongDatetime(dt)}
${scopeString(dt)}
${crypto.createHash('sha256').update(canonicalReq, 'utf8').digest('hex')}`
}

export function signingKey (dt: Date, secret: string): Buffer {
  const algSecret = `${ALGORITHM}${secret}`
  const h = crypto.createHmac('sha256', algSecret)
  h.update(formatShortDatetime(dt))
  return h.digest()
}

export function authorizationQueryParamsNoSig (
  accessKey: string,
  dt: Date,
  expires: number,
  proxyUrl: string,
  customHeaders: Record<string, string>,
  signBody: boolean
): string {
  const credentials = `${accessKey}/${scopeString(dt)}`

  const signedHeaders = []
  for (const k in customHeaders) {
    signedHeaders.push(k.toLowerCase().trim())
  }
  const headersString = signedHeaders.join(';')

  const parsedProxyUrl = new URL(proxyUrl)

  const quotedCredentials = encodeURIComponent(credentials)
  const quotedHeadersString = encodeURIComponent(headersString)
  const quotedProxyUrl = encodeURIComponent(parsedProxyUrl.toString())
  const longDate = formatLongDatetime(dt)
  const signBodyStr = signBody ? 'true' : 'false'

  return `\
?${X_ALGORITHM}=${ALGORITHM}\
&${X_CREDENTIAL}=${quotedCredentials}\
&${X_DATE}=${longDate}\
&${X_EXPIRES}=${expires}\
&${X_PROXY}=${quotedProxyUrl}\
&${X_SIGNED_HEADERS}=${quotedHeadersString}\
&${X_SIGNED_BODY}=${signBodyStr}`
}
