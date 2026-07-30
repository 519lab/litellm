"use client";

import React from "react";
import { Alert } from "antd";

interface ReplayBannerProps {
  model: string;
  requestId: string;
  onDismiss: () => void;
}

export function ReplayBanner({ model, requestId, onDismiss }: ReplayBannerProps) {
  return (
    <Alert
      type="info"
      message={`Replaying request ${requestId} with model ${model}. Messages loaded from spend logs.`}
      closable
      onClose={onDismiss}
      className="mb-4 mx-4 mt-2"
    />
  );
}
