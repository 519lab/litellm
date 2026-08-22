"use client";

import React, { useEffect, useRef } from "react";
import { ConfigProvider, notification, message, theme as antdTheme } from "antd";
import { useTheme } from "next-themes";
import { StyleProvider } from "@ant-design/cssinjs";
import { setNotificationInstance } from "@/components/molecules/notifications_manager";
import { setMessageInstance } from "@/components/molecules/message_manager";

export default function AntdGlobalProvider({ children }: { children: React.ReactNode }) {
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [messageApi, messageContextHolder] = message.useMessage();
  const initialized = useRef(false);
  const { resolvedTheme } = useTheme();
  const algorithm = resolvedTheme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

  useEffect(() => {
    if (!initialized.current) {
      setNotificationInstance(notificationApi);
      setMessageInstance(messageApi);
      initialized.current = true;
    }
  }, [notificationApi, messageApi]);

  return (
    <StyleProvider layer>
      <ConfigProvider theme={{ cssVar: true, algorithm }}>
        {notificationContextHolder}
        {messageContextHolder}
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
