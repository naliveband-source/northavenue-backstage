import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";
import { auth } from "../../../auth";
import crypto from "crypto";

function isCronAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[hubspot-sync] CRON_SECRET env var not set — cron auth disabled");
    return false;
  }
  const header = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

const HS_TOKEN = process.env.HUBSPOT_TOKEN;

// Sync lock — forhindrer dobbelt-sync når URL kaldes hurtigt flere gange
let syncInProgress = false;

const PROPS = [
  "dealname","closedate","city","adresse","afgang_true","ankomst",
  "musikstart","antal_s_t","amount","hubspot_owner_id","description",
  "deal_tag","alias_ansvarlig_1","alias_amount","alias_bil___gear",
  "alias_storrelse","kontaktperson_til_jobbet__alias_",
  "tele_pa_kontaktperson__alias_","dealstage"
].join(",");

const OWNER_MAP = {
  "299786470": "Magnus",
  "355884485": "Mox",
  "333603023": "Oliver",
};

async function fetchOwners() {
  try {
    const res = await fetch("https://api.hubapi.com/crm/v3/owners?limit=100", {
      headers: { Authorization: `Bearer ${HS_TOKEN}` }
    });
    const data = await res.json();
    (data.results || []).forEach(o => {
      if(!OWNER_MAP[String(o.id)]) {
        OWNER_MAP[String(o.id)] = `${o.firstName} ${o.lastName}`.trim();
      }
    });
  } catch(_) {}
}

async function fetchAllDeals() {
  let deals = [];
  let after = undefined;
  while(true) {
    const body = {
      filterGroups: [{
        filters: [{
          propertyName: "dealstage",
          operator: "EQ",
          value: "closedwon"
        }]
      }],
      properties: PROPS.split(","),
      limit: 100,
      ...(after ? { after } : {})
    };
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/deals/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    deals = deals.concat(data.results || []);
    if(!data.paging?.next?.after) break;
    after = data.paging.next.after;
  }
  return deals;
}

function formatDate(ts) {
  if(!ts) return null;
  return new Date(ts).toISOString().split("T")[0];
}

function cleanDealName(raw) {
  if(!raw) return "";
  return raw
    .replace(/^NA Alias\s*/i, "")
    .replace(/^North Avenue\s*/i, "")
    .replace(/^NA\s*/i, "")
    .replace(/^[-\s]+/, "")
    .trim();
}

// Looks up an alias manager's user id by their full name from HubSpot.
// Returns user id string on match, null if not found.
// stats object (total/matched/unmatched/ambiguous) is mutated in place.
async function lookupAliasManagerId(fullName, stats) {
  if (!fullName?.trim()) return null;

  stats.total++;
  const normalized = fullName.trim().replace(/\s+/g, " ");

  const rows = await sql`
    SELECT id, first, last
    FROM users
    WHERE LOWER(TRIM(first || ' ' || last)) = LOWER(${normalized})
      AND tags LIKE '%alias_manager%'
      AND (archived = false OR archived IS NULL)
    LIMIT 2
  `;

  if (rows.length === 0) {
    console.warn("[alias-lookup] no match for:", fullName);
    stats.unmatched++;
    return null;
  }
  if (rows.length === 2) {
    console.warn("[alias-lookup] ambiguous match for:", fullName, "— picking first");
    stats.ambiguous++;
    stats.matched++;
    return rows[0].id;
  }
  stats.matched++;
  return rows[0].id;
}

