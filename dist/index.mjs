import { create as A } from "zustand";
import { jsx as a, jsxs as b } from "react/jsx-runtime";
import { useEffect as N, useMemo as S, useRef as Q, useState as G, useCallback as J } from "react";
import { Trash2 as F, Play as D, Square as V, Bookmark as O, FileInput as Y, Code as K, ArrowDownToLine as X, Database as Z, Info as ee, BookmarkCheck as te, Braces as w, Cookie as ne, Search as se, Radio as re, Unplug as ae } from "lucide-react";
import { TextInput as oe } from "spectra/input-primitives";
import { cva as j } from "class-variance-authority";
import { Slot as U } from "radix-ui";
import { clsx as ie } from "clsx";
import { twMerge as ce } from "tailwind-merge";
import { Grid as ue } from "react-window";
import { NoContent as x, Loading as E, Error as de } from "spectra/state";
import { HttpRequestMetadata as le, KeyValuePairTable as T, FileCodeView as H } from "spectra/fragments";
import { GroupTab as he, Group as I, GroupItem as C } from "spectra/group";
import { WarningDialog as L, ConfirmDialog as pe } from "spectra/dialogs";
function z(e, s) {
  if (!e) return;
  const r = s.toLowerCase(), t = Object.keys(e).find((o) => o.toLowerCase() === r);
  return t ? e[t] : void 0;
}
function ge(e) {
  if (!e) return {};
  const s = {};
  return e.split(";").forEach((r) => {
    const [t, ...o] = r.split("=");
    t && (s[t.trim()] = o.join("=").trim());
  }), s;
}
function me(e) {
  try {
    const s = {};
    return new URL(e).searchParams.forEach((r, t) => {
      s[t] = r;
    }), s;
  } catch {
    return {};
  }
}
function fe(e, s) {
  if (!e) return { formData: null, json: null };
  if (s?.includes("application/json"))
    try {
      return { formData: null, json: JSON.parse(e) };
    } catch {
      return { formData: null, json: null };
    }
  return s?.includes("x-www-form-urlencoded") ? { formData: e, json: null } : { formData: null, json: null };
}
function be(e) {
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
function ve(e) {
  const s = e.requestHeaders || {}, r = e.responseHeaders || {}, t = z(s, "content-type"), { formData: o, json: n } = fe(e.requestBody, t), c = {
    id: crypto.randomUUID(),
    timestamp: e.timestamp,
    tabId: e.tabId || 0,
    tabName: e.tabTitle || `Tab ${e.tabId || "Unknown"}`,
    requestName: "",
    requestUrl: e.url,
    requestMethod: (e.method || "GET").toUpperCase(),
    requestHeaders: s,
    requestCookies: ge(z(s, "cookie")),
    requestQueryParams: me(e.url),
    requestFormData: o,
    requestJson: n,
    requestBody: e.requestBody,
    responseStatus: e.responseStatus || 0,
    responseStatusText: e.statusText || "",
    responseHeaders: r,
    responseMimeType: e.mimeType || "",
    responseContent: e.responseBody,
    searchableText: ""
  };
  return c.searchableText = be(c), c;
}
class xe {
  port = null;
  pingInterval = null;
  callbacks = null;
  connect(s, r) {
    if (typeof chrome > "u" || !chrome.runtime?.connect) {
      console.error("[HTTPChain] Chrome runtime not available"), r.onStatusChange("disconnected");
      return;
    }
    this.callbacks = r, r.onStatusChange("connecting");
    try {
      this.port = chrome.runtime.connect(s, { name: "httpchain-recorder" }), this.port.onMessage.addListener((t) => {
        switch (t.type) {
          case "CONNECTED":
            this.callbacks?.onStatusChange("connected"), this.callbacks?.onStateUpdate(
              t.isCapturing || !1,
              t.tabCount || 0,
              t.attachedTabCount || 0
            );
            break;
          case "PONG":
            break;
          case "STATE_UPDATE":
            this.callbacks?.onStateUpdate(
              t.isCapturing || !1,
              t.tabCount || 0,
              t.attachedTabCount || 0
            );
            break;
          case "CAPTURE_STARTED":
            this.callbacks?.onCaptureChange(!0, t.attachedTabCount || 0);
            break;
          case "CAPTURE_STOPPED":
            this.callbacks?.onCaptureChange(!1, 0);
            break;
          case "REQUEST_CAPTURED":
            if (t.data) {
              const o = ve(t.data);
              this.callbacks?.onRequest(o);
            }
            break;
          case "ERROR":
            console.error("[HTTPChain]", t.error);
            break;
        }
      }), this.port.onDisconnect.addListener(() => {
        this.port = null, this.callbacks?.onStatusChange("disconnected"), this.callbacks?.onCaptureChange(!1, 0), this.stopPing();
      }), this.startPing();
    } catch (t) {
      console.error("[HTTPChain] Connection error:", t), r.onStatusChange("disconnected");
    }
  }
  disconnect() {
    this.port && (this.port.disconnect(), this.port = null), this.stopPing(), this.callbacks?.onStatusChange("disconnected");
  }
  send(s) {
    this.port?.postMessage(s);
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
const y = new xe(), Ce = {
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
}, i = A((e, s) => ({
  ...Ce,
  // Connection actions
  connect: (r) => {
    const t = {
      onStatusChange: (o) => s().setConnectionStatus(o),
      onRequest: (o) => s().addRequest(o),
      onCaptureChange: (o, n) => s().setCapturing(o, n),
      onStateUpdate: (o, n, c) => s().setExtensionState(o, n, c)
    };
    y.connect(r, t);
  },
  disconnect: () => {
    y.disconnect();
  },
  startCapture: () => {
    y.send({ type: "START_CAPTURE" });
  },
  stopCapture: () => {
    y.send({ type: "STOP_CAPTURE" });
  },
  // Request actions
  addRequest: (r) => {
    e((t) => ({
      requests: { ...t.requests, [r.id]: r }
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
  saveRequest: (r, t) => {
    e((o) => {
      const n = o.requests[r];
      return n ? {
        savedRequests: {
          ...o.savedRequests,
          [r]: { ...n, requestName: t }
        }
      } : o;
    });
  },
  unsaveRequest: (r) => {
    e((t) => {
      const { [r]: o, ...n } = t.savedRequests;
      return { savedRequests: n };
    });
  },
  // UI actions
  setSelectedRequestId: (r) => {
    e({ selectedRequestId: r });
  },
  setSearchQuery: (r) => {
    e({ searchQuery: r });
  },
  // Internal actions
  setConnectionStatus: (r) => {
    e({ connectionStatus: r });
  },
  setCapturing: (r, t) => {
    e({ isCapturing: r, attachedTabCount: t });
  },
  setExtensionState: (r, t, o) => {
    e({ isCapturing: r, availableTabCount: t, attachedTabCount: o });
  },
  // Warning Configuration
  setWarningConfig: (r) => {
    e({
      ...r.maxTabs !== void 0 && { maxTabsWarningThreshold: r.maxTabs },
      ...r.maxRequests !== void 0 && { maxRequestsWarningThreshold: r.maxRequests },
      ...r.strict !== void 0 && { strictRequestsLimit: r.strict }
    });
  },
  dismissTabsWarning: () => {
    e({ hasSeenTabsWarning: !0 });
  },
  dismissRequestsWarning: () => {
    e({ hasSeenRequestsWarning: !0 });
  }
}));
function qe(e) {
  const s = i((t) => t.connect), r = i((t) => t.setWarningConfig);
  return N(() => {
    s(e);
  }, [e, s]), { setWarningConfig: r };
}
function M(...e) {
  return ce(ie(e));
}
const Te = j(
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
function k({
  className: e,
  variant: s = "default",
  size: r = "default",
  asChild: t = !1,
  ...o
}) {
  const n = t ? U.Root : "button";
  return /* @__PURE__ */ a(
    n,
    {
      "data-slot": "button",
      "data-variant": s,
      "data-size": r,
      className: M(Te({ variant: s, size: r, className: e })),
      ...o
    }
  );
}
const P = 25;
function R(e, s) {
  const r = e.toLowerCase(), t = s.toLowerCase(), o = r.indexOf(t);
  if (o === -1) return null;
  const n = Math.max(0, o - P), c = Math.min(e.length, o + s.length + P), u = n > 0 ? "..." : "", l = c < e.length ? "..." : "";
  return {
    matchedText: `${u}${e.slice(n, c)}${l}`,
    highlightText: e.slice(o, o + s.length)
  };
}
function B(e, s) {
  return S(() => {
    if (!s.trim())
      return e.map((t) => ({
        request: t,
        matchedField: "",
        matchedText: "",
        highlightText: ""
      }));
    const r = s.toLowerCase();
    return e.filter((t) => t.searchableText?.includes(r)).map((t) => {
      let o = R(t.requestUrl, s), n = "URL";
      if (!o && t.responseContent && (o = R(t.responseContent, s), n = "Response"), !o && t.requestBody && (o = R(t.requestBody, s), n = "Request Body"), !o) {
        const c = JSON.stringify(t.requestHeaders);
        o = R(c, s), n = "Headers";
      }
      return {
        request: t,
        matchedField: n,
        matchedText: o?.matchedText || "",
        highlightText: o?.highlightText || s
      };
    });
  }, [e, s]);
}
function ye() {
  const e = i((h) => h.searchQuery), s = i((h) => h.setSearchQuery), r = i((h) => h.clearRequests), t = i((h) => h.startCapture), o = i((h) => h.stopCapture), n = i((h) => h.isCapturing), c = i((h) => h.connectionStatus), u = i((h) => h.requests), l = S(() => Object.values(u), [u]), d = B(l, e), g = c === "connected";
  return /* @__PURE__ */ a("div", { className: "p-2 bg-background", children: /* @__PURE__ */ b("div", { className: "flex items-center gap-1", children: [
    /* @__PURE__ */ a("div", { className: "flex-1", children: /* @__PURE__ */ a(
      oe,
      {
        value: e,
        onChange: s,
        placeholder: e ? `${d.length} of ${l.length} requests...` : `Search ${l.length} requests...`
      }
    ) }),
    /* @__PURE__ */ a(
      k,
      {
        size: "sm",
        variant: "ghost",
        onClick: r,
        disabled: l.length === 0,
        className: "h-8 w-8 p-0 shrink-0",
        title: "Clear all requests",
        children: /* @__PURE__ */ a(F, { className: "h-4 w-4" })
      }
    ),
    n ? /* @__PURE__ */ a(
      k,
      {
        size: "sm",
        variant: "ghost",
        onClick: o,
        className: "h-8 w-8 p-0 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10",
        title: "Stop capture",
        children: /* @__PURE__ */ a(V, { className: "h-4 w-4 fill-current" })
      }
    ) : /* @__PURE__ */ a(
      k,
      {
        size: "sm",
        variant: "ghost",
        onClick: t,
        disabled: !g,
        className: "h-8 w-8 p-0 shrink-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10",
        title: "Start capture",
        children: /* @__PURE__ */ a(D, { className: "h-4 w-4 fill-current" })
      }
    )
  ] }) });
}
const Re = j(
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
function W({
  className: e,
  variant: s = "default",
  asChild: r = !1,
  ...t
}) {
  const o = r ? U.Root : "span";
  return /* @__PURE__ */ a(
    o,
    {
      "data-slot": "badge",
      "data-variant": s,
      className: M(Re({ variant: s }), e),
      ...t
    }
  );
}
function Se({ text: e, highlight: s }) {
  if (!s || !e) return /* @__PURE__ */ a("span", { children: e });
  const r = e.split(new RegExp(`(${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return /* @__PURE__ */ a("span", { children: r.map(
    (t, o) => t.toLowerCase() === s.toLowerCase() ? /* @__PURE__ */ a("mark", { className: "bg-primary/30 text-primary rounded-sm px-0.5", children: t }, o) : t
  ) });
}
function ke(e, s = 60) {
  if (!e) return "";
  try {
    const r = new URL(e), t = r.pathname + r.search;
    return t.length <= s ? t : t.slice(0, s) + "...";
  } catch {
    return e.length <= s ? e : e.slice(0, s) + "...";
  }
}
function Ne(e) {
  return new Date(e).toLocaleTimeString("en-US", {
    hour12: !1,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
function we({ result: e, isSelected: s, isSaved: r, onSelect: t, style: o }) {
  const { request: n, matchedText: c, highlightText: u } = e, l = n.responseStatus >= 200 && n.responseStatus < 300, d = n.responseStatus >= 400;
  return /* @__PURE__ */ b(
    "div",
    {
      style: o,
      onClick: t,
      className: `group cursor-pointer border-b px-4 py-3 transition-colors hover:bg-muted/50 overflow-hidden ${s ? "bg-muted border-l-2 border-l-primary" : ""}`,
      children: [
        /* @__PURE__ */ b("div", { className: "flex items-center gap-2 mb-1.5", children: [
          /* @__PURE__ */ a(W, { variant: "secondary", className: "shrink-0 font-mono text-[11px] font-bold px-2 py-0.5", children: n.requestMethod }),
          /* @__PURE__ */ a(
            W,
            {
              variant: "outline",
              className: `shrink-0 text-[11px] font-medium px-2 py-0.5 ${d ? "border-destructive text-destructive" : l ? "border-primary text-primary" : "border-muted-foreground/50"}`,
              children: n.responseStatus || "..."
            }
          ),
          r && /* @__PURE__ */ a(O, { className: "h-3.5 w-3.5 shrink-0 fill-primary text-primary" }),
          /* @__PURE__ */ a("span", { className: "ml-auto font-mono text-[11px] text-muted-foreground shrink-0", children: Ne(n.timestamp) })
        ] }),
        /* @__PURE__ */ a("p", { className: "font-mono text-[13px] text-foreground/90 truncate font-medium mb-1", title: n.requestUrl, children: ke(n.requestUrl) }),
        c && /* @__PURE__ */ a("p", { className: "text-[11px] text-muted-foreground mt-1 line-clamp-2 break-all leading-tight", children: /* @__PURE__ */ a(Se, { text: c, highlight: u }) })
      ]
    }
  );
}
const Ee = 72, He = 104;
function Ie() {
  const e = i((p) => p.searchQuery), s = i((p) => p.selectedRequestId), r = i((p) => p.setSelectedRequestId), t = i((p) => p.savedRequests), o = i((p) => p.requests), n = S(() => Object.values(o), [o]), u = e.trim().length > 0 ? He : Ee, l = Q(null), [d, g] = G({ width: 360, height: 400 }), h = B(n, e), q = S(() => {
    const p = [], v = [];
    return h.forEach((f) => {
      f.request.id in t ? p.push(f) : v.push(f);
    }), [...p, ...v];
  }, [h, t]);
  N(() => {
    const p = l.current;
    if (!p) return;
    const v = () => {
      const m = p.getBoundingClientRect();
      m.width > 0 && m.height > 0 && g({ width: m.width, height: m.height });
    };
    v();
    const f = new ResizeObserver(v);
    return f.observe(p), () => f.disconnect();
  }, []);
  const $ = J(({ columnIndex: p, rowIndex: v, style: f }) => {
    const m = q[v];
    if (!m) return /* @__PURE__ */ a("div", { style: f });
    const _ = m.request.id in t;
    return /* @__PURE__ */ a(
      we,
      {
        result: m,
        isSelected: s === m.request.id,
        isSaved: _,
        onSelect: () => r(m.request.id),
        style: f
      }
    );
  }, [q, s, t, r]);
  return q.length === 0 ? /* @__PURE__ */ a("div", { ref: l, className: "h-full w-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground", children: /* @__PURE__ */ a(x, { title: "No results found" }) }) : /* @__PURE__ */ b("div", { ref: l, className: "h-full w-full overflow-hidden sidebar-list-container", children: [
    /* @__PURE__ */ a("style", { children: `
                
            ` }),
    /* @__PURE__ */ a(
      ue,
      {
        columnCount: 1,
        columnWidth: d.width,
        defaultHeight: d.height,
        defaultWidth: d.width,
        rowCount: q.length,
        rowHeight: u,
        cellComponent: $,
        cellProps: {},
        style: {
          height: d.height,
          width: "100%"
        }
      }
    )
  ] });
}
function ze() {
  const e = i((d) => d.selectedRequestId), s = i((d) => d.requests), r = i((d) => d.savedRequests), t = i((d) => d.saveRequest), o = i((d) => d.unsaveRequest), n = e ? s[e] ?? r[e] ?? null : null;
  if (!n || !e)
    return /* @__PURE__ */ a(x, { title: "Select a request" });
  const c = e in r, u = () => {
    if (c)
      o(e);
    else {
      const d = n.requestUrl.split("/").pop() || "Request";
      t(e, d);
    }
  }, l = n.requestJson ? JSON.stringify(n.requestJson, null, 2) : n.requestFormData || n.requestBody || "";
  return /* @__PURE__ */ a(
    he,
    {
      className: "h-full",
      orientation: "horizontal",
      size: "sm",
      items: [
        {
          title: "Request",
          icon: Y,
          children: /* @__PURE__ */ b(I, { children: [
            /* @__PURE__ */ a(C, { size: "sm", title: "General", icon: ee, defaultExpanded: !0, children: /* @__PURE__ */ a(
              le,
              {
                method: n.requestMethod,
                url: n.requestUrl,
                status: n.responseStatus,
                statusText: n.responseStatusText,
                mimeType: n.responseMimeType,
                showActionButton: !0,
                actionButtonText: c ? "Saved" : "Save",
                actionButtonIcon: c ? te : O,
                onActionButtonClick: u
              }
            ) }),
            Object.keys(n.requestHeaders ?? {}).length > 0 && /* @__PURE__ */ a(C, { size: "sm", title: "Headers", icon: w, defaultExpanded: !0, children: /* @__PURE__ */ a(T, { data: n.requestHeaders, hideHeader: !0 }) }),
            Object.keys(n.requestCookies ?? {}).length > 0 && /* @__PURE__ */ a(C, { size: "sm", title: "Cookies", icon: ne, defaultExpanded: !0, children: /* @__PURE__ */ a(T, { data: n.requestCookies, hideHeader: !0 }) }),
            Object.keys(n.requestQueryParams ?? {}).length > 0 && /* @__PURE__ */ a(C, { size: "sm", title: "Query Parameters", icon: se, defaultExpanded: !0, children: /* @__PURE__ */ a(T, { data: n.requestQueryParams, hideHeader: !0 }) })
          ] })
        },
        {
          title: "Payload",
          icon: K,
          children: l ? /* @__PURE__ */ a(
            H,
            {
              filename: n.requestJson ? "request.json" : "request",
              content: l,
              showLineNumbers: !0,
              wrapLines: !0,
              maxHeight: "100%",
              mimeType: n.requestHeaders?.["content-type"] || n.requestHeaders?.["Content-Type"]
            }
          ) : /* @__PURE__ */ a(x, { title: "No Payload" })
        },
        {
          title: "Response",
          icon: X,
          children: /* @__PURE__ */ a(I, { children: Object.keys(n.responseHeaders ?? {}).length > 0 ? /* @__PURE__ */ a(C, { size: "sm", title: "Headers", icon: w, defaultExpanded: !0, children: /* @__PURE__ */ a(T, { data: n.responseHeaders, hideHeader: !0 }) }) : /* @__PURE__ */ a("div", { className: "p-4", children: /* @__PURE__ */ a(x, { title: "No Response Headers" }) }) })
        },
        {
          title: "Data",
          icon: Z,
          children: n.responseContent ? /* @__PURE__ */ a(
            H,
            {
              filename: n.responseMimeType?.includes("json") ? "response.json" : "response",
              content: n.responseContent,
              showLineNumbers: !0,
              wrapLines: !0,
              maxHeight: "100%",
              mimeType: n.responseMimeType
            }
          ) : /* @__PURE__ */ a(x, { title: "No Response Data" })
        }
      ]
    }
  );
}
function Pe() {
  const e = i((n) => n.connectionStatus), s = i((n) => n.isCapturing), r = i((n) => n.attachedTabCount), t = e === "connected", o = e === "connecting";
  return /* @__PURE__ */ b("div", { className: "absolute bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-lg", children: [
    /* @__PURE__ */ a(
      "span",
      {
        className: `h-2 w-2 rounded-full ${t ? s ? "bg-destructive animate-pulse" : "bg-primary" : o ? "bg-muted-foreground animate-pulse" : "bg-destructive"}`
      }
    ),
    /* @__PURE__ */ a("span", { className: "text-xs text-muted-foreground", children: t ? s ? `Capturing ${r} ${r === 1 ? "tab" : "tabs"}` : "Connected" : o ? "Connecting..." : "Disconnected" })
  ] });
}
function We({ extensionId: e }) {
  const s = i((g) => g.connectionStatus), r = i((g) => g.startCapture), t = i((g) => Object.keys(g.requests).length), o = i((g) => g.availableTabCount), n = i((g) => g.isCapturing);
  if (t > 0)
    return null;
  const c = s === "connected", u = s === "connecting", l = o > 0;
  return /* @__PURE__ */ a("div", { className: "absolute inset-0 flex flex-col items-center justify-center bg-background/95 z-10", children: n ? (
    // Capturing state - waiting for requests
    /* @__PURE__ */ a(
      E,
      {
        title: "Waiting for requests...",
        size: "lg"
      }
    )
  ) : u ? (
    // Connecting state
    /* @__PURE__ */ a(
      E,
      {
        title: "Connecting to extension...",
        size: "lg"
      }
    )
  ) : c ? (
    // Connected but not capturing - prompt to start
    /* @__PURE__ */ a(
      x,
      {
        icon: l ? D : re,
        title: l ? `${o} tab${o !== 1 ? "s" : ""} available` : "No active tabs detected",
        actionLabel: "Start Capture",
        onAction: r,
        size: "lg"
      }
    )
  ) : (
    // Disconnected - show error state
    /* @__PURE__ */ a(
      de,
      {
        icon: ae,
        title: "Extension not connected",
        actionLabel: "Install Extension",
        onAction: () => {
          window.open(`chrome://extensions/?id=${e}`, "_blank");
        },
        size: "lg"
      }
    )
  ) });
}
function De() {
  const e = i((n) => n.attachedTabCount), s = i((n) => n.maxTabsWarningThreshold), r = i((n) => n.hasSeenTabsWarning), t = i((n) => n.dismissTabsWarning), o = e > s && !r;
  return /* @__PURE__ */ a(
    L,
    {
      open: o,
      onOpenChange: (n) => !n && t(),
      onProceed: t,
      title: "Many Tabs Attached",
      description: `You are capturing from ${e} tabs. This may significantly impact browser performance and memory usage.`,
      proceedText: "Okay"
    }
  );
}
function Oe() {
  const e = i((u) => u.maxRequestsWarningThreshold), s = i((u) => u.hasSeenRequestsWarning), r = i((u) => u.strictRequestsLimit), t = i((u) => u.clearRequests), o = i((u) => u.dismissRequestsWarning), n = i((u) => Object.keys(u.requests).length), c = n > e && (r || !s);
  return r ? /* @__PURE__ */ a(
    L,
    {
      open: c,
      onOpenChange: () => {
      },
      onProceed: t,
      title: "High Request Count — Risk of Data Loss",
      description: `You have captured ${n} requests. You must clear requests to continue.`,
      proceedText: "Clear Requests"
    }
  ) : /* @__PURE__ */ a(
    pe,
    {
      open: c,
      onOpenChange: (u) => !u && o(),
      onConfirm: t,
      title: "High Request Count — Risk of Data Loss",
      description: `You have captured ${n} requests. The application may become unresponsive or crash. If the page crashes, you will lose all captured data.`,
      confirmText: "Clear Requests",
      variant: "destructive"
    }
  );
}
const je = 48;
function Xe({
  extensionId: e,
  maxRequestsWarningThreshold: s = 1e3,
  maxTabsWarningThreshold: r = 10,
  strictRequestsLimit: t = !1,
  className: o
}) {
  qe(e);
  const n = i((c) => c.setWarningConfig);
  return N(() => {
    n({
      maxTabs: r,
      maxRequests: s,
      strict: t
    });
  }, [r, s, t, n]), /* @__PURE__ */ b("div", { className: `relative h-full w-full flex bg-background text-foreground overflow-hidden ${o ?? ""}`, children: [
    /* @__PURE__ */ b("div", { className: "w-[25%] h-full flex flex-col border-r", children: [
      /* @__PURE__ */ a("div", { style: { height: je, flexShrink: 0 }, className: "border-b", children: /* @__PURE__ */ a(ye, {}) }),
      /* @__PURE__ */ a("div", { className: "flex-1 min-h-0 overflow-hidden", children: /* @__PURE__ */ a(Ie, {}) })
    ] }),
    /* @__PURE__ */ a("div", { className: "w-[75%] h-full flex flex-col", children: /* @__PURE__ */ a("div", { className: "flex-1 min-h-0 overflow-hidden", children: /* @__PURE__ */ a(ze, {}) }) }),
    /* @__PURE__ */ a(Pe, {}),
    /* @__PURE__ */ a(We, { extensionId: e }),
    /* @__PURE__ */ a(De, {}),
    /* @__PURE__ */ a(Oe, {})
  ] });
}
function Ze() {
  const e = i((s) => s.savedRequests);
  return Object.values(e);
}
export {
  Xe as HttpChainWebRecorder,
  Ze as useBookmarkedRequests
};
