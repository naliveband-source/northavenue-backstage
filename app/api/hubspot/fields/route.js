import { NextResponse } from "next/server";

const HS_TOKEN = process.env.HUBSPOT_TOKEN;

export async function GET() {
  try {
    // Hent alle pipelines og deres stages
    const pipeRes = await fetch("https://api.hubapi.com/crm/v3/pipelines/deals", {
      headers: { Authorization: `Bearer ${HS_TOKEN}` }
    });
    const pipeData = await pipeRes.json();

    // Forenkl output så det er nemt at læse
    const pipelines = (pipeData.results || []).map(p => ({
      pipelineId: p.id,
      pipelineLabel: p.label,
      stages: (p.stages || []).map(s => ({
        stageId: s.id,
        label: s.label,
        probability: s.metadata?.probability,
        isClosed: s.metadata?.isClosed === "true",
      }))
    }));

    // Hent et uddrag af deals og tæl hvor mange der er i hver stage
    const dealsRes = await fetch(
      "https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,dealstage,pipeline",
      { headers: { Authorization: `Bearer ${HS_TOKEN}` } }
    );
    const dealsData = await dealsRes.json();

    // Byg en lookup så vi kan oversætte stage-ID til label
    const stageLookup = {};
    pipelines.forEach(p => {
      p.stages.forEach(s => {
        stageLookup[s.stageId] = `${p.pipelineLabel} → ${s.label}`;
      });
    });

    const stageCounts = {};
    (dealsData.results || []).forEach(d => {
      const stage = d.properties?.dealstage || "ukendt";
      const label = stageLookup[stage] || stage;
      if (!stageCounts[label]) stageCounts[label] = { stageId: stage, count: 0 };
      stageCounts[label].count++;
    });

    return NextResponse.json({
      pipelines,
      dealStageDistribution: stageCounts,
      totalDealsSampled: dealsData.results?.length || 0,
      hint: "Find den stage hvor isClosed=true og label er 'Lukket - vundet' → brug det stageId i sync-filteret",
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