export async function GET(req) {
  if (isCronAuthorized(req)) {
    console.log("[hubspot-sync] auth via: cron");
  } else {
    const session = await auth();
    if (!session?.user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.log("[hubspot-sync] auth via: session");
  }
  if(syncInProgress) {
    return NextResponse.json({ ok: false, error: "Sync allerede i gang — prøv igen om lidt." }, { status: 429 });
  }
  syncInProgress = true;

  try {
    await fetchOwners();
    const deals = await fetchAllDeals();

    const originalCount = deals.length;
    const filteredDeals = deals.filter(d => d.properties?.dealstage === "closedwon");
    console.log(`Filtered ${originalCount} deals down to ${filteredDeals.length} closedwon deals`);

    const stageCounts = {};
    deals.forEach(d => {
      const s = d.properties?.dealstage || "missing";
      stageCounts[s] = (stageCounts[s] || 0) + 1;
    });

    const activeMusicians = await sql`
      SELECT musician_id
      FROM users
      WHERE (archived = false OR archived IS NULL)
        AND musician_id IS NOT NULL
        AND tags LIKE '%musiker%'
      ORDER BY display_order ASC NULLS LAST, musician_id ASC
    `;
    const defaultMemberIds = JSON.stringify(activeMusicians.map(u => u.musician_id));
    console.log("[hubspot-sync] default member_ids for new bookings:", defaultMemberIds);

    let naCount = 0;
    let aliasCount = 0;
    let skipped = 0;
    const unknownOwners = {};
    const ownerCounts = {};
    const lookupStats = { total: 0, matched: 0, unmatched: 0, ambiguous: 0 };

    for(const deal of filteredDeals) {
      const p = deal.properties;
      const date = formatDate(p.closedate);
      const hsId = "hs_" + String(deal.id);
      const ownerId = String(p.hubspot_owner_id || "");
      const booker = OWNER_MAP[ownerId] || "";

      if(ownerId) {
        ownerCounts[ownerId] = (ownerCounts[ownerId] || 0) + 1;
        if(!OWNER_MAP[ownerId]) {
          unknownOwners[ownerId] = (unknownOwners[ownerId] || 0) + 1;
        }
      }

      if(!date) { skipped++; continue; }

      const tag = (p.deal_tag || "").toLowerCase();
      const isAlias = tag.includes("alias");

      if(isAlias) {
        const managerUserId = await lookupAliasManagerId(p.alias_ansvarlig_1, lookupStats);

        const existingAlias = await sql`SELECT archived FROM alias_bookings WHERE hs_id = ${hsId}`;
        if(existingAlias[0]?.archived) { skipped++; continue; }

        await sql`
          INSERT INTO alias_bookings (
            hs_id, manager_user_id, date, type, city, address,
            arrival, play_time, sets, musicians,
            band_pay, booking_fee, car_gear,
            contact, phone, booker, notes
          ) VALUES (
            ${hsId}, ${managerUserId}, ${date},
            ${cleanDealName(p.dealname)},
            ${p.city || ""},
            ${p.adresse || ""},
            ${p.ankomst || ""},
            ${p.musikstart || ""},
            ${p.antal_s_t || ""},
            ${parseInt(p.alias_storrelse) || 0},
            ${parseFloat(p.alias_amount) || 0},
            ${parseFloat(p.amount) || 0},
            ${p.alias_bil___gear === "ja" || p.alias_bil___gear === "Ja" || p.alias_bil___gear === "true"},
            ${p.kontaktperson_til_jobbet__alias_ || ""},
            ${p.tele_pa_kontaktperson__alias_ || ""},
            ${booker},
            ${p.description || ""}
          )
          ON CONFLICT (hs_id) DO UPDATE SET
            manager_user_id = EXCLUDED.manager_user_id,
            date            = EXCLUDED.date,
            type            = EXCLUDED.type,
            city            = EXCLUDED.city,
            address         = EXCLUDED.address,
            arrival         = EXCLUDED.arrival,
            play_time       = EXCLUDED.play_time,
            sets            = EXCLUDED.sets,
            musicians       = EXCLUDED.musicians,
            band_pay        = EXCLUDED.band_pay,
            booking_fee     = EXCLUDED.booking_fee,
            car_gear        = EXCLUDED.car_gear,
            contact         = EXCLUDED.contact,
            phone           = EXCLUDED.phone,
            booker          = EXCLUDED.booker
        `;
        aliasCount++;

      } else {
        const existingBooking = await sql`SELECT archived FROM bookings WHERE hs_id = ${hsId}`;
        if(existingBooking[0]?.archived) { skipped++; continue; }

        await sql`
          INSERT INTO bookings (
            hs_id, date, departure, arrival, type, city, address,
            play_time, sets, band_pay, booker, notes,
            member_ids, substitute_ids
          ) VALUES (
            ${hsId}, ${date},
            ${p.afgang_true || ""},
            ${p.ankomst || ""},
            ${cleanDealName(p.dealname)},
            ${p.city || ""},
            ${p.adresse || ""},
            ${p.musikstart || ""},
            ${p.antal_s_t || ""},
            ${parseFloat(p.amount) || 0},
            ${booker},
            ${p.description || ""},
            ${defaultMemberIds}, ${"[]"}
          )
          ON CONFLICT (hs_id) DO UPDATE SET
            date      = EXCLUDED.date,
            departure = EXCLUDED.departure,
            arrival   = EXCLUDED.arrival,
            type      = EXCLUDED.type,
            city      = EXCLUDED.city,
            address   = EXCLUDED.address,
            play_time = EXCLUDED.play_time,
            sets      = EXCLUDED.sets,
            band_pay  = EXCLUDED.band_pay,
            booker    = EXCLUDED.booker
        `;
        naCount++;
      }
    }

    console.log("[hubspot-sync] alias-manager lookups:", lookupStats);

    // Cross-table cleanup: a hs_id must live in at most one table at a time.
    // If a deal was moved between pipelines in HubSpot, archive it in the old table.
    const crossCleanBookings = await sql`
      UPDATE bookings
      SET archived = true, archived_at = NOW()
      WHERE archived = false
        AND hs_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM alias_bookings a
          WHERE a.hs_id = bookings.hs_id AND a.archived = false
        )
      RETURNING hs_id
    `;
    if (crossCleanBookings.length > 0)
      console.log("[sync] cross-cleanup: archived", crossCleanBookings.length, "booking(s) moved to alias:", crossCleanBookings.map(r => r.hs_id));

    const crossCleanAlias = await sql`
      UPDATE alias_bookings
      SET archived = true, archived_at = NOW()
      WHERE archived = false
        AND hs_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.hs_id = alias_bookings.hs_id AND b.archived = false
        )
      RETURNING hs_id
    `;
    if (crossCleanAlias.length > 0)
      console.log("[sync] cross-cleanup: archived", crossCleanAlias.length, "alias booking(s) moved to bookings:", crossCleanAlias.map(r => r.hs_id));

    // Auto-archive stale HubSpot rows that are no longer in closedwon
    const debug = { originalCount, closedwonCount: filteredDeals.length, stageCounts };
    const currentHsIds = filteredDeals.map(d => "hs_" + String(d.id));
    if(currentHsIds.length > 0) {
      const staleBookings = await sql`
        UPDATE bookings
        SET archived = true, archived_at = NOW()
        WHERE hs_id LIKE 'hs_%'
          AND archived = false
          AND NOT (hs_id = ANY(${currentHsIds}))
        RETURNING hs_id
      `;
      const staleAlias = await sql`
        UPDATE alias_bookings
        SET archived = true, archived_at = NOW()
        WHERE hs_id LIKE 'hs_%'
          AND archived = false
          AND NOT (hs_id = ANY(${currentHsIds}))
        RETURNING hs_id
      `;
      debug.autoArchived = {
        bookings: staleBookings.length,
        alias: staleAlias.length,
        crossCleanBookings: crossCleanBookings.length,
        crossCleanAlias: crossCleanAlias.length,
      };
    }

    return NextResponse.json({
      ok: true,
      total: filteredDeals.length,
      synced: { northAvenue: naCount, alias: aliasCount, skipped },
      debug,
      owners: {
        mapped: OWNER_MAP,
        usage: ownerCounts,
        unknownIds: unknownOwners,
      },
      aliasManagerLookups: lookupStats,
    });

  } catch(e) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  } finally {
    syncInProgress = false;
  }
}
