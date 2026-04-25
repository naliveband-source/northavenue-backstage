import { sql } from './db';

export async function syncEnrollment(musicianId, oldTags, newTags) {
  if (!musicianId) return { added: 0, removed: 0 };

  const hadMusiker = (oldTags || []).includes('musiker');
  const hadVikar   = (oldTags || []).includes('vikar');
  const hasMusiker = (newTags || []).includes('musiker');
  const hasVikar   = (newTags || []).includes('vikar');

  if (hadMusiker === hasMusiker && hadVikar === hasVikar) return { added: 0, removed: 0 };

  // Derived intent flags from transition table
  const addToMembers     = !hadMusiker && hasMusiker;
  const removeFromMembers = hadMusiker && !hasMusiker;
  const removeFromSubs   = hadVikar && !hasVikar;

  const bookings = await sql`
    SELECT id, member_ids, substitute_ids
    FROM bookings
    WHERE date::date >= CURRENT_DATE AND (archived = false OR archived IS NULL)
  `;

  let added = 0, removed = 0;
  for (const b of bookings) {
    let memberIds    = JSON.parse(b.member_ids    || '[]');
    let substituteIds = JSON.parse(b.substitute_ids || '[]');
    let changed = false;

    if (addToMembers && !memberIds.includes(musicianId)) {
      memberIds.push(musicianId); changed = true; added++;
    }
    if (removeFromMembers && memberIds.includes(musicianId)) {
      memberIds = memberIds.filter(x => x !== musicianId); changed = true; removed++;
    }
    if (removeFromSubs && substituteIds.includes(musicianId)) {
      substituteIds = substituteIds.filter(x => x !== musicianId); changed = true;
    }

    if (changed) {
      await sql`
        UPDATE bookings
        SET member_ids    = ${JSON.stringify(memberIds)},
            substitute_ids = ${JSON.stringify(substituteIds)}
        WHERE id = ${b.id}
      `;
    }
  }

  console.log('[enrollment]', musicianId, oldTags, '→', newTags, 'added to', added, 'removed from', removed);
  return { added, removed };
}
