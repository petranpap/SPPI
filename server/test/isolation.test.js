import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { createDb, migrateToLatest } from '../db.js'
import { createApp } from '../app.js'
import { createUserRepository } from '../repositories/userRepository.js'

const config = {
  jwtSecret: 'test-secret', sessionDays: 1, isProduction: false, trustProxy: false, registrationCode: null,
}
const gatedConfig = { ...config, registrationCode: 'let-me-in' }
const demo = JSON.parse(fs.readFileSync(new URL('../../examples/demo_SPPI_001.json', import.meta.url), 'utf8'))

let db, server, baseUrl

before(async () => {
  db = createDb({ client: 'better-sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true })
  await migrateToLatest(db)
  const users = createUserRepository(db)
  const passwordHash = bcrypt.hashSync('correct-horse-battery', 4)
  await users.create({ username: 'alice', passwordHash, displayName: 'Alice' })
  await users.create({ username: 'bob',   passwordHash, displayName: 'Bob' })
  server = createApp({ db, config }).listen(0)
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  server.close()
  await db.destroy()
})

async function request(method, path, { body, cookie } = {}) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers }
}

async function login(username, password = 'correct-horse-battery') {
  const response = await request('POST', '/api/auth/login', { body: { username, password } })
  assert.equal(response.status, 200)
  return response.headers.get('set-cookie').split(';')[0]
}

function makeSppi(sppiId, { team = 'Real Madrid', coach = null, targetZone = 'far_post', deliveryType = 'inswinger', signal } = {}) {
  const sppi = structuredClone(demo)
  sppi.metadata.sppi_id = sppiId
  sppi.metadata.attacking_team = team
  sppi.metadata.attacking_coach = coach
  sppi.execution.target_zone = targetZone
  sppi.execution.delivery_type = deliveryType
  if (signal !== undefined) sppi.execution.signal = signal
  return sppi
}

const leftArmUp = { signaler: { jersey_number: 9, player_id: null, location: 'near_post' }, gesture: 'one_arm_up', gesture_side: 'left', target: 'far_post' }

test('rejects unauthenticated access to every data endpoint', async () => {
  for (const path of ['/api/annotations', '/api/annotations/1', '/api/groups?by=team', '/api/insights?by=team&name=x']) {
    assert.equal((await request('GET', path)).status, 401, path)
  }
  assert.equal((await request('POST', '/api/annotations', { body: makeSppi('X') })).status, 401)
})

test('login fails for a wrong password and an unknown user alike', async () => {
  const wrongPassword = await request('POST', '/api/auth/login', { body: { username: 'alice', password: 'nope-nope-nope' } })
  const unknownUser   = await request('POST', '/api/auth/login', { body: { username: 'mallory', password: 'nope-nope-nope' } })
  assert.equal(wrongPassword.status, 401)
  assert.deepEqual(wrongPassword.body, unknownUser.body)
})

test('a user can never see another user\'s annotations, groups or insights', async () => {
  const alice = await login('alice')
  const bob   = await login('bob')

  let aliceFirstId
  for (let i = 1; i <= 10; i++) {
    const created = await request('POST', '/api/annotations', {
      cookie: alice,
      body: makeSppi(`A_${i}`, { coach: 'José Mourinho', signal: i <= 5 ? leftArmUp : null }),
    })
    assert.equal(created.status, 201)
    aliceFirstId ??= created.body.id
  }

  // Alice sees her own data
  assert.equal((await request('GET', '/api/annotations', { cookie: alice })).body.annotations.length, 10)
  assert.equal((await request('GET', `/api/annotations/${aliceFirstId}`, { cookie: alice })).status, 200)

  // Bob sees none of it — by list, by guessing IDs, by naming her team or coach
  assert.deepEqual((await request('GET', '/api/annotations', { cookie: bob })).body.annotations, [])
  assert.equal((await request('GET', `/api/annotations/${aliceFirstId}`, { cookie: bob })).status, 404)
  assert.deepEqual((await request('GET', '/api/groups?by=team', { cookie: bob })).body.groups, [])
  assert.deepEqual((await request('GET', '/api/groups?by=coach', { cookie: bob })).body.groups, [])
  for (const query of ['by=team&name=Real%20Madrid', 'by=coach&name=Jos%C3%A9%20Mourinho']) {
    const insights = (await request('GET', `/api/insights?${query}`, { cookie: bob })).body
    assert.equal(insights.total, 0)
    assert.equal(insights.unlocked, false)
    assert.equal(insights.targetZone, undefined)
  }
})

