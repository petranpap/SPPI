import { test } from 'node:test'
import assert from 'node:assert/strict'
import en from '../../src/i18n/en.js'
import el from '../../src/i18n/el.js'

const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
const linkTargets  = text => [...text.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1])
const boldCount    = text => (text.match(/\*\*/g) ?? []).length

// Walks both dictionaries together and records every way the translation drifts from the English source.
function compare(source, translation, path, problems) {
  if (typeof source === 'function') {
    if (typeof translation !== 'function') problems.push(`${path}: should be a function`)
    return
  }
  if (typeof source === 'string') {
    if (typeof translation !== 'string') return problems.push(`${path}: should be a string`)
    if (!translation.trim()) problems.push(`${path}: is empty`)
    const wanted = placeholders(source).join()
    if (placeholders(translation).join() !== wanted) problems.push(`${path}: placeholders differ (en: {${wanted}})`)
    if (linkTargets(translation).join() !== linkTargets(source).join()) problems.push(`${path}: link targets differ`)
    if (boldCount(translation) !== boldCount(source)) problems.push(`${path}: **bold** markers differ`)
    return
  }
  if (Array.isArray(source)) {
    if (!Array.isArray(translation) || translation.length !== source.length) {
      return problems.push(`${path}: should be a list of ${source.length}`)
    }
    source.forEach((item, index) => compare(item, translation[index], `${path}[${index}]`, problems))
    return
  }
  if (typeof translation !== 'object' || translation === null) return problems.push(`${path}: should be an object`)
  for (const key of Object.keys(source)) {
    if (!(key in translation)) problems.push(`${path}.${key}: missing`)
    else compare(source[key], translation[key], `${path}.${key}`, problems)
  }
  for (const key of Object.keys(translation)) {
    if (!(key in source)) problems.push(`${path}.${key}: not in the English dictionary`)
  }
}

test('the Greek dictionary defines exactly the keys the English one does', () => {
  const problems = []
  compare(en, el, 'el', problems)
  assert.deepEqual(problems, [])
})

test('function entries return text in both languages', () => {
  const samples = {
    'app.eventsRecorded': { n: 3 },
    'insights.cornerCount': { n: 2 },
    'insights.lockedTitle': { n: 1 },
    'insights.hiddenCombos': { n: 2 },
    'insights.mostFrequent': { leaders: 'X', top: 6, total: 10, tie: true },
    'insights.comboSentence.sentence': { count: 5, total: 10, subject: 'S', clause: 'C', phrase: 'P' },
    'insights.rowSentence.zone': { count: 5, total: 10, label: 'L' },
    'insights.rowSentence.delivery': { count: 5, total: 10, label: 'L' },
  }
  for (const [key, vars] of Object.entries(samples)) {
    for (const [name, dictionary] of [['en', en], ['el', el]]) {
      const fn = key.split('.').reduce((node, part) => node[part], dictionary)
      const text = fn(vars)
      assert.ok(typeof text === 'string' && text.length > 0 && !text.includes('undefined'), `${name}:${key} -> ${text}`)
    }
  }
})

test('every error code the server can send has a message in both languages', async () => {
  const fs = await import('node:fs')
  const files = ['app.js', 'auth.js', 'accountRules.js', 'routes/auth.js', 'routes/annotations.js', 'routes/insights.js']
  const source = files.map(file => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')).join('\n')
  const codes = new Set([
    ...[...source.matchAll(/sendError\([^,]+,\s*\d+,\s*'([a-z_]+)'/g)].map(match => match[1]),
    ...[...source.matchAll(/code:\s*'([a-z_]+)'/g)].map(match => match[1]),
  ])
  assert.ok(codes.size >= 10, `expected the server to declare error codes, found ${codes.size}`)
  for (const code of codes) {
    assert.ok(en.errors[code], `en.errors.${code} missing`)
    assert.ok(el.errors[code], `el.errors.${code} missing`)
  }
})
