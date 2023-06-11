import * as process from 'process'
import { expect } from 'chai'
import { signUrl } from './signUrl'

const ID = process.env.SW_ID ?? 'my-id'
const SECRET = process.env.SW_SECRET ?? 'my-secret'
const HOST = process.env.SW_HOST ?? 'http://localhost:3000'

it('empty', async function () {
  const url = signUrl({
    id: ID,
    secret: SECRET,
    host: HOST,
    expiry: 10,
    method: 'GET',
    proxyUrl: 'https://postman-echo.com/get'
  })

  const res = await fetch(url)
  const json = await res.json()
  expect(json.url).to.equal('https://postman-echo.com/get')
})

it('with params', async function () {
  const url = signUrl({
    id: ID,
    secret: SECRET,
    host: HOST,
    expiry: 10,
    method: 'GET',
    proxyUrl: 'https://postman-echo.com/get?param=1'
  })

  const res = await fetch(url)
  const json = await res.json()
  expect(json.args.param).to.equal('1')
})

it('with headers', async function () {
  const url = signUrl({
    id: ID,
    secret: SECRET,
    host: HOST,
    expiry: 10,
    method: 'GET',
    headers: { 'X-Foo': 'foo' },
    proxyUrl: 'https://postman-echo.com/get?param=1'
  })

  const res = await fetch(url, { headers: { 'X-Foo': 'foo' } })
  const json = await res.json()
  expect(json.headers['x-foo']).to.equal('foo')
})

it('with body', async function () {
  const url = signUrl({
    id: ID,
    secret: SECRET,
    host: HOST,
    expiry: 10,
    method: 'POST',
    headers: { 'X-Foo': 'foo' },
    body: '{"foo": "bar"}',
    proxyUrl: 'https://postman-echo.com/post?param=1'
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'X-Foo': 'foo', 'Content-Type': 'application/json' },
    body: '{"foo": "bar"}'
  })
  const json = await res.json()
  expect(json.json.foo).to.equal('bar')
})

it('expired', async function () {
  const url = signUrl({
    id: ID,
    secret: SECRET,
    host: HOST,
    expiry: 1,
    method: 'GET',
    proxyUrl: 'https://postman-echo.com/get'
  })

  await new Promise(resolve => setTimeout(resolve, 1000))

  const res = await fetch(url)
  expect(res.status).to.equal(400)
})

it('non present header', async function () {
  const url = signUrl({
    id: ID,
    secret: SECRET,
    host: HOST,
    expiry: 10,
    method: 'GET',
    headers: { 'X-Foo': 'foo' },
    proxyUrl: 'https://postman-echo.com/get?param=1'
  })

  const res = await fetch(url)
  expect(res.status).to.equal(400)
})

it('bad header value', async function () {
  const url = signUrl({
    id: ID,
    secret: SECRET,
    host: HOST,
    expiry: 10,
    method: 'GET',
    headers: { 'X-Foo': 'foo' },
    proxyUrl: 'https://postman-echo.com/get?param=1'
  })

  const res = await fetch(url, { headers: { 'X-Foo': 'bar' } })
  expect(res.status).to.equal(400)
})

it('bad body', async function () {
  const url = signUrl({
    id: ID,
    secret: SECRET,
    host: HOST,
    expiry: 10,
    method: 'POST',
    headers: { 'X-Foo': 'foo' },
    body: '{"foo": "bar"}',
    proxyUrl: 'https://postman-echo.com/post?param=1'
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'X-Foo': 'foo', 'Content-Type': 'application/json' },
    body: '{"foo": "baz"}'
  })
  expect(res.status).to.equal(400)
})