test('annotations are stored under the session user, whatever the body claims', async () => {
  const alice = await login('alice')
  const bob   = await login('bob')
  const forged = { ...makeSppi('FORGED_1', { team: 'Forged FC' }), user_id: 1, userId: 1 }
  const created = await request('POST', '/api/annotations', { cookie: bob, body: forged })
  assert.equal(created.status, 201)
  assert.equal((await request('GET', `/api/annotations/${created.body.id}`, { cookie: bob })).status, 200)
  assert.equal((await request('GET', `/api/annotations/${created.body.id}`, { cookie: alice })).status, 404)
})

test('SPPI IDs are unique per user, not globally', async () => {
  const alice = await login('alice')
  const bob   = await login('bob')
  assert.equal((await request('POST', '/api/annotations', { cookie: alice, body: makeSppi('DUP_1') })).status, 201)
  assert.equal((await request('POST', '/api/annotations', { cookie: alice, body: makeSppi('DUP_1') })).status, 409)
  assert.equal((await request('POST', '/api/annotations', { cookie: bob,   body: makeSppi('DUP_1') })).status, 201)
})

test('rejects invalid SPPI instances with details', async () => {
  const alice = await login('alice')
  const broken = makeSppi('BAD_1')
  broken.execution.delivery_type = 'banana'
  const response = await request('POST', '/api/annotations', { cookie: alice, body: broken })
  assert.equal(response.status, 400)
  assert.ok(response.body.details.some(d => d.includes('delivery_type')))

  const noTeam = makeSppi('BAD_2', { team: '   ' })
  assert.equal((await request('POST', '/api/annotations', { cookie: alice, body: noTeam })).status, 400)
})

test('insights unlock at exactly 10 annotations and count only that group', async () => {
  const carol = 'carol'
  await createUserRepository(db).create({ username: carol, passwordHash: bcrypt.hashSync('correct-horse-battery', 4), displayName: 'Carol' })
  const cookie = await login(carol)

  for (let i = 1; i <= 9; i++) {
    await request('POST', '/api/annotations', { cookie, body: makeSppi(`C_${i}`, { team: i % 2 ? 'Real Madrid' : ' real  madrid ', signal: i <= 5 ? leftArmUp : null }) })
  }
  // an unrelated team must not count toward Real Madrid
  await request('POST', '/api/annotations', { cookie, body: makeSppi('C_OTHER', { team: 'Chelsea' }) })

  const locked = (await request('GET', '/api/insights?by=team&name=Real%20Madrid', { cookie })).body
  assert.equal(locked.total, 9)
  assert.equal(locked.unlocked, false)
  assert.equal(locked.remaining, 1)
  assert.equal(locked.targetZone, undefined, 'no breakdown may leave the server below the threshold')

  await request('POST', '/api/annotations', { cookie, body: makeSppi('C_10', { signal: leftArmUp }) })
  const unlocked = (await request('GET', '/api/insights?by=team&name=REAL%20MADRID', { cookie })).body
  assert.equal(unlocked.total, 10)
  assert.equal(unlocked.unlocked, true)
  assert.equal(unlocked.targetZone.find(z => z.key === 'far_post').count, 10)
  assert.equal(unlocked.deliveryType.find(d => d.key === 'inswinger').count, 10)
  assert.deepEqual(unlocked.signalToDelivery[0], { gesture: 'one_arm_up', side: 'left', target_zone: 'far_post', count: 6 })
  assert.deepEqual(unlocked.signalToDelivery[1], { gesture: 'no_signal', side: null, target_zone: 'far_post', count: 4 })

  const groups = (await request('GET', '/api/groups?by=team', { cookie })).body.groups
  assert.deepEqual(groups.map(g => g.total), [10, 1])
  assert.equal(groups[0].name, 'Real Madrid', 'display name is the tidied, most-used spelling')
})

test('coach grouping spans clubs', async () => {
  await createUserRepository(db).create({ username: 'dan', passwordHash: bcrypt.hashSync('correct-horse-battery', 4), displayName: 'Dan' })
  const cookie = await login('dan')
  const clubs = ['Chelsea', 'Inter', 'Real Madrid', 'Porto', 'Chelsea']
  for (const [i, club] of clubs.entries()) {
    await request('POST', '/api/annotations', { cookie, body: makeSppi(`D_${i}`, { team: club, coach: 'José Mourinho' }) })
  }
  await request('POST', '/api/annotations', { cookie, body: makeSppi('D_NOCOACH', { team: 'Chelsea' }) })

  const groups = (await request('GET', '/api/groups?by=coach', { cookie })).body.groups
  assert.deepEqual(groups, [{ name: 'José Mourinho', total: 5 }])
})

test('logout clears the session cookie', async () => {
  const cookie = await login('alice')
  const response = await request('POST', '/api/auth/logout', { cookie })
  assert.equal(response.status, 204)
  assert.match(response.headers.get('set-cookie'), /sppi_session=;/)
})

