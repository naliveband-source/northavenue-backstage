import { sql } from "../../../../lib/db";

const CRLF = '\r\n';

function icsEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function parseTimeStart(playTime, arrival) {
  if (playTime) {
    const m = playTime.match(/(\d{1,2}):(\d{2})/);
    if (m) return { h: parseInt(m[1]), m: parseInt(m[2]) };
  }
  if (arrival) {
    const m = arrival.match(/(\d{1,2}):(\d{2})/);
    if (m) return { h: parseInt(m[1]), m: parseInt(m[2]) };
  }
  return { h: 20, m: 0 };
}

function parseTimeEnd(playTime) {
  if (!playTime) return null;
  // Match the end time after an en-dash or hyphen: "21:00–01:00" or "21:00-01:00"
  const m = playTime.match(/\d{1,2}:\d{2}[–\-](\d{1,2}):(\d{2})/);
  if (!m) return null;
  return { h: parseInt(m[1]), m: parseInt(m[2]) };
}

function formatICSLocalDT(dateStr, h, m) {
  const d = dateStr.replace(/-/g, '');
  return `${d}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
}

function nextDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0];
}

function buildEventTimes(dateStr, playTime, arrival) {
  const start = parseTimeStart(playTime, arrival);
  const startDT = formatICSLocalDT(dateStr, start.h, start.m);

  const endTime = parseTimeEnd(playTime);
  let endDT;
  if (endTime) {
    const endBeforeStart = endTime.h < start.h || (endTime.h === start.h && endTime.m < start.m);
    endDT = formatICSLocalDT(endBeforeStart ? nextDay(dateStr) : dateStr, endTime.h, endTime.m);
  } else {
    const totalMin = start.h * 60 + start.m + 180;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    endDT = formatICSLocalDT(start.h + 3 >= 24 ? nextDay(dateStr) : dateStr, endH, endM);
  }

  return { startDT, endDT };
}

function nowUTC() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

function buildVEVENT(b, prefix = '') {
  const { startDT, endDT } = buildEventTimes(b.date, b.play_time, b.arrival);
  const descParts = [
    `Ankomst ${b.arrival || '—'}`,
    `Spilletid ${b.play_time || '—'}`,
    `Sæt ${b.sets || '—'}`,
    `Booker ${b.booker || '—'}`,
  ];
  if (b.notes) descParts.push('', b.notes);

  return [
    'BEGIN:VEVENT',
    `UID:booking-${b.id}@backstage.northavenue.dk`,
    `DTSTAMP:${nowUTC()}`,
    `DTSTART;TZID=Europe/Copenhagen:${startDT}`,
    `DTEND;TZID=Europe/Copenhagen:${endDT}`,
    `SUMMARY:${icsEscape(`${prefix}${b.type} — ${b.city}`)}`,
    `LOCATION:${icsEscape(`${b.address || ''}, ${b.city}`)}`,
    `DESCRIPTION:${icsEscape(descParts.join('\n'))}`,
    'END:VEVENT',
  ].join(CRLF);
}

export async function GET(request, { params }) {
  const { token } = await params;

  try {
    const userRows = await sql`SELECT * FROM users WHERE calendar_token = ${token} LIMIT 1`;
    const user = userRows[0];

    if (!user || user.archived) {
      return new Response('Calendar not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const filter = user.calendar_filter || 'own';
    const musicianId = user.musician_id;
    const userTags = JSON.parse(user.tags || '[]');
    const isAliasManager = userTags.includes('alias_manager');

    let bookings = [];
    if (filter === 'all') {
      bookings = await sql`SELECT * FROM bookings WHERE (archived = false OR archived IS NULL) ORDER BY date`;
    } else if (musicianId != null) {
      const rows = await sql`SELECT * FROM bookings WHERE (archived = false OR archived IS NULL) ORDER BY date`;
      bookings = rows.filter(b => {
        const memberIds = JSON.parse(b.member_ids || '[]');
        const substituteIds = JSON.parse(b.substitute_ids || '[]');
        return memberIds.includes(musicianId) || substituteIds.includes(musicianId);
      });
    }

    let aliasBookings = [];
    if (isAliasManager) {
      aliasBookings = await sql`
        SELECT * FROM alias_bookings
        WHERE (archived = false OR archived IS NULL) AND manager_user_id = ${user.id}
        ORDER BY date`;
    }

    const parts = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//North Avenue//Backstage//DA',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:North Avenue Jobs',
      'X-WR-TIMEZONE:Europe/Copenhagen',
      ...bookings.map(b => buildVEVENT(b)),
      ...aliasBookings.map(b => buildVEVENT(b, '[ALIAS] ')),
      'END:VCALENDAR',
    ];

    return new Response(parts.join(CRLF) + CRLF, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e) {
    return new Response('Internal error', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}
