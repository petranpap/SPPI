// Administrator tool: create an account, or reset a password. (Users normally sign up themselves in the app.)
//   npm run create-user -- --username maria --name "Maria K." [--organisation "AEK"] [--password ...]
//   npm run create-user -- --username maria --reset          (set a new password)
// Without --password the script prompts for it, hidden.
import readline from 'node:readline'
import { parseArgs } from 'node:util'
import bcrypt from 'bcryptjs'
import { config } from '../config.js'
import { createDb, migrateToLatest } from '../db.js'
import { createUserRepository } from '../repositories/userRepository.js'
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '../accountRules.js'

function promptHidden(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    const write = rl._writeToOutput
    rl._writeToOutput = text => { if (text.includes(question)) write.call(rl, text) }
    rl.question(question, answer => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
  })
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

const { values } = parseArgs({
  options: {
    username:     { type: 'string' },
    name:         { type: 'string' },
    organisation: { type: 'string' },
    password:     { type: 'string' },
    reset:        { type: 'boolean', default: false },
  },
})

if (!values.username) fail('--username is required')
if (!values.reset && !values.name) fail('--name (display name) is required for a new account')

const password = values.password ?? await promptHidden('Password: ')
if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
  fail(`Password must be ${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD_LENGTH} characters`)
}

const db = createDb(config.database)
await migrateToLatest(db)
const userRepository = createUserRepository(db)
const passwordHash = await bcrypt.hash(password, 12)

if (values.reset) {
  const updated = await userRepository.updatePasswordHash(values.username, passwordHash)
  if (!updated) fail(`No such user: ${values.username}`)
  console.log(`Password updated for ${values.username}`)
} else {
  if (await userRepository.findByUsername(values.username)) fail(`User already exists: ${values.username}`)
  await userRepository.create({
    username:     values.username,
    passwordHash,
    displayName:  values.name,
    organisation: values.organisation,
  })
  console.log(`Created user ${values.username}`)
}
await db.destroy()