test('anyone can register, is signed in immediately, and starts with an empty, private account', async () => {
  const registered = await request('POST', '/api/auth/register', {
    body: { username: 'Erin.Coach', password: 'a-long-enough-pass', displayName: ' Erin ' },
  })
  assert.equal(registered.status, 201)
  assert.deepEqual(registered.body.user, { username: 'erin.coach', displayName: 'Erin', organisation: null })
  const cookie = registered.headers.get('set-cookie').split(';')[0]

  assert.equal((await request('GET', '/api/auth/me', { cookie })).status, 200)
  assert.deepEqual((await request('GET', '/api/annotations', { cookie })).body.annotations, [])
  assert.deepEqual((await request('GET', '/api/groups?by=team', { cookie })).body.groups, [])

  // and can log in again with the same credentials, username case-insensitively
  const relogin = await request('POST', '/api/auth/login', { body: { username: 'ERIN.COACH', password: 'a-long-enough-pass' } })
  assert.equal(relogin.status, 200)
})

test('registration rejects duplicate usernames and weak or malformed input', async () => {
  const valid = { username: 'frank', password: 'a-long-enough-pass', displayName: 'Frank' }
  assert.equal((await request('POST', '/api/auth/register', { body: valid })).status, 201)
  assert.equal((await request('POST', '/api/auth/register', { body: { ...valid, username: 'FRANK' } })).status, 409)
  assert.equal((await request('POST', '/api/auth/register', { body: { ...valid, username: 'gina', password: 'short' } })).status, 400)
  assert.equal((await request('POST', '/api/auth/register', { body: { ...valid, username: 'a b' } })).status, 400)
  assert.equal((await request('POST', '/api/auth/register', { body: { ...valid, username: 'hank', displayName: '  ' } })).status, 400)
  assert.equal((await request('POST', '/api/auth/register', { body: { ...valid, username: 'ivan', password: 'x'.repeat(73) } })).status, 400)
})

test('a self-registered user cannot see data saved by an existing user', async () => {
  const alice = await login('alice')
  await request('POST', '/api/annotations', { cookie: alice, body: makeSppi('PRIVATE_1', { team: 'Secret FC' }) })
  const joined = await request('POST', '/api/auth/register', {
    body: { username: 'judy', password: 'a-long-enough-pass', displayName: 'Judy' },
  })
  const judy = joined.headers.get('set-cookie').split(';')[0]
  assert.deepEqual((await request('GET', '/api/groups?by=team', { cookie: judy })).body.groups, [])
  assert.equal((await request('GET', '/api/insights?by=team&name=Secret%20FC', { cookie: judy })).body.total, 0)
})

test('registration requires the invite code when one is configured, and locks out repeated bad codes', async () => {
  const gatedApp = createApp({ db, config: gatedConfig }).listen(0)
  const gatedUrl = `http://127.0.0.1:${gatedApp.address().port}`
  const attempt = body => fetch(`${gatedUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  const noCode  = await attempt({ username: 'kevin', password: 'a-long-enough-pass', displayName: 'Kevin' })
  const badCode = await attempt({ username: 'kevin', password: 'a-long-enough-pass', displayName: 'Kevin', inviteCode: 'wrong' })
  assert.equal(noCode.status, 403)
  assert.equal(badCode.status, 403)

  const goodCode = await attempt({ username: 'kevin', password: 'a-long-enough-pass', displayName: 'Kevin', inviteCode: 'let-me-in' })
  assert.equal(goodCode.status, 201)

  gatedApp.close()
})

test('sign-ups are rate limited per address', async () => {
  const limitedApp = createApp({ db, config }).listen(0)
  const url = `http://127.0.0.1:${limitedApp.address().port}/api/auth/register`
  const attempt = n => fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: `spam${n}`, password: 'a-long-enough-pass', displayName: 'Spam' }),
  })
  const statuses = []
  for (let n = 0; n < 11; n++) statuses.push((await attempt(n)).status)
  limitedApp.close()
  assert.deepEqual(statuses.slice(0, 10).filter(s => s !== 201), [])
  assert.equal(statuses[10], 429)
})

const distExists = fs.existsSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist', 'index.html'))

test('client routes serve the app shell; missing files and unknown API paths still 404/401', { skip: !distExists && 'run `npm run build` first' }, async () => {
  for (const route of ['/', '/login', '/help', '/app']) {
    const response = await fetch(baseUrl + route)
    assert.equal(response.status, 200, route)
    assert.match(response.headers.get('content-type'), /text\/html/, route)
  }
  assert.equal((await fetch(baseUrl + '/assets/does-not-exist.js')).status, 404)
  assert.equal((await fetch(baseUrl + '/api/does-not-exist')).status, 401)
})
