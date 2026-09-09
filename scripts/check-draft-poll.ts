// Real SQL checks isolated in a transaction that always rolls back.
import assert from "node:assert/strict";
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local", quiet: true });

async function main() {
  assert.equal(new URL(process.env.DATABASE_URL!).pathname, "/wr-test");
  const { db } = await import("../db");
  const { getDraftPollState } = await import("../lib/draft-poll-data");
  const rollback = new Error("rollback verification changes");
  try {
    await db.transaction(async (tx) => {
      const result = await tx.execute<{ id: string }>(sql`
        select u.id from users u join tournament_participants p on p.user_id = u.id
        where u.deleted_at is null limit 1
      `);
      const userId = result.rows[0]?.id;
      assert.ok(userId);
      const before = await getDraftPollState(userId, tx);
      assert.ok(before?.revision);
      assert.equal(before.needs_reconciliation, false);
      await tx.execute(sql`update users set display_name = display_name || ' revision check' where id = ${userId}`);
      const edited = await getDraftPollState(userId, tx);
      assert.notEqual(edited?.revision, before.revision, "Profile edits must invalidate the board.");
      await tx.execute(sql`update users set role = (case when role = 'user' then 'organizer' else 'user' end)::account_role where id = ${userId}`);
      const changedRole = await getDraftPollState(userId, tx);
      assert.notEqual(changedRole?.role, before.role, "Role checks must use current database values.");
      assert.notEqual(changedRole?.revision, edited?.revision);
      await tx.execute(sql`update draft_sessions set status = 'active', turn_ends_at = now() - interval '1 second' where id = ${before.session_id}`);
      assert.equal((await getDraftPollState(userId, tx))?.needs_reconciliation, true, "Expired turns must bypass 304.");
      await tx.execute(sql`update users set deleted_at = now() where id = ${userId}`);
      assert.equal(await getDraftPollState(userId, tx), null, "Deleted users must lose access immediately.");
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  console.log("PASS revision invalidation, live roles, expired-turn detection and soft deletion; all changes rolled back");
}

main().catch((error) => {
  console.error("Draft polling SQL check failed; transaction rolled back. Inspect assertions without logging database credentials.");
  console.error(error instanceof assert.AssertionError ? error.message : { name: error.name, code: error.cause?.code ?? error.code, databaseMessage: error.cause?.routine });
  process.exitCode = 1;
});
