import { sql } from "drizzle-orm";

import { db } from "@/db";

export type DraftPollState = {
  user_id: string;
  role: "user" | "organizer";
  participant_id: string | null;
  session_id: string | null;
  needs_reconciliation: boolean;
  revision: string | null;
};

// One small HTTP result for the common unchanged poll. Authorization is read
// fresh every time. PostgreSQL fingerprints the board's mutable data so team
// repairs, profile edits and soft deletion invalidate it too, not just picks.
export async function getDraftPollState(userId: string, executor: Pick<typeof db, "execute"> = db) {
  const result = await executor.execute<DraftPollState>(sql`
    select u.id as user_id, u.role, p.id as participant_id, s.id as session_id,
      coalesce(
        (s.status = 'active' and s.turn_ends_at <= now()) or
        (s.status = 'needs_repair' and not exists (
          select 1 from draft_session_teams dst
          left join team_members tm on tm.team_id = dst.team_id
          where dst.session_id = s.id
          group by dst.id having count(tm.id) < 5
        )), false
      ) as needs_reconciliation,
      case when s.id is not null and p.id is not null then md5(concat_ws('|',
        row_to_json(s)::text, u.id::text, u.role::text, r.id::text,
        (select jsonb_agg(jsonb_build_array(id, display_name, avatar_url, deleted_at)
          order by id)::text from users),
        (select jsonb_agg(jsonb_build_array(id, participant_id, riot_name, riot_tag,
          current_rank, approved_tier, tier_status, primary_role, secondary_role)
          order by id)::text from player_registrations),
        (select jsonb_agg(jsonb_build_array(id, name, status) order by id)::text from teams),
        (select jsonb_agg(jsonb_build_array(id, team_id, registration_id, is_captain,
          lineup_position, starter_role, joined_at) order by id)::text from team_members),
        (select jsonb_agg(row_to_json(dst) order by dst.order_index)::text
          from draft_session_teams dst where dst.session_id = s.id)
      )) end as revision
    from users u
    left join tournament_participants p on p.user_id = u.id
    left join player_registrations r on r.participant_id = p.id
    left join lateral (select * from draft_sessions order by created_at desc limit 1) s on true
    where u.id = ${userId} and u.deleted_at is null
  `);
  return result.rows[0] ?? null;
}
