import { create as ae } from "zustand";
import { jsx as t, jsxs as i, Fragment as v } from "react/jsx-runtime";
import { useEffect as W, useMemo as U, useRef as se, useState as A, useCallback as re } from "react";
import { Search as oe, Trash2 as ie, Play as $, Square as le, Bookmark as Q, BookmarkCheck as ce, Globe as de, Check as ue, Copy as he, FileInput as me, Code as pe, ArrowDownToLine as fe, Database as ge, Braces as H, Cookie as xe, Radio as be, Unplug as ve, ExternalLink as Ne } from "lucide-react";
import { clsx as Ce } from "clsx";
import { twMerge as we } from "tailwind-merge";
import { cva as G } from "class-variance-authority";
import { Slot as J, ScrollArea as k, AlertDialog as w } from "radix-ui";
import { Grid as ye } from "react-window";
import * as q from "@radix-ui/react-tabs";
import { Prism as qe } from "react-syntax-highlighter";
import { oneDark as Se } from "react-syntax-highlighter/dist/esm/styles/prism";
function P(e, n) {
  if (!e) return;
  const s = n.toLowerCase(), a = Object.keys(e).find((o) => o.toLowerCase() === s);
  return a ? e[a] : void 0;
}
function Re(e) {
  if (!e) return {};
  const n = {};
  return e.split(";").forEach((s) => {
    const [a, ...o] = s.split("=");
    a && (n[a.trim()] = o.join("=").trim());
  }), n;
}
function ke(e) {
  try {
    const n = {};
    return new URL(e).searchParams.forEach((s, a) => {
      n[a] = s;
    }), n;
  } catch {
    return {};
  }
}
function Te(e, n) {
  if (!e) return { formData: null, json: null };
  if (n?.includes("application/json"))
    try {
      return { formData: null, json: JSON.parse(e) };
    } catch {
      return { formData: null, json: null };
    }
  return n?.includes("x-www-form-urlencoded") ? { formData: e, json: null } : { formData: null, json: null };
}
function ze(e) {
  return [
    e.requestUrl,
    e.requestMethod,
    e.requestBody || "",
    e.responseContent || "",
    e.tabName,
    e.requestName,
    e.responseStatusText,
    e.responseMimeType,
    JSON.stringify(e.requestHeaders),
    JSON.stringify(e.responseHeaders),
    JSON.stringify(e.requestQueryParams),
    JSON.stringify(e.requestCookies)
  ].join(" ").toLowerCase();
}
function De(e) {
  const n = e.requestHeaders || {}, s = e.responseHeaders || {}, a = P(n, "content-type"), { formData: o, json: r } = Te(e.requestBody, a), d = {
    id: crypto.randomUUID(),
    timestamp: e.timestamp,
    tabId: e.tabId || 0,
    tabName: e.tabTitle || `Tab ${e.tabId || "Unknown"}`,
    requestName: "",
    requestUrl: e.url,
    requestMethod: (e.method || "GET").toUpperCase(),
    requestHeaders: n,
    requestCookies: Re(P(n, "cookie")),
    requestQueryParams: ke(e.url),
    requestFormData: o,
    requestJson: r,
    requestBody: e.requestBody,
    responseStatus: e.responseStatus || 0,
    responseStatusText: e.statusText || "",
    responseHeaders: s,
    responseMimeType: e.mimeType || "",
    responseContent: e.responseBody,
    searchableText: ""
  };
  return d.searchableText = ze(d), d;
}
class Ee {
  port = null;
  pingInterval = null;
  callbacks = null;
  connect(n, s) {
    if (typeof chrome > "u" || !chrome.runtime?.connect) {
      console.error("[HTTPChain] Chrome runtime not available"), s.onStatusChange("disconnected");
      return;
    }
    this.callbacks = s, s.onStatusChange("connecting");
    try {
      this.port = chrome.runtime.connect(n, { name: "httpchain-recorder" }), this.port.onMessage.addListener((a) => {
        switch (a.type) {
          case "CONNECTED":
            this.callbacks?.onStatusChange("connected"), this.callbacks?.onStateUpdate(
              a.isCapturing || !1,
              a.tabCount || 0,
              a.attachedTabCount || 0
            );
            break;
          case "PONG":
            break;
          case "STATE_UPDATE":
            this.callbacks?.onStateUpdate(
              a.isCapturing || !1,
              a.tabCount || 0,
              a.attachedTabCount || 0
            );
            break;
          case "CAPTURE_STARTED":
            this.callbacks?.onCaptureChange(!0, a.attachedTabCount || 0);
            break;
          case "CAPTURE_STOPPED":
            this.callbacks?.onCaptureChange(!1, 0);
            break;
          case "REQUEST_CAPTURED":
            if (a.data) {
              const o = De(a.data);
              this.callbacks?.onRequest(o);
            }
            break;
          case "ERROR":
            console.error("[HTTPChain]", a.error);
            break;
        }
      }), this.port.onDisconnect.addListener(() => {
        this.port = null, this.callbacks?.onStatusChange("disconnected"), this.callbacks?.onCaptureChange(!1, 0), this.stopPing();
      }), this.startPing();
    } catch (a) {
      console.error("[HTTPChain] Connection error:", a), s.onStatusChange("disconnected");
    }
  }
  disconnect() {
    this.port && (this.port.disconnect(), this.port = null), this.stopPing(), this.callbacks?.onStatusChange("disconnected");
  }
  send(n) {
    this.port?.postMessage(n);
  }
  startPing() {
    this.pingInterval = setInterval(() => {
      this.send({ type: "PING" });
    }, 5e3);
  }
  stopPing() {
    this.pingInterval && (clearInterval(this.pingInterval), this.pingInterval = null);
  }
  isConnected() {
    return this.port !== null;
  }
}
const z = new Ee(), Ie = {
  requests: {},
  savedRequests: {},
  selectedRequestId: null,
  searchQuery: "",
  connectionStatus: "disconnected",
  isCapturing: !1,
  attachedTabCount: 0,
  availableTabCount: 0,
  // Warning Configuration
  maxTabsWarningThreshold: 10,
  maxRequestsWarningThreshold: 1e3,
  strictRequestsLimit: !1,
  // Warning Tracking
  hasSeenTabsWarning: !1,
  hasSeenRequestsWarning: !1
}, c = ae((e, n) => ({
  ...Ie,
  // Connection actions
  connect: (s) => {
    const a = {
      onStatusChange: (o) => n().setConnectionStatus(o),
      onRequest: (o) => n().addRequest(o),
      onCaptureChange: (o, r) => n().setCapturing(o, r),
      onStateUpdate: (o, r, d) => n().setExtensionState(o, r, d)
    };
    z.connect(s, a);
  },
  disconnect: () => {
    z.disconnect();
  },
  startCapture: () => {
    z.send({ type: "START_CAPTURE" });
  },
  stopCapture: () => {
    z.send({ type: "STOP_CAPTURE" });
  },
  // Request actions
  addRequest: (s) => {
    e((a) => ({
      requests: { ...a.requests, [s.id]: s }
    }));
  },
  clearRequests: () => {
    e({
      requests: {},
      selectedRequestId: null,
      hasSeenRequestsWarning: !1
      // Reset so warning can show again later
    });
  },
  // Bookmark actions
  saveRequest: (s, a) => {
    e((o) => {
      const r = o.requests[s];
      return r ? {
        savedRequests: {
          ...o.savedRequests,
          [s]: { ...r, requestName: a }
        }
      } : o;
    });
  },
  unsaveRequest: (s) => {
    e((a) => {
      const { [s]: o, ...r } = a.savedRequests;
      return { savedRequests: r };
    });
  },
  // UI actions
  setSelectedRequestId: (s) => {
    e({ selectedRequestId: s });
  },
  setSearchQuery: (s) => {
    e({ searchQuery: s });
  },
  // Internal actions
  setConnectionStatus: (s) => {
    e({ connectionStatus: s });
  },
  setCapturing: (s, a) => {
    e({ isCapturing: s, attachedTabCount: a });
  },
  setExtensionState: (s, a, o) => {
    e({ isCapturing: s, availableTabCount: a, attachedTabCount: o });
  },
  // Warning Configuration
  setWarningConfig: (s) => {
    e({
      ...s.maxTabs !== void 0 && { maxTabsWarningThreshold: s.maxTabs },
      ...s.maxRequests !== void 0 && { maxRequestsWarningThreshold: s.maxRequests },
      ...s.strict !== void 0 && { strictRequestsLimit: s.strict }
    });
  },
  dismissTabsWarning: () => {
    e({ hasSeenTabsWarning: !0 });
  },
  dismissRequestsWarning: () => {
    e({ hasSeenRequestsWarning: !0 });
  }
}));
function Ue(e) {
  const n = c((a) => a.connect), s = c((a) => a.setWarningConfig);
  return W(() => {
    n(e);
  }, [e, n]), { setWarningConfig: s };
}
function h(...e) {
  return we(Ce(e));
}
function He({ className: e, type: n, ...s }) {
  return /* @__PURE__ */ t(
    "input",
    {
      type: n,
      "data-slot": "input",
      className: h(
        "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-none border bg-transparent px-2.5 py-1 text-xs transition-colors file:h-6 file:text-xs file:font-medium focus-visible:ring-1 aria-invalid:ring-1 md:text-xs file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        e
      ),
      ...s
    }
  );
}
const We = G(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-none border border-transparent bg-clip-padding text-xs font-medium focus-visible:ring-1 aria-invalid:ring-1 [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline: "border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive: "bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-none px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-none px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 rounded-none [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-none",
        "icon-lg": "size-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function C({
  className: e,
  variant: n = "default",
  size: s = "default",
  asChild: a = !1,
  ...o
}) {
  const r = a ? J.Root : "button";
  return /* @__PURE__ */ t(
    r,
    {
      "data-slot": "button",
      "data-variant": n,
      "data-size": s,
      className: h(We({ variant: n, size: s, className: e })),
      ...o
    }
  );
}
const j = 25;
function D(e, n) {
  const s = e.toLowerCase(), a = n.toLowerCase(), o = s.indexOf(a);
  if (o === -1) return null;
  const r = Math.max(0, o - j), d = Math.min(e.length, o + n.length + j), l = r > 0 ? "..." : "", m = d < e.length ? "..." : "";
  return {
    matchedText: `${l}${e.slice(r, d)}${m}`,
    highlightText: e.slice(o, o + n.length)
  };
}
function F(e, n) {
  return U(() => {
    if (!n.trim())
      return e.map((a) => ({
        request: a,
        matchedField: "",
        matchedText: "",
        highlightText: ""
      }));
    const s = n.toLowerCase();
    return e.filter((a) => a.searchableText?.includes(s)).map((a) => {
      let o = D(a.requestUrl, n), r = "URL";
      if (!o && a.responseContent && (o = D(a.responseContent, n), r = "Response"), !o && a.requestBody && (o = D(a.requestBody, n), r = "Request Body"), !o) {
        const d = JSON.stringify(a.requestHeaders);
        o = D(d, n), r = "Headers";
      }
      return {
        request: a,
        matchedField: r,
        matchedText: o?.matchedText || "",
        highlightText: o?.highlightText || n
      };
    });
  }, [e, n]);
}
function Ae() {
  const e = c((u) => u.searchQuery), n = c((u) => u.setSearchQuery), s = c((u) => u.clearRequests), a = c((u) => u.startCapture), o = c((u) => u.stopCapture), r = c((u) => u.isCapturing), d = c((u) => u.connectionStatus), l = c((u) => u.requests), m = U(() => Object.values(l), [l]), g = F(m, e), f = d === "connected";
  return /* @__PURE__ */ i("div", { className: "h-full p-3 space-y-3 bg-background overflow-hidden", children: [
    /* @__PURE__ */ i("div", { className: "relative", children: [
      /* @__PURE__ */ t(oe, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ t(
        He,
        {
          type: "text",
          placeholder: "Search requests...",
          value: e,
          onChange: (u) => n(u.target.value),
          className: "pl-9 h-8"
        }
      )
    ] }),
    /* @__PURE__ */ i("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ i("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ i("span", { children: [
          e ? `${g.length} of ${m.length}` : m.length,
          " requests"
        ] }),
        r && /* @__PURE__ */ i("span", { className: "flex items-center gap-1 text-destructive", children: [
          /* @__PURE__ */ t("span", { className: "h-2 w-2 rounded-full bg-current animate-pulse" }),
          "Live"
        ] })
      ] }),
      /* @__PURE__ */ i("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ t(
          C,
          {
            size: "sm",
            variant: "ghost",
            onClick: s,
            disabled: m.length === 0,
            className: "h-8 w-8 p-0",
            title: "Clear all requests",
            children: /* @__PURE__ */ t(ie, { className: "h-4 w-4" })
          }
        ),
        r ? /* @__PURE__ */ t(
          C,
          {
            size: "sm",
            variant: "ghost",
            onClick: o,
            className: "h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10",
            title: "Stop capture",
            children: /* @__PURE__ */ t(le, { className: "h-4 w-4 fill-current" })
          }
        ) : /* @__PURE__ */ t(
          C,
          {
            size: "sm",
            variant: "ghost",
            onClick: a,
            disabled: !f,
            className: "h-8 w-8 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10",
            title: "Start capture",
            children: /* @__PURE__ */ t($, { className: "h-4 w-4 fill-current" })
          }
        )
      ] })
    ] })
  ] });
}
const Pe = G(
  "h-5 gap-1 rounded-none border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-colors overflow-hidden group/badge",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive: "bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20",
        outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function R({
  className: e,
  variant: n = "default",
  asChild: s = !1,
  ...a
}) {
  const o = s ? J.Root : "span";
  return /* @__PURE__ */ t(
    o,
    {
      "data-slot": "badge",
      "data-variant": n,
      className: h(Pe({ variant: n }), e),
      ...a
    }
  );
}
function je({ text: e, highlight: n }) {
  if (!n || !e) return /* @__PURE__ */ t("span", { children: e });
  const s = e.split(new RegExp(`(${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return /* @__PURE__ */ t("span", { children: s.map(
    (a, o) => a.toLowerCase() === n.toLowerCase() ? /* @__PURE__ */ t("mark", { className: "bg-primary/30 text-primary rounded-sm px-0.5", children: a }, o) : a
  ) });
}
function Le(e, n = 60) {
  if (!e) return "";
  try {
    const s = new URL(e), a = s.pathname + s.search;
    return a.length <= n ? a : a.slice(0, n) + "...";
  } catch {
    return e.length <= n ? e : e.slice(0, n) + "...";
  }
}
function _e(e) {
  return new Date(e).toLocaleTimeString("en-US", {
    hour12: !1,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
function Oe({ result: e, isSelected: n, isSaved: s, onSelect: a, style: o }) {
  const { request: r, matchedText: d, highlightText: l } = e, m = r.responseStatus >= 200 && r.responseStatus < 300, g = r.responseStatus >= 400;
  return /* @__PURE__ */ i(
    "div",
    {
      style: o,
      onClick: a,
      className: `group cursor-pointer border-b px-4 py-3 transition-colors hover:bg-muted/50 overflow-hidden ${n ? "bg-muted border-l-2 border-l-primary" : ""}`,
      children: [
        /* @__PURE__ */ i("div", { className: "flex items-center gap-2 mb-1.5", children: [
          /* @__PURE__ */ t(R, { variant: "secondary", className: "shrink-0 font-mono text-[11px] font-bold px-2 py-0.5", children: r.requestMethod }),
          /* @__PURE__ */ t(
            R,
            {
              variant: "outline",
              className: `shrink-0 text-[11px] font-medium px-2 py-0.5 ${g ? "border-destructive text-destructive" : m ? "border-primary text-primary" : "border-muted-foreground/50"}`,
              children: r.responseStatus || "..."
            }
          ),
          s && /* @__PURE__ */ t(Q, { className: "h-3.5 w-3.5 shrink-0 fill-primary text-primary" }),
          /* @__PURE__ */ t("span", { className: "ml-auto font-mono text-[11px] text-muted-foreground shrink-0", children: _e(r.timestamp) })
        ] }),
        /* @__PURE__ */ t("p", { className: "font-mono text-[13px] text-foreground/90 truncate font-medium mb-1", title: r.requestUrl, children: Le(r.requestUrl) }),
        d && /* @__PURE__ */ t("p", { className: "text-[11px] text-muted-foreground mt-1 line-clamp-2 break-all leading-tight", children: /* @__PURE__ */ t(je, { text: d, highlight: l }) })
      ]
    }
  );
}
const Be = 72, Me = 104;
function $e() {
  const e = c((p) => p.searchQuery), n = c((p) => p.selectedRequestId), s = c((p) => p.setSelectedRequestId), a = c((p) => p.savedRequests), o = c((p) => p.isCapturing), r = c((p) => p.requests), d = U(() => Object.values(r), [r]), m = e.trim().length > 0 ? Me : Be, g = se(null), [f, u] = A({ width: 360, height: 400 }), T = F(d, e), S = U(() => {
    const p = [], y = [];
    return T.forEach((N) => {
      N.request.id in a ? p.push(N) : y.push(N);
    }), [...p, ...y];
  }, [T, a]);
  W(() => {
    const p = g.current;
    if (!p) return;
    const y = () => {
      const b = p.getBoundingClientRect();
      b.width > 0 && b.height > 0 && u({ width: b.width, height: b.height });
    };
    y();
    const N = new ResizeObserver(y);
    return N.observe(p), () => N.disconnect();
  }, []);
  const x = re(({ columnIndex: p, rowIndex: y, style: N }) => {
    const b = S[y];
    if (!b) return /* @__PURE__ */ t("div", { style: N });
    const ne = b.request.id in a;
    return /* @__PURE__ */ t(
      Oe,
      {
        result: b,
        isSelected: n === b.request.id,
        isSaved: ne,
        onSelect: () => s(b.request.id),
        style: N
      }
    );
  }, [S, n, a, s]);
  return S.length === 0 ? /* @__PURE__ */ i("div", { ref: g, className: "h-full w-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground", children: [
    /* @__PURE__ */ t("p", { className: "text-sm font-medium", children: "No requests" }),
    /* @__PURE__ */ t("p", { className: "mt-1 text-xs", children: o ? "Waiting for network activity..." : "" })
  ] }) : /* @__PURE__ */ i("div", { ref: g, className: "h-full w-full overflow-hidden sidebar-list-container", children: [
    /* @__PURE__ */ t("style", { children: `
                .sidebar-list-container > div {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .sidebar-list-container > div::-webkit-scrollbar {
                    display: none;
                }
            ` }),
    /* @__PURE__ */ t(
      ye,
      {
        columnCount: 1,
        columnWidth: f.width,
        defaultHeight: f.height,
        defaultWidth: f.width,
        rowCount: S.length,
        rowHeight: m,
        cellComponent: x,
        cellProps: {},
        style: {
          height: f.height,
          width: "100%"
        }
      }
    )
  ] });
}
function Qe(e) {
  if (!e)
    return { protocol: "", host: "", path: "", isDataUrl: !1 };
  if (e.startsWith("data:")) {
    const n = e.indexOf(",");
    return {
      protocol: "data:",
      host: (n > 0 ? e.slice(5, Math.min(n, 50)) : "unknown") + (n > 50 ? "..." : ""),
      path: `[${((e.length - n) / 1024).toFixed(1)} KB payload]`,
      isDataUrl: !0
    };
  }
  try {
    const n = new URL(e);
    return {
      protocol: n.protocol,
      host: n.host,
      path: n.pathname + n.search + n.hash,
      isDataUrl: !1
    };
  } catch {
    return { protocol: "", host: "", path: e, isDataUrl: !1 };
  }
}
function Ge() {
  const e = c((x) => x.selectedRequestId), n = c((x) => x.requests), s = c((x) => x.savedRequests), a = c((x) => x.saveRequest), o = c((x) => x.unsaveRequest), r = e ? n[e] ?? s[e] ?? null : null, [d, l] = A(!1), m = e ? e in s : !1;
  if (!r)
    return /* @__PURE__ */ t("div", { className: "h-full flex items-center justify-center text-muted-foreground" });
  const g = r.responseStatus >= 200 && r.responseStatus < 300, f = r.responseStatus >= 400, u = Qe(r.requestUrl), T = async () => {
    await navigator.clipboard.writeText(r.requestUrl), l(!0), setTimeout(() => l(!1), 2e3);
  }, S = () => {
    if (e)
      if (m)
        o(e);
      else {
        const x = u.path.split("/").pop() || "Request";
        a(e, x);
      }
  };
  return /* @__PURE__ */ i("div", { className: "h-full flex flex-col p-4 overflow-hidden", children: [
    /* @__PURE__ */ i("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ t(
        R,
        {
          variant: "secondary",
          className: "font-mono font-bold text-sm px-2.5 py-0.5",
          children: r.requestMethod
        }
      ),
      /* @__PURE__ */ i(
        R,
        {
          variant: f ? "destructive" : g ? "default" : "secondary",
          className: "font-mono text-sm px-2.5 py-0.5",
          children: [
            r.responseStatus,
            " ",
            r.responseStatusText
          ]
        }
      ),
      r.responseMimeType && /* @__PURE__ */ t(R, { variant: "outline", className: "text-xs hidden sm:inline-flex", children: r.responseMimeType }),
      /* @__PURE__ */ t("div", { className: "flex-1" }),
      /* @__PURE__ */ t(
        C,
        {
          size: "sm",
          variant: m ? "default" : "outline",
          onClick: S,
          className: "shrink-0 gap-1.5",
          title: m ? "Remove from saved" : "Save request",
          children: m ? /* @__PURE__ */ i(v, { children: [
            /* @__PURE__ */ t(ce, { className: "h-4 w-4" }),
            /* @__PURE__ */ t("span", { className: "hidden sm:inline", children: "Saved" })
          ] }) : /* @__PURE__ */ i(v, { children: [
            /* @__PURE__ */ t(Q, { className: "h-4 w-4" }),
            /* @__PURE__ */ t("span", { className: "hidden sm:inline", children: "Save" })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ i("div", { className: "flex items-center gap-2 min-w-0", children: [
      /* @__PURE__ */ t(de, { className: "h-4 w-4 shrink-0 text-primary" }),
      /* @__PURE__ */ t("p", { className: "font-mono text-sm text-foreground/80 truncate flex-1", title: r.requestUrl, children: u.isDataUrl ? /* @__PURE__ */ i(v, { children: [
        /* @__PURE__ */ t("span", { className: "text-muted-foreground", children: u.protocol }),
        /* @__PURE__ */ t("span", { children: u.host }),
        /* @__PURE__ */ t("span", { className: "text-muted-foreground ml-1", children: u.path })
      ] }) : /* @__PURE__ */ i(v, { children: [
        /* @__PURE__ */ i("span", { className: "text-muted-foreground", children: [
          u.protocol,
          "//"
        ] }),
        /* @__PURE__ */ t("span", { className: "font-medium", children: u.host }),
        /* @__PURE__ */ t("span", { className: "text-foreground/60", children: u.path })
      ] }) }),
      /* @__PURE__ */ t(
        C,
        {
          size: "sm",
          variant: "ghost",
          onClick: T,
          className: "shrink-0 h-7 w-7 p-0",
          title: "Copy URL",
          children: d ? /* @__PURE__ */ t(ue, { className: "h-3.5 w-3.5 text-green-500" }) : /* @__PURE__ */ t(he, { className: "h-3.5 w-3.5" })
        }
      )
    ] })
  ] });
}
function E({
  className: e,
  children: n,
  viewPortRef: s,
  ...a
}) {
  return /* @__PURE__ */ i(
    k.Root,
    {
      "data-slot": "scroll-area",
      className: h("relative", e),
      ...a,
      children: [
        /* @__PURE__ */ t(
          k.Viewport,
          {
            ref: s,
            "data-slot": "scroll-area-viewport",
            className: "focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
            children: n
          }
        ),
        /* @__PURE__ */ t(Je, {}),
        /* @__PURE__ */ t(k.Corner, {})
      ]
    }
  );
}
function Je({
  className: e,
  orientation: n = "vertical",
  ...s
}) {
  return /* @__PURE__ */ t(
    k.ScrollAreaScrollbar,
    {
      "data-slot": "scroll-area-scrollbar",
      "data-orientation": n,
      orientation: n,
      className: h(
        "data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent flex touch-none p-px transition-colors select-none",
        e
      ),
      ...s,
      children: /* @__PURE__ */ t(
        k.ScrollAreaThumb,
        {
          "data-slot": "scroll-area-thumb",
          className: "rounded-none bg-border relative flex-1"
        }
      )
    }
  );
}
function Fe({ className: e, ...n }) {
  return /* @__PURE__ */ t("div", { "data-slot": "table-container", className: "relative w-full overflow-x-auto", children: /* @__PURE__ */ t(
    "table",
    {
      "data-slot": "table",
      className: h("w-full caption-bottom text-xs", e),
      ...n
    }
  ) });
}
function Ve({ className: e, ...n }) {
  return /* @__PURE__ */ t(
    "thead",
    {
      "data-slot": "table-header",
      className: h("[&_tr]:border-b", e),
      ...n
    }
  );
}
function Ke({ className: e, ...n }) {
  return /* @__PURE__ */ t(
    "tbody",
    {
      "data-slot": "table-body",
      className: h("[&_tr:last-child]:border-0", e),
      ...n
    }
  );
}
function L({ className: e, ...n }) {
  return /* @__PURE__ */ t(
    "tr",
    {
      "data-slot": "table-row",
      className: h("hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors", e),
      ...n
    }
  );
}
function _({ className: e, ...n }) {
  return /* @__PURE__ */ t(
    "th",
    {
      "data-slot": "table-head",
      className: h("text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0", e),
      ...n
    }
  );
}
function O({ className: e, ...n }) {
  return /* @__PURE__ */ t(
    "td",
    {
      "data-slot": "table-cell",
      className: h("p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0", e),
      ...n
    }
  );
}
function I({ data: e, title: n, icon: s }) {
  const a = Object.entries(e ?? {}), [o, r] = A(null);
  if (a.length === 0)
    return /* @__PURE__ */ i("div", { className: "mb-6", children: [
      /* @__PURE__ */ i("h4", { className: "flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2", children: [
        s && /* @__PURE__ */ t(s, { className: "h-3.5 w-3.5" }),
        n
      ] }),
      /* @__PURE__ */ i("p", { className: "text-xs text-muted-foreground/60 italic", children: [
        "No ",
        n.toLowerCase()
      ] })
    ] });
  const d = (l) => {
    r(o === l ? null : l);
  };
  return /* @__PURE__ */ i("div", { className: "mb-6 max-w-full overflow-hidden", children: [
    /* @__PURE__ */ i("h4", { className: "flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2", children: [
      s && /* @__PURE__ */ t(s, { className: "h-3.5 w-3.5" }),
      n
    ] }),
    /* @__PURE__ */ t("div", { className: "rounded border overflow-hidden", children: /* @__PURE__ */ i(Fe, { className: "table-fixed w-full", children: [
      /* @__PURE__ */ t(Ve, { children: /* @__PURE__ */ i(L, { className: "bg-muted/30", children: [
        /* @__PURE__ */ t(_, { className: "w-[180px] text-xs font-medium", children: "Name" }),
        /* @__PURE__ */ t(_, { className: "text-xs font-medium", children: "Value" })
      ] }) }),
      /* @__PURE__ */ t(Ke, { children: a.map(([l, m]) => {
        const g = o === l;
        return /* @__PURE__ */ i(
          L,
          {
            onClick: () => d(l),
            className: h(
              "cursor-pointer transition-colors hover:bg-muted/50",
              g && "bg-muted/30"
            ),
            children: [
              /* @__PURE__ */ t(
                O,
                {
                  className: h(
                    "font-mono text-xs py-2 text-muted-foreground align-top",
                    g ? "whitespace-pre-wrap break-all" : "truncate"
                  ),
                  children: l
                }
              ),
              /* @__PURE__ */ t(
                O,
                {
                  className: h(
                    "font-mono text-xs py-2",
                    g ? "whitespace-pre-wrap break-all" : "truncate"
                  ),
                  children: m
                }
              )
            ]
          },
          l
        );
      }) })
    ] }) })
  ] });
}
const Ye = 2e4;
function B({ content: e, language: n }) {
  if (!e)
    return /* @__PURE__ */ t("div", { className: "h-full flex items-center justify-center text-muted-foreground text-sm", children: "No content" });
  const s = e.length, a = (s / 1024).toFixed(1), o = s > Ye;
  return /* @__PURE__ */ i(v, { children: [
    /* @__PURE__ */ i("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ i(R, { variant: "outline", className: "text-[10px]", children: [
        a,
        " KB"
      ] }),
      o && /* @__PURE__ */ t("span", { className: "text-[10px] text-muted-foreground", children: "Syntax highlighting disabled (file too large)" })
    ] }),
    /* @__PURE__ */ t("div", { className: "rounded border bg-muted/30 overflow-hidden max-w-full", children: o ? /* @__PURE__ */ t("pre", { className: "font-mono text-xs whitespace-pre-wrap break-all p-4 overflow-x-hidden", children: e }) : /* @__PURE__ */ t(
      qe,
      {
        language: n || "text",
        style: Se,
        customStyle: {
          margin: 0,
          padding: "1rem",
          fontSize: "12px",
          background: "transparent",
          wordBreak: "break-all",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word"
        },
        wrapLongLines: !0,
        codeTagProps: {
          style: {
            wordBreak: "break-all",
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word"
          }
        },
        children: e
      }
    ) })
  ] });
}
function Xe(e) {
  return e ? e.includes("json") ? "json" : e.includes("xml") ? "xml" : e.includes("html") ? "html" : e.includes("javascript") ? "javascript" : e.includes("css") ? "css" : "text" : "text";
}
const Ze = [
  { value: "request", label: "Request", icon: me },
  { value: "payload", label: "Payload", icon: pe },
  { value: "response", label: "Response", icon: fe },
  { value: "data", label: "Data", icon: ge }
];
function et() {
  const e = c((l) => l.selectedRequestId), n = c((l) => l.requests), s = c((l) => l.savedRequests), a = e ? n[e] ?? s[e] ?? null : null;
  if (!a)
    return /* @__PURE__ */ t("div", { className: "h-full flex flex-col items-center justify-center text-muted-foreground", children: /* @__PURE__ */ t("p", { className: "text-sm font-medium", children: "Select a request" }) });
  const o = a.requestJson ? JSON.stringify(a.requestJson, null, 2) : a.requestFormData || a.requestBody || "", r = a.requestJson ? "json" : "text", d = Xe(a.responseMimeType);
  return /* @__PURE__ */ i(q.Root, { defaultValue: "request", className: "h-full flex flex-col overflow-hidden", children: [
    /* @__PURE__ */ t(q.List, { className: "shrink-0 flex border-b px-4 gap-1", children: Ze.map((l) => {
      const m = l.icon;
      return /* @__PURE__ */ i(
        q.Trigger,
        {
          value: l.value,
          className: h(
            "flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground",
            "border-b-2 border-transparent -mb-px",
            "hover:text-foreground transition-colors",
            "data-[state=active]:text-foreground data-[state=active]:border-primary"
          ),
          children: [
            /* @__PURE__ */ t(m, { className: "h-3.5 w-3.5" }),
            l.label
          ]
        },
        l.value
      );
    }) }),
    /* @__PURE__ */ i("div", { className: "flex-1 min-h-0 overflow-hidden pt-2", children: [
      /* @__PURE__ */ t(
        q.Content,
        {
          value: "request",
          className: "h-full focus:outline-none data-[state=inactive]:hidden",
          children: /* @__PURE__ */ t(E, { className: "h-full", children: /* @__PURE__ */ i("div", { className: "p-4", children: [
            /* @__PURE__ */ t(I, { data: a.requestHeaders, title: "Request Headers", icon: H }),
            /* @__PURE__ */ t(I, { data: a.requestCookies, title: "Request Cookies", icon: xe }),
            /* @__PURE__ */ t(I, { data: a.requestQueryParams, title: "Query Parameters", icon: H })
          ] }) })
        }
      ),
      /* @__PURE__ */ t(
        q.Content,
        {
          value: "payload",
          className: "h-full focus:outline-none data-[state=inactive]:hidden",
          children: /* @__PURE__ */ t(E, { className: "h-full", children: /* @__PURE__ */ t("div", { className: "p-4", children: /* @__PURE__ */ t(B, { content: o || null, language: r }) }) })
        }
      ),
      /* @__PURE__ */ t(
        q.Content,
        {
          value: "response",
          className: "h-full focus:outline-none data-[state=inactive]:hidden",
          children: /* @__PURE__ */ t(E, { className: "h-full", children: /* @__PURE__ */ t("div", { className: "p-4", children: /* @__PURE__ */ t(I, { data: a.responseHeaders, title: "Response Headers", icon: H }) }) })
        }
      ),
      /* @__PURE__ */ t(
        q.Content,
        {
          value: "data",
          className: "h-full focus:outline-none data-[state=inactive]:hidden",
          children: /* @__PURE__ */ t(E, { className: "h-full", children: /* @__PURE__ */ t("div", { className: "p-4", children: /* @__PURE__ */ t(B, { content: a.responseContent, language: d }) }) })
        }
      )
    ] })
  ] });
}
function tt() {
  const e = c((a) => a.connectionStatus), n = e === "connected", s = e === "connecting";
  return /* @__PURE__ */ i("div", { className: "absolute bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-lg", children: [
    /* @__PURE__ */ t(
      "span",
      {
        className: `h-2 w-2 rounded-full ${n ? "bg-primary" : s ? "bg-muted-foreground animate-pulse" : "bg-destructive"}`
      }
    ),
    /* @__PURE__ */ t("span", { className: "text-xs text-muted-foreground", children: n ? "Connected" : s ? "Connecting..." : "Disconnected" })
  ] });
}
function nt({ extensionId: e }) {
  const n = c((f) => f.connectionStatus), s = c((f) => f.startCapture), a = c((f) => Object.keys(f.requests).length), o = c((f) => f.availableTabCount), r = c((f) => f.isCapturing);
  if (a > 0)
    return null;
  const d = n === "connected", l = n === "connecting", m = o > 0;
  return /* @__PURE__ */ t("div", { className: "absolute inset-0 flex flex-col items-center justify-center bg-background/95 z-10", children: /* @__PURE__ */ i("div", { className: "flex flex-col items-center gap-4 text-center max-w-xs", children: [
    /* @__PURE__ */ t("div", { className: "p-4 rounded-full bg-muted", children: r ? /* @__PURE__ */ t(be, { className: "h-8 w-8 text-destructive animate-pulse" }) : /* @__PURE__ */ t(ve, { className: "h-8 w-8 text-muted-foreground" }) }),
    r ? /* @__PURE__ */ i(v, { children: [
      /* @__PURE__ */ t("p", { className: "text-sm text-muted-foreground", children: "Waiting for requests..." }),
      /* @__PURE__ */ t("p", { className: "text-xs text-muted-foreground/60", children: "Navigate to a page in one of the captured tabs" })
    ] }) : l ? /* @__PURE__ */ t(v, { children: /* @__PURE__ */ t("p", { className: "text-sm text-muted-foreground", children: "Connecting to extension..." }) }) : d ? /* @__PURE__ */ i(v, { children: [
      /* @__PURE__ */ t("p", { className: "text-sm text-muted-foreground", children: m ? `${o} tab${o !== 1 ? "s" : ""} available` : "No active tabs detected" }),
      /* @__PURE__ */ i(
        C,
        {
          onClick: s,
          className: "gap-2",
          disabled: !m,
          children: [
            /* @__PURE__ */ t($, { className: "h-4 w-4" }),
            "Start Capture"
          ]
        }
      )
    ] }) : /* @__PURE__ */ i(v, { children: [
      /* @__PURE__ */ t("p", { className: "text-sm text-muted-foreground", children: "Extension not connected" }),
      /* @__PURE__ */ i(C, { variant: "outline", onClick: () => {
        window.open(`chrome://extensions/?id=${e}`, "_blank");
      }, className: "gap-2", children: [
        /* @__PURE__ */ t(Ne, { className: "h-4 w-4" }),
        "Install Extension"
      ] })
    ] })
  ] }) });
}
function V({
  ...e
}) {
  return /* @__PURE__ */ t(w.Root, { "data-slot": "alert-dialog", ...e });
}
function at({
  ...e
}) {
  return /* @__PURE__ */ t(w.Portal, { "data-slot": "alert-dialog-portal", ...e });
}
function st({
  className: e,
  ...n
}) {
  return /* @__PURE__ */ t(
    w.Overlay,
    {
      "data-slot": "alert-dialog-overlay",
      className: h("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-50", e),
      ...n
    }
  );
}
function K({
  className: e,
  size: n = "default",
  ...s
}) {
  return /* @__PURE__ */ i(at, { children: [
    /* @__PURE__ */ t(st, {}),
    /* @__PURE__ */ t(
      w.Content,
      {
        "data-slot": "alert-dialog-content",
        "data-size": n,
        className: h(
          "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 bg-background ring-foreground/10 gap-4 rounded-none p-4 ring-1 duration-100 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-sm group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 outline-none",
          e
        ),
        ...s
      }
    )
  ] });
}
function Y({
  className: e,
  ...n
}) {
  return /* @__PURE__ */ t(
    "div",
    {
      "data-slot": "alert-dialog-header",
      className: h("grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-4 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]", e),
      ...n
    }
  );
}
function X({
  className: e,
  ...n
}) {
  return /* @__PURE__ */ t(
    "div",
    {
      "data-slot": "alert-dialog-footer",
      className: h(
        "flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
        e
      ),
      ...n
    }
  );
}
function Z({
  className: e,
  ...n
}) {
  return /* @__PURE__ */ t(
    w.Title,
    {
      "data-slot": "alert-dialog-title",
      className: h("text-sm font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2", e),
      ...n
    }
  );
}
function ee({
  className: e,
  ...n
}) {
  return /* @__PURE__ */ t(
    w.Description,
    {
      "data-slot": "alert-dialog-description",
      className: h("text-muted-foreground *:[a]:hover:text-foreground text-xs/relaxed text-balance md:text-pretty *:[a]:underline *:[a]:underline-offset-3", e),
      ...n
    }
  );
}
function te({
  className: e,
  variant: n = "default",
  size: s = "default",
  ...a
}) {
  return /* @__PURE__ */ t(C, { variant: n, size: s, asChild: !0, children: /* @__PURE__ */ t(
    w.Action,
    {
      "data-slot": "alert-dialog-action",
      className: h(e),
      ...a
    }
  ) });
}
function rt({
  className: e,
  variant: n = "outline",
  size: s = "default",
  ...a
}) {
  return /* @__PURE__ */ t(C, { variant: n, size: s, asChild: !0, children: /* @__PURE__ */ t(
    w.Cancel,
    {
      "data-slot": "alert-dialog-cancel",
      className: h(e),
      ...a
    }
  ) });
}
function ot() {
  const e = c((r) => r.attachedTabCount), n = c((r) => r.maxTabsWarningThreshold), s = c((r) => r.hasSeenTabsWarning), a = c((r) => r.dismissTabsWarning);
  return e > n && !s ? /* @__PURE__ */ t(V, { open: !0, children: /* @__PURE__ */ i(K, { children: [
    /* @__PURE__ */ i(Y, { children: [
      /* @__PURE__ */ t(Z, { children: "⚠️ Many Tabs Attached" }),
      /* @__PURE__ */ i(ee, { children: [
        "You are capturing from ",
        /* @__PURE__ */ i("strong", { children: [
          e,
          " tabs"
        ] }),
        ". This may significantly impact browser performance and memory usage."
      ] })
    ] }),
    /* @__PURE__ */ t(X, { children: /* @__PURE__ */ t(te, { onClick: a, children: "Okay" }) })
  ] }) }) : null;
}
function it() {
  const e = c((l) => l.maxRequestsWarningThreshold), n = c((l) => l.hasSeenRequestsWarning), s = c((l) => l.strictRequestsLimit), a = c((l) => l.clearRequests), o = c((l) => l.dismissRequestsWarning), r = c((l) => Object.keys(l.requests).length);
  return r > e && (s || !n) ? /* @__PURE__ */ t(V, { open: !0, children: /* @__PURE__ */ i(K, { children: [
    /* @__PURE__ */ i(Y, { children: [
      /* @__PURE__ */ t(Z, { children: "⚠️ High Request Count — Risk of Data Loss" }),
      /* @__PURE__ */ t(ee, { className: "space-y-2", children: s ? /* @__PURE__ */ i("p", { children: [
        "You have captured ",
        /* @__PURE__ */ t("strong", { children: r }),
        " requests.",
        /* @__PURE__ */ t("strong", { children: " You must clear requests to continue." })
      ] }) : /* @__PURE__ */ i(v, { children: [
        /* @__PURE__ */ i("p", { children: [
          "You have captured ",
          /* @__PURE__ */ t("strong", { children: r }),
          " requests. The application may become ",
          /* @__PURE__ */ t("strong", { children: "unresponsive" }),
          " or ",
          /* @__PURE__ */ t("strong", { children: "crash" }),
          "."
        ] }),
        /* @__PURE__ */ t("p", { className: "text-destructive font-medium", children: "⚠️ If the page crashes, you will lose all captured data." })
      ] }) })
    ] }),
    /* @__PURE__ */ i(X, { children: [
      !s && /* @__PURE__ */ t(rt, { onClick: o, children: "I Understand the Risk" }),
      /* @__PURE__ */ t(te, { onClick: a, children: "Clear Requests" })
    ] })
  ] }) }) : null;
}
const M = 100;
function vt({
  extensionId: e,
  maxRequestsWarningThreshold: n = 1e3,
  maxTabsWarningThreshold: s = 10,
  strictRequestsLimit: a = !1,
  className: o
}) {
  Ue(e);
  const r = c((d) => d.setWarningConfig);
  return W(() => {
    r({
      maxTabs: s,
      maxRequests: n,
      strict: a
    });
  }, [s, n, a, r]), /* @__PURE__ */ i("div", { className: `relative h-full w-full flex bg-background text-foreground overflow-hidden ${o ?? ""}`, children: [
    /* @__PURE__ */ i("div", { className: "w-[25%] h-full flex flex-col border-r", children: [
      /* @__PURE__ */ t("div", { style: { height: M, flexShrink: 0 }, className: "border-b", children: /* @__PURE__ */ t(Ae, {}) }),
      /* @__PURE__ */ t("div", { className: "flex-1 min-h-0 overflow-hidden", children: /* @__PURE__ */ t($e, {}) })
    ] }),
    /* @__PURE__ */ i("div", { className: "w-[75%] h-full flex flex-col", children: [
      /* @__PURE__ */ t("div", { style: { height: M, flexShrink: 0 }, className: "border-b", children: /* @__PURE__ */ t(Ge, {}) }),
      /* @__PURE__ */ t("div", { className: "flex-1 min-h-0 overflow-hidden", children: /* @__PURE__ */ t(et, {}) })
    ] }),
    /* @__PURE__ */ t(tt, {}),
    /* @__PURE__ */ t(nt, { extensionId: e }),
    /* @__PURE__ */ t(ot, {}),
    /* @__PURE__ */ t(it, {})
  ] });
}
function Nt() {
  const e = c((n) => n.savedRequests);
  return Object.values(e);
}
export {
  vt as HttpChainWebRecorder,
  Nt as useBookmarkedRequests
};
