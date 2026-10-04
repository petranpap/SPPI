export async function up(db) {
  await db.schema.alterTable('annotations', table => {
    // Null until the first edit — lets History tell "saved" and "saved, then edited" apart.
    table.timestamp('updated_at', { useTz: true })
  })
}

export async function down(db) {
  await db.schema.alterTable('annotations', table => {
    table.dropColumn('updated_at')
  })
}
