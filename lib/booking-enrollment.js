import { sql } from './db';

export async function syncEnrollment(musicianId, oldTags, newTags) {
  if (!musicianId) return { added: 0, removed: 0 };

  const hadMusiker = (oldTags || []).includes('musiker');
  const hadVikar   = (oldTags || []).includes('vikar');
  const hasMusiker = (newTags || []).includes('musiker');
  const hasVikar   = (newTags || []).includes('vikar');

  if (hadMusiker === hasMusiker && hadVikar === hasVikar) return { added: 0, removed: 0 };

  const addToMembers      = !hadMusiker && hasMusiker;
  const removeFromMembers = hadMusiker && !hasMusiker;
  const removeFromSubs    = hadVikar && !hasVikar;

  const mid     = JSON.stringify([musicianId]);  // e.g. "[42]"
  const midStr  = String(musicianId);            // e.g. "42"

  try {
    let added = 0, removed = 0;

    if (addToMembers) {
      const rows = await sql`
        UPDATE bookings
        SET member_ids = (COALESCE(member_ids, '[]')::jsonb || ${mid}::jsonb)::text
        WHERE date::date >= CURRENT_DATE
          AND (archived = false OR archived IS NULL)
          AND NOT COALESCE(member_ids, '[]')::jsonb @> ${mid}::jsonb
        RETURNING id
      `;
      added = rows.length;
    }

    if (removeFromMembers) {
      const rows = await sql`
        UPDATE bookings
        SET member_ids = (
          SELECT COALESCE(jsonb_agg(val), '[]'::jsonb)::text
          FROM jsonb_array_elements(COALESCE(member_ids, '[]')::jsonb) val
          WHERE val::text != ${midStr}
        )
        WHERE date::date >= CURRENT_DATE
          AND (archived = false OR archived IS NULL)
          AND COALESCE(member_ids, '[]')::jsonb @> ${mid}::jsonb
        RETURNING id
      `;
      removed = rows.length;
    }

    if (removeFromSubs) {
      await sql`
        UPDATE bookings
        SET substitute_ids = (
          SELECT COALESCE(jsonb_agg(val), '[]'::jsonb)::text
          FROM jsonb_array_elements(COALESCE(substitute_ids, '[]')::jsonb) val
          WHERE val::text != ${midStr}
        )
        WHERE date::date >= CURRENT_DATE
          AND (archived = false OR archived IS NULL)
          AND COALESCE(substitute_ids, '[]')::jsonb @> ${mid}::jsonb
      `;
    }

    if (hadMusiker && hasVikar) {
      console.log('[enrollment] musiker→vikar: removed from', removed, 'future bookings member_ids');
    }
    console.log('[enrollment] success:', { musicianId, oldTags, newTags, added, removed });
    return { added, removed };
  } catch (error) {
    console.error('[enrollment] failed:', error);
    throw error;
  }
}
