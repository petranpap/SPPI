import { config } from './config.js'
import { createDb, migrateToLatest } from './db.js'
import { createApp } from './app.js'

const db = createDb(config.database)
await migrateToLatest(db)

createApp({ db, config }).listen(config.port, config.host, () => {
  console.log(`SPPI server listening on http://${config.host}:${config.port}`)
})
