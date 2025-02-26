import React, { useEffect, useState } from "react";

import styles from "./home.module.scss";

import AddIcon from "../icons/add.svg";
import DiscoveryIcon from "../icons/discovery.svg";
import MaskIcon from "../icons/mask.svg";
import McpIcon from "../icons/mcp.svg";
import PanelLeftClose from "../icons/panel-left-close.svg";
import SettingsIcon from "../icons/settings.svg";
import { IconButton } from "./button";

import Locale from "../locales";

import { useAppConfig, useChatStore } from "../store";

import { Path } from "../constant";

import clsx from "clsx";
import dynamic from "next/dynamic";
import { Link, useNavigate } from "react-router-dom";
import { isMcpEnabled } from "../mcp/actions";
import { Popover } from "./ui-lib";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

function SideBarHeader(props: {
  title?: string | React.ReactNode;
  subTitle?: string | React.ReactNode;
}) {
  const { title, subTitle } = props;
  const navigate = useNavigate();
  const config = useAppConfig();
  const [showPropover, setShowPropover] = useState(false);
  const [mcpEnabled, setMcpEnabled] = useState(false);
  const chatStore = useChatStore();

  useEffect(() => {
    // 检查 MCP 是否启用
    const checkMcpStatus = async () => {
      const enabled = await isMcpEnabled();
      setMcpEnabled(enabled);
      console.log("[SideBar] MCP enabled:", enabled);
    };
    checkMcpStatus();
  }, []);

  return (
    <div className={styles["sidebar-header"]} data-tauri-drag-region>
      <div className={styles["header-actions"]}>
        <div className={styles["primary-actions"]}>
          <IconButton icon={<PanelLeftClose />} shadow />
        </div>
        <div className={styles["second-actions"]}>
          <Popover
            onClose={() => setShowPropover(false)}
            content={<div>hello</div>}
            open={showPropover}
          >
            <IconButton
              icon={<SettingsIcon />}
              onClick={() => setShowPropover(true)}
              shadow
            />
          </Popover>

          <Link to={Path.Settings}>
            <IconButton
              aria={Locale.Settings.Title}
              icon={<SettingsIcon />}
              shadow
            />
          </Link>
          <IconButton
            icon={<AddIcon />}
            onClick={() => {
              if (config.dontShowMaskSplashScreen) {
                chatStore.newSession();
                navigate(Path.Chat);
              } else {
                navigate(Path.NewChat);
              }
            }}
            shadow
          />
        </div>
      </div>
      <div>
        <div className={styles["sidebar-title"]}>{title}</div>
        <div className={styles["sidebar-sub-title"]}>{subTitle}</div>
      </div>
      <div className={styles["sidebar-header-bar"]}>
        <IconButton
          icon={<MaskIcon />}
          text={Locale.Mask.Name}
          className={styles["sidebar-bar-button"]}
          onClick={() => {
            if (config.dontShowMaskSplashScreen !== true) {
              navigate(Path.NewChat, { state: { fromHome: true } });
            } else {
              navigate(Path.Masks, { state: { fromHome: true } });
            }
          }}
          shadow
        />
        {mcpEnabled && (
          <IconButton
            icon={<McpIcon />}
            text={Locale.Mcp.Name}
            className={styles["sidebar-bar-button"]}
            onClick={() => {
              navigate(Path.McpMarket, { state: { fromHome: true } });
            }}
            shadow
          />
        )}
        <IconButton
          icon={<DiscoveryIcon />}
          text={Locale.SearchChat.Page.Title}
          className={styles["sidebar-bar-button"]}
          onClick={() =>
            navigate(Path.SearchChat, { state: { fromHome: true } })
          }
          shadow
        />
      </div>
    </div>
  );
}

export default function SideBar(props: { className?: string }) {
  return (
    <div className={clsx(styles.sidebar, props.className)}>
      <SideBarHeader title="NextChat" subTitle="Build your own AI assistant." />
      <div className={styles["sidebar-body"]}>
        <ChatList />
      </div>
    </div>
  );
}
