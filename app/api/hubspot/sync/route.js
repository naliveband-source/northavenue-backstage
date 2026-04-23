import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

const HS_TOKEN = process.env.HUBSPOT_TOKEN;

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

let syncInProgress = false;

async function fetchOwners() {
  // Try to fetch additional owners from HubSpot and merge
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
    const url = `https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=${PROPS}${after ? `&after=${after}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${HS_TOKEN}` } });
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

function matchAliasManager(raw) {
  if(!raw) return null;
  const val = raw.toLowerCase();
  if(val.includes("niklas"))                                                               return "ua1";
  if(val.includes("mikkelsen"))                                                            return "ua2";
  if(val.includes("lasse")  || val.includes("herold"))                                    return "ua3";
  if(val.includes("jacob")  || val.includes("nørregaard") || val.includes("norregaard"))  return "ua4";
  if(val.includes("sjabon"))                                                               return "ua5";
  return null;
}

export async function GET() {
  if (syncInProgress) {
    return NextResponse.json({ error: "Sync allerede i gang" }, { status: 429 });
  }
  syncInProgress = true;
  try {
    await fetchOwners();
    const deals = await fetchAllDeals();

    let naCount = 0;
    let aliasCount = 0;
    let skipped = 0;

    for(const deal of deals) {
      const p = deal.properties;
      const date = formatDate(p.closedate);
      const hsId = "hs_" + String(deal.id);
      const booker = OWNER_MAP[String(p.hubspot_owner_id)] || "";

      if(!date) { skipped++; continue; }

      const tag = (p.deal_tag || "").toLowerCase();
      const isAlias = tag.includes("alias");

      if(isAlias) {
        const managerId = matchAliasManager(p.alias_ansvarlig_1);
        if(!managerId) { skipped++; continue; }

        await sql`DELETE FROM alias_bookings WHERE hs_id = ${hsId}`;
        await sql`
          INSERT INTO alias_bookings (
            hs_id, manager_user_id, date, type, city, address,
            arrival, play_time, sets, musicians,
            band_pay, booking_fee, car_gear,
            contact, phone, booker, notes
          ) VALUES (
            ${hsId}, ${managerId}, ${date},
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
        `;
        aliasCount++;

      } else {
        await sql`DELETE FROM bookings WHERE hs_id = ${hsId}`;
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
            ${"[1,2,3,4,5,6]"}, ${"[]"}
          )
        `;
        naCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      total: deals.length,
      synced: { northAvenue: naCount, alias: aliasCount, skipped }
    });

  } catch(e) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  } finally {
    syncInProgress = false;
  }
}
