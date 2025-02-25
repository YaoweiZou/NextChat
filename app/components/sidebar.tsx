import React, { useEffect, useMemo, useRef, useState } from "react";

import styles from "./home.module.scss";

import AddIcon from "../icons/add.svg";
import ChatGptIcon from "../icons/chatgpt.svg";
import DiscoveryIcon from "../icons/discovery.svg";
import MaskIcon from "../icons/mask.svg";
import McpIcon from "../icons/mcp.svg";
import PanelLeftClose from "../icons/panel-left-close.svg";
import SettingsIcon from "../icons/settings.svg";
import { IconButton } from "./button";

import Locale, { getLang } from "../locales";

import { useAppConfig, useChatStore } from "../store";

import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  Path,
} from "../constant";

import clsx from "clsx";
import dynamic from "next/dynamic";
import { Link, useNavigate } from "react-router-dom";
import { isMcpEnabled } from "../mcp/actions";
import { isIOS, useMobileScreen } from "../utils";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const onDragStart = (e: MouseEvent) => {
    // Remembers the initial width each time the mouse is pressed
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      let d = e.clientX - startX.current;
      // If text and other elements go from right to left
      if (getLang() === "ar") {
        d = -1 * d;
      }
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth > MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      // In useRef the data is non-responsive, so `config.sidebarWidth` can't get the dynamic sidebarWidth
      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", handleDragEnd);
    };

    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();

  useEffect(() => {
    const barWidth = limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen]);

  return { onDragStart };
}

function SideBarContainer(props: {
  children: React.ReactNode;
  className?: string;
}) {
  const { onDragStart } = useDragSideBar();
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );
  const { children, className } = props;
  return (
    <div
      className={clsx(styles.sidebar, className)}
      style={{
        // #3016 disable transition on ios mobile screen
        transition: isMobileScreen && isIOSMobile ? "none" : undefined,
      }}
    >
      {children}
      <div
        className={styles["sidebar-drag"]}
        onPointerDown={(e) => onDragStart(e as any)}
      />
    </div>
  );
}

function SideBarHeader(props: {
  title?: string | React.ReactNode;
  subTitle?: string | React.ReactNode;
  logo?: React.ReactNode;
}) {
  const { title, subTitle, logo } = props;
  const navigate = useNavigate();
  const config = useAppConfig();
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
    <div style={{ padding: "0 20px" }}>
      <div className={styles["header-actions"]}>
        <div className={styles["primary-actions"]}>
          <IconButton icon={<PanelLeftClose />} shadow />
        </div>
        <div className={styles["second-actions"]}>
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
      <div className={styles["sidebar-header"]} data-tauri-drag-region>
        <div className={styles["sidebar-title-container"]}>
          <div className={styles["sidebar-title"]} data-tauri-drag-region>
            {title}
          </div>
          <div className={styles["sidebar-sub-title"]}>{subTitle}</div>
        </div>
        <div className={clsx(styles["sidebar-logo"], "no-dark")}>{logo}</div>
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

function SideBarBody() {
  return (
    <div className={styles["sidebar-body"]}>
      <ChatList />
    </div>
  );
}

export default function SideBar(props: { className?: string }) {
  return (
    <SideBarContainer className={props.className}>
      <SideBarHeader
        title="NextChat"
        subTitle="Build your own AI assistant."
        logo={<ChatGptIcon />}
      />
      <SideBarBody />
    </SideBarContainer>
  );
}
