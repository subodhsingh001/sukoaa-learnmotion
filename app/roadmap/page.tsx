"use client";
import { CheckCircle2, CircleDashed, CircleDot, Wrench } from "lucide-react";
import { ROADMAP, type Status } from "@/data/roadmap";
import { Badge, Card, Page, PageHeader, ProgressBar, Stat } from "@/components/ui/kit";
import type { Tone } from "@/lib/format";

const META: Record<Status, { label: string; tone: Tone; weight: number }> = {
  done: { label: "Working", tone: "success", weight: 1 }, partial: { label: "Partial", tone: "info", weight: 0.5 },
  fix: { label: "Needs fixing", tone: "warn", weight: 0.25 }, todo: { label: "Not started", tone: "neutral", weight: 0 },
};

export default function RoadmapPage() {
  const all = ROADMAP.flatMap((g) => g.modules);
  const count = (s: Status) => all.filter((m) => m.status === s).length;
  const overall = Math.round((all.reduce((a, m) => a + META[m.status].weight, 0) / all.length) * 100);
  return (
    <Page>
      <PageHeader title="Product roadmap" subtitle="Where every module stands today. Progress is weighted: working = 100%, partial = 50%, needs fixing = 25%." />
      <div className="sk-grid cols-4">
        <Stat label="Overall completion" value={`${overall}%`} icon={<CircleDot size={20} />} hint={`${all.length} modules`} />
        <Stat label="Working" value={count("done")} icon={<CheckCircle2 size={20} />} />
        <Stat label="Partial / needs fixing" value={count("partial") + count("fix")} icon={<Wrench size={20} />} />
        <Stat label="Not started" value={count("todo")} icon={<CircleDashed size={20} />} />
      </div>
      <div className="sk-grid cols-2">
        {ROADMAP.map((g) => {
          const pct = Math.round((g.modules.reduce((a, m) => a + META[m.status].weight, 0) / g.modules.length) * 100);
          return (
            <Card key={g.name} title={g.name} subtitle={`${g.modules.length} modules · ${pct}% complete`} flush>
              <div style={{ padding: "0 20px 14px" }}><ProgressBar value={pct} /></div>
              {g.modules.map((m) => (
                <div className="sk-list-item" key={m.name} style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: 1, fontSize: 13.5 }}>{m.name}{m.note && <span className="sk-sub">{m.note}</span>}</div>
                  <Badge tone={META[m.status].tone}>{META[m.status].label}</Badge>
                </div>))}
            </Card>);
        })}
      </div>
    </Page>
  );
}
