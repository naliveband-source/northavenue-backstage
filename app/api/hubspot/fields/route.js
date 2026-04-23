import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.hubapi.com/crm/v3/pipelines/deals",
      { headers: { Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}` } }
    );
    const data = await res.json();
    const stages = data.results?.flatMap(p =>
      p.stages.map(s => ({
        pipelineLabel: p.label,
        stageId: s.id,
        stageLabel: s.label,
      }))
    );
    return NextResponse.json(stages);
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}