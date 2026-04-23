import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.hubapi.com/crm/v3/objects/deals?limit=1&properties=&associations=",
      { headers: { Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}` } }
    );
    const data = await res.json();

    // Fetch all available deal properties
    const propsRes = await fetch(
      "https://api.hubapi.com/crm/v3/properties/deals",
      { headers: { Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}` } }
    );
    const props = await propsRes.json();

    return NextResponse.json({
      sampleDeal: data.results?.[0] || null,
      allProperties: props.results?.map(p => ({
        name: p.name,
        label: p.label,
        type: p.type,
      })) || [],
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}