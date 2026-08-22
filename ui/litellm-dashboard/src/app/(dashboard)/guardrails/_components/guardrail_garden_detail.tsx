import React, { useState } from "react";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import AddGuardrailForm from "./add_guardrail_form";
import { resolveLogoSrc } from "@/lib/assetPaths";
import { GUARDRAIL_PRESETS } from "./guardrail_garden_configs";
import { GuardrailCardInfo } from "./guardrail_garden_data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cva.config";

interface GuardrailDetailViewProps {
  card: GuardrailCardInfo;
  onBack: () => void;
  accessToken: string | null;
  onGuardrailCreated: () => void;
}

const GuardrailDetailView: React.FC<GuardrailDetailViewProps> = ({ card, onBack, accessToken, onGuardrailCreated }) => {
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const detailRows = [
    { property: "Provider", value: card.category === "litellm" ? "LiteLLM Content Filter" : "Partner Guardrail" },
    ...(card.subcategory ? [{ property: "Subcategory", value: card.subcategory }] : []),
    ...(card.category === "litellm" ? [{ property: "Cost", value: "$0 / request" }] : []),
    ...(card.category === "litellm" ? [{ property: "External Dependencies", value: "None" }] : []),
    ...(card.category === "litellm" ? [{ property: "Latency", value: card.eval?.latency || "<1ms" }] : []),
  ];

  const evalRows = card.eval
    ? [
        { metric: "Precision", value: `${card.eval.precision}%` },
        { metric: "Recall", value: `${card.eval.recall}%` },
        { metric: "F1 Score", value: `${card.eval.f1}%` },
        { metric: "Test Cases", value: String(card.eval.testCases) },
        { metric: "False Positives", value: "0" },
        { metric: "False Negatives", value: "0" },
        { metric: "Latency (p50)", value: card.eval.latency },
      ]
    : [];

  const tabs = [{ key: "overview", label: "Overview" }, ...(card.eval ? [{ key: "eval", label: "Eval Results" }] : [])];

  return (
    <div data-testid="guardrail-garden-detail" className="mx-auto max-w-[960px] bg-background text-foreground">
      <div
        onClick={onBack}
        className={cn(
          "mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm",
          "text-muted-foreground hover:text-foreground",
        )}
      >
        <ArrowLeftOutlined className="text-[11px]" />
        <span>{card.name}</span>
      </div>

      <div className="mb-2 flex items-center gap-4">
        <img
          src={resolveLogoSrc(card.logo)}
          alt=""
          className="h-10 w-10 rounded-lg object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <h1 className="m-0 text-[28px] leading-tight font-normal text-foreground">{card.name}</h1>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{card.description}</p>

      <div className="mb-8 flex gap-2.5">
        <Button onClick={() => setIsAddFormVisible(true)} shape="round" className="h-9 px-5 text-sm font-medium">
          Create Guardrail
        </Button>
      </div>

      <div className="mb-7 border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "-mb-px cursor-pointer border-b-[3px] px-5 py-3 text-sm",
                activeTab === tab.key
                  ? "border-primary font-medium text-primary"
                  : "border-transparent font-normal text-muted-foreground",
              )}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="flex gap-16">
          <div className="min-w-0 flex-1">
            <h2 className="mb-3 text-lg font-normal text-foreground">Overview</h2>
            <p className="mb-8 text-sm leading-7 text-foreground/80">{card.description}</p>

            <h2 className="mb-1 text-lg font-normal text-foreground">Guardrail Details</h2>
            <p className="mb-4 text-[13px] text-muted-foreground">Details are as follows</p>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-[200px] py-3 text-left font-medium text-muted-foreground">Property</th>
                  <th className="py-3 text-left font-medium text-muted-foreground">{card.name}</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="py-3 text-foreground/80">{row.property}</td>
                    <td className="py-3 text-foreground">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="w-60 shrink-0">
            <div className="mb-7">
              <div className="mb-1 text-xs text-muted-foreground">Guardrail ID</div>
              <div className="text-[13px] break-all text-foreground">litellm/{card.id}</div>
            </div>

            <div className="mb-7">
              <div className="mb-1 text-xs text-muted-foreground">Type</div>
              <div className="text-[13px] text-foreground">
                {card.category === "litellm" ? "Content Filter" : "Partner"}
              </div>
            </div>

            {card.tags.length > 0 && (
              <div className="mb-7">
                <div className="mb-2 text-xs text-muted-foreground">Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {card.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="rounded-full px-3 py-1 text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "eval" && (
        <div>
          <h2 className="mb-4 text-lg font-normal text-foreground">Eval Results</h2>
          <table className="w-full max-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Metric</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Value</th>
              </tr>
            </thead>
            <tbody>
              {evalRows.map((row, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="px-4 py-3 text-foreground/80">{row.metric}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddGuardrailForm
        visible={isAddFormVisible}
        onClose={() => setIsAddFormVisible(false)}
        accessToken={accessToken}
        onSuccess={() => {
          setIsAddFormVisible(false);
          onGuardrailCreated();
        }}
        preset={GUARDRAIL_PRESETS[card.id]}
      />
    </div>
  );
};

export default GuardrailDetailView;
