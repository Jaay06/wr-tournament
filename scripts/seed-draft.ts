import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local", quiet: true });

// Run with: pnpm exec tsx scripts/seed-draft.ts --apply
// Dummy accounts have no password. Use organizer controls to pick for them.
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || new URL(url).pathname !== "/wr-test") {
    throw new Error("This seed only runs against the wr-test database.");
  }
  const sql = neon(url);
  const [database] = await sql`select current_database() as name`;
  if (database.name !== "wr-test") throw new Error("Unexpected database.");

  const names = ["Test Inferno", "Test Tempest", "Test Eclipse", "Test Frost", "Test Nova", "Test Abyss"];
  const roles = ["Baron", "Jungle", "Mid", "Dragon", "Support"];
  const existing = await sql`select id from users where email like '%@draft-seed.invalid'`;
  if (existing.length) throw new Error("Dummy players already exist. Refusing to duplicate or reset draft progress.");
  const collisions = await sql`select name from teams where name = any(${names})`;
  if (collisions.length) throw new Error("A seed team name already exists.");
  const live = await sql`select id from draft_sessions where status in ('active', 'paused', 'needs_repair')`;
  if (live.length) throw new Error("Finish the live draft before seeding another pool.");

  const queries = [];
  for (let index = 0; index < 30; index++) {
    const captain = index < 6;
    const tier = captain ? "T4" : index < 12 ? "T1" : index < 24 ? "T2" : "T3";
    const rank = { T1: "Challenger", T2: "Master", T3: "Diamond", T4: "Emerald" }[tier];
    const number = String(captain ? index + 1 : index - 5).padStart(2, "0");
    const name = captain ? `Test Captain ${number}` : `Test Player ${number}`;
    const email = `${captain ? "captain" : "player"}${number}@draft-seed.invalid`;
    const userId = randomUUID();
    const participantId = randomUUID();
    const registrationId = randomUUID();
    const primary = roles[index % roles.length];
    const secondary = roles[(index + 1) % roles.length];
    queries.push(sql`insert into users (id,email,display_name) values (${userId},${email},${name})`);
    queries.push(sql`insert into tournament_participants (id,user_id) values (${participantId},${userId})`);
    queries.push(sql`insert into player_registrations
      (id,participant_id,riot_name,riot_tag,current_rank,self_assessed_tier,approved_tier,tier_status,primary_role,secondary_role)
      values (${registrationId},${participantId},${name},'TEST',${rank},${tier},${tier},'approved',${primary},${secondary})`);
    if (captain) {
      const teamId = randomUUID();
      queries.push(sql`insert into teams (id,name) values (${teamId},${names[index]})`);
      queries.push(sql`insert into team_members (team_id,registration_id,is_captain,lineup_position,starter_role)
        values (${teamId},${registrationId},true,'starter',${primary})`);
    }
  }
  if (!process.argv.includes("--apply")) {
    console.log("Ready to add 6 captain-only teams and 24 approved free agents to wr-test. Pass --apply to insert.");
    return;
  }
  // All inserts commit together. Existing accounts, settings and rosters are untouched.
  await sql.transaction(queries);
  console.log(JSON.stringify(await sql`select t.name, count(m.id)::int as members,
    count(m.id) filter (where m.is_captain)::int as captains
    from teams t join team_members m on m.team_id=t.id
    where t.name = any(${names}) group by t.name order by t.name`, null, 2));
  console.log(JSON.stringify(await sql`select r.approved_tier, count(*)::int as free_agents
    from player_registrations r join tournament_participants p on p.id=r.participant_id
    join users u on u.id=p.user_id left join team_members m on m.registration_id=r.id
    where u.email like '%@draft-seed.invalid' and m.id is null
    group by r.approved_tier order by r.approved_tier`, null, 2));
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Seed failed.");
  process.exitCode = 1;
});
