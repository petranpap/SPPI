export async function up(db) {
  await db.schema.createTable('users', table => {
    table.increments('id')
    table.string('username').notNullable().unique()
    table.string('password_hash').notNullable()
    table.string('display_name').notNullable()
    table.string('organisation')
    table.timestamp('created_at', { useTz: true }).notNullable()
  })

  await db.schema.createTable('annotations', table => {
    table.increments('id')
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('sppi_id').notNullable()
    table.string('match_id').notNullable()
    table.string('attacking_team').notNullable()
    table.string('attacking_team_key').notNullable()
    table.string('attacking_coach')
    table.string('attacking_coach_key')
    table.json('payload').notNullable()
    table.timestamp('created_at', { useTz: true }).notNullable()

    table.unique(['user_id', 'sppi_id'])
    table.index(['user_id', 'attacking_team_key'])
    table.index(['user_id', 'attacking_coach_key'])
    table.index(['user_id', 'created_at'])
  })
}

export async function down(db) {
  await db.schema.dropTable('annotations')
  await db.schema.dropTable('users')
}
