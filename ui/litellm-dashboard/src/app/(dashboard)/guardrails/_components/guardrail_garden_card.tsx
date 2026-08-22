import React, { useState } from "react";
import { CheckCircleFilled } from "@ant-design/icons";
import { GuardrailCardInfo } from "./guardrail_garden_data";
import { resolveLogoSrc } from "@/lib/assetPaths";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cva.config";

const LogoWithFallback: React.FC<{ src: string; name: string }> = ({ src, name }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
          "bg-muted text-[13px] font-semibold text-muted-foreground",
        )}
      >
        {name?.charAt(0) || "?"}
      </div>
    );
  }

  return (
    <img
      src={resolveLogoSrc(src)}
      alt=""
      className="h-7 w-7 shrink-0 rounded-md object-contain"
      onError={() => setHasError(true)}
    />
  );
};

const GuardrailCard: React.FC<{ card: GuardrailCardInfo; onClick: () => void }> = ({ card, onClick }) => (
  <Card
    size="sm"
    data-testid="guardrail-garden-card"
    onClick={onClick}
    className={cn(
      "min-h-[170px] cursor-pointer gap-0 px-5 pt-5 pb-4",
      "transition-shadow hover:shadow-md hover:ring-primary/40",
    )}
  >
    <div className="mb-2.5 flex items-center gap-2.5">
      <LogoWithFallback src={card.logo} name={card.name} />
      <span className="text-sm leading-tight font-semibold text-foreground">{card.name}</span>
    </div>

    <p className="line-clamp-3 m-0 flex-1 text-xs leading-relaxed text-muted-foreground">{card.description}</p>

    {card.eval && (
      <div className="mt-2.5 flex items-center gap-1 text-primary">
        <CheckCircleFilled className="text-xs" />
        <span className="text-[11px] font-medium">
          F1: {card.eval.f1}% &middot; {card.eval.testCases} test cases
        </span>
      </div>
    )}
  </Card>
);

export default GuardrailCard;
