"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useLang } from "@/lib/i18n/context";
import { t } from "@/lib/i18n";
import type { AzureConfig } from "@/lib/api";
import {
  saveAzureConfigAction,
  testAzureConnectionAction,
  syncAzureUsersAction,
} from "../actions";

type Platform = {
  id: string;
  name: string;
  logo: string;
  description: string;
  steps: (cfg: Config) => Step[];
};

type Step = {
  title: string;
  content: string;
  code?: string;
};

type Config = {
  gatewayHost: string;
  gatewayPort: string;
  apiKey: string;
  tenantSlug: string;
};

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative mt-2 group">
      <pre className="bg-gray-950 text-green-300 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded bg-gray-800 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}

const PLATFORMS: Platform[] = [
  {
    id: "microsoft365",
    name: "Microsoft 365 / Exchange Online",
    logo: "🏢",
    description: "Centralised outbound signature injection via Mail Flow connector.",
    steps: (cfg) => [
      {
        title: "1. Open Exchange Admin Center",
        content: "Go to exchange.microsoft.com → Mail flow → Connectors.",
      },
      {
        title: "2. Create Outbound Connector",
        content:
          "Click + Add a connector. Set:\n• From: Office 365\n• To: Partner organization\n• Name: Signature Gateway",
      },
      {
        title: "3. Configure Smart Host",
        content: "Select Route email through these smart hosts and add:",
        code: cfg.gatewayHost,
      },
      {
        title: "4. Set Port",
        content: `Use port ${cfg.gatewayPort}. Enable TLS if your gateway supports it.`,
      },
      {
        title: "5. Create Transport Rule (optional scope)",
        content:
          "Mail flow → Rules → Add rule to apply connector only to specific senders or domains if needed.",
      },
      {
        title: "6. Verify",
        content:
          "Send a test email and check the rendered signature appears. Check Analytics in the panel to confirm traffic.",
      },
    ],
  },
  {
    id: "google",
    name: "Google Workspace (Gmail)",
    logo: "📧",
    description: "Route outbound mail via SMTP relay to inject signatures server-side.",
    steps: (cfg) => [
      {
        title: "1. Open Google Admin Console",
        content: "Go to admin.google.com → Apps → Google Workspace → Gmail → Routing.",
      },
      {
        title: "2. Add SMTP Relay",
        content:
          "Scroll to SMTP relay service → Configure. This sets up an outbound relay for all Gmail messages.",
      },
      {
        title: "3. Alternatively use Outbound Gateway",
        content: "Admin Console → Apps → Gmail → Advanced settings → Outbound gateway:",
        code: cfg.gatewayHost,
      },
      {
        title: "4. Port",
        content: `Set port to ${cfg.gatewayPort}. If using SMTP relay, add allowed IPs or use authentication.`,
      },
      {
        title: "5. Verify",
        content:
          "Send a test from a Google Workspace account. Check the email footer for the injected signature.",
      },
    ],
  },
  {
    id: "exchange",
    name: "Exchange On-Premises",
    logo: "🖥️",
    description: "Configure a Send Connector to route outbound mail through the gateway.",
    steps: (cfg) => [
      {
        title: "1. Open Exchange Management Shell",
        content: "On your Exchange server, open the Exchange Management Shell (EMS).",
      },
      {
        title: "2. Create Send Connector",
        content: "Run the following command:",
        code: `New-SendConnector -Name "Signature Gateway" \\
  -AddressSpaces "*" \\
  -SmartHosts "${cfg.gatewayHost}" \\
  -SmartHostAuthMechanism None \\
  -Port ${cfg.gatewayPort} \\
  -Usage Internet`,
      },
      {
        title: "3. Or via EAC",
        content:
          "Exchange Admin Center → Mail flow → Send connectors → Add. Set smart host to the gateway address.",
      },
      {
        title: "4. Verify",
        content: "Send a test email. The signature should be appended automatically.",
      },
    ],
  },
  {
    id: "postfix",
    name: "Postfix",
    logo: "📮",
    description: "Add relayhost to main.cf to forward all outbound mail through the gateway.",
    steps: (cfg) => [
      {
        title: "1. Edit main.cf",
        content: "Open /etc/postfix/main.cf and add or update relayhost:",
        code: `relayhost = [${cfg.gatewayHost}]:${cfg.gatewayPort}`,
      },
      {
        title: "2. Reload Postfix",
        content: "Apply the configuration:",
        code: `postfix reload`,
      },
      {
        title: "3. Verify",
        content: "Send a test email via sendmail or mailx and check the result.",
        code: `echo "Test body" | mail -s "Signature Test" test@yourdomain.com`,
      },
    ],
  },
  {
    id: "sendmail",
    name: "Sendmail",
    logo: "📬",
    description: "Configure Sendmail to use the gateway as a smart relay.",
    steps: (cfg) => [
      {
        title: "1. Edit sendmail.mc",
        content: "Open /etc/mail/sendmail.mc and add the SMART_HOST definition:",
        code: `define(\`SMART_HOST', \`[${cfg.gatewayHost}]')dnl
define(\`SMTP_MAILER_ARGS', \`TCP $h ${cfg.gatewayPort}')dnl`,
      },
      {
        title: "2. Rebuild sendmail.cf",
        content: "",
        code: `m4 /etc/mail/sendmail.mc > /etc/mail/sendmail.cf
service sendmail restart`,
      },
      {
        title: "3. Verify",
        content: "Send a test and inspect the email headers for relay trace.",
      },
    ],
  },
  {
    id: "zoho",
    name: "Zoho Mail",
    logo: "📩",
    description: "Use Zoho Mail outbound relay settings to route through the gateway.",
    steps: (cfg) => [
      {
        title: "1. Open Zoho Mail Admin",
        content: "Go to mail.zoho.com → Admin Console → Mail Policies → Outbound Relay.",
      },
      {
        title: "2. Add Relay Host",
        content: "Enter the gateway details:",
        code: `Host: ${cfg.gatewayHost}\nPort: ${cfg.gatewayPort}`,
      },
      {
        title: "3. Save & Verify",
        content: "Save the relay settings and send a test email from a Zoho address.",
      },
    ],
  },
  {
    id: "generic",
    name: "Generic SMTP Relay",
    logo: "⚙️",
    description: "Any mail platform that supports SMTP smart host / relay.",
    steps: (cfg) => [
      {
        title: "Gateway Connection Details",
        content: "Use these details in your mail platform's outbound relay or smart host settings:",
        code: `Host:     ${cfg.gatewayHost}\nPort:     ${cfg.gatewayPort}\nProtocol: SMTP (STARTTLS optional)`,
      },
      {
        title: "How It Works",
        content:
          "The gateway accepts any SMTP connection, injects the correct signature based on the From: address, and forwards the email to the final destination. No credentials needed (or configure your platform to include X-API-Key header if required).",
      },
      {
        title: "Troubleshooting",
        content:
          "If signatures are not appearing:\n• Confirm the From: address domain is registered under Domains for this tenant.\n• Check that at least one Template is marked as Default or a matching Rule exists.\n• Review gateway logs: docker compose logs gateway",
      },
    ],
  },
];

function AzureSection({
  tenantId,
  initialConfig,
}: {
  tenantId: string;
  initialConfig: AzureConfig | null;
}) {
  const { T } = useLang();
  const [open, setOpen] = useState(false);

  const [azureTenantId, setAzureTenantId] = useState(initialConfig?.azure_tenant_id ?? "");
  const [clientId, setClientId] = useState(initialConfig?.azure_client_id ?? "");
  const [secret, setSecret] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(initialConfig?.azure_sync_enabled ?? false);
  const [secretSet, setSecretSet] = useState(initialConfig?.azure_secret_set ?? false);
  const [lastSyncAt, setLastSyncAt] = useState(initialConfig?.azure_last_sync_at ?? null);
  const [lastCreated, setLastCreated] = useState(initialConfig?.azure_last_sync_created ?? 0);
  const [lastUpdated, setLastUpdated] = useState(initialConfig?.azure_last_sync_updated ?? 0);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await saveAzureConfigAction(tenantId, {
        azure_tenant_id: azureTenantId || null,
        azure_client_id: clientId || null,
        azure_client_secret: secret || undefined,
        azure_sync_enabled: syncEnabled,
      });
      setSecretSet(res.azure_secret_set);
      setSecret("");
      setMsg({ text: T.common.saved, ok: true });
    } catch {
      setMsg({ text: T.common.error, ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMsg(null);
    try {
      const res = await testAzureConnectionAction(tenantId);
      setMsg({ text: t(T.azure.test_ok, { n: String(res.user_count) }), ok: true });
    } catch {
      setMsg({ text: T.azure.test_fail, ok: false });
    } finally {
      setTesting(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setMsg(null);
    try {
      const res = await syncAzureUsersAction(tenantId);
      setLastSyncAt(res.synced_at);
      setLastCreated(res.created);
      setLastUpdated(res.updated);
      setMsg({
        text: t(T.azure.sync_done, { created: String(res.created), updated: String(res.updated) }),
        ok: true,
      });
    } catch {
      setMsg({ text: T.common.error, ok: false });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div>
          <p className="text-sm font-semibold">{T.azure.section_title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{T.azure.section_desc}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-5 py-5 space-y-5 bg-white">
          {/* How-to guide */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">{T.azure.how_to_title}</p>
            <p className="text-xs text-blue-800 whitespace-pre-line">{T.azure.how_to_steps}</p>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{T.azure.tenant_id_label}</label>
              <input
                value={azureTenantId}
                onChange={(e) => setAzureTenantId(e.target.value)}
                placeholder={T.azure.tenant_id_ph}
                className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{T.azure.client_id_label}</label>
              <input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder={T.azure.client_id_ph}
                className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">{T.azure.secret_label}</label>
              {secretSet && !secret && (
                <p className="text-xs text-green-600 mb-1">{T.azure.secret_set}</p>
              )}
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={T.azure.secret_ph}
                className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          {/* Toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setSyncEnabled((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${syncEnabled ? "bg-brand" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${syncEnabled ? "translate-x-5" : "translate-x-0"}`}
              />
            </div>
            <span className="text-sm">{T.azure.enabled_label}</span>
          </label>

          {/* Last sync status */}
          <p className="text-xs text-gray-500">
            {T.azure.last_sync}{" "}
            {lastSyncAt
              ? `${new Date(lastSyncAt).toLocaleString()} — ${t(T.azure.last_sync_result, { created: String(lastCreated), updated: String(lastUpdated) })}`
              : T.azure.never_synced}
          </p>

          {/* Message */}
          {msg && (
            <p className={`text-sm font-medium ${msg.ok ? "text-green-600" : "text-red-500"}`}>
              {msg.text}
            </p>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
            >
              {saving ? T.azure.saving : T.azure.save_btn}
            </button>
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {testing ? T.azure.testing : T.azure.test_btn}
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {syncing ? T.azure.syncing : T.azure.sync_btn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SetupClient({
  tenantId,
  tenantSlug: _tenantSlug,
  gatewayHost: defaultHost,
  gatewayPort: defaultPort,
  apiKey,
  azureConfig,
}: {
  tenantId: string;
  tenantSlug: string;
  gatewayHost: string;
  gatewayPort: string;
  apiKey: string;
  azureConfig: AzureConfig | null;
}) {
  const { T } = useLang();
  const [selected, setSelected] = useState<string>("microsoft365");
  const [host, setHost] = useState(defaultHost);
  const [port, setPort] = useState(defaultPort);
  const [editingGateway, setEditingGateway] = useState(false);

  const cfg: Config = { gatewayHost: host, gatewayPort: port, apiKey, tenantSlug: _tenantSlug };
  const platform = PLATFORMS.find((p) => p.id === selected)!;
  const steps = platform.steps(cfg);

  return (
    <div className="space-y-6">
      {/* Platform picker */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
              selected === p.id
                ? "border-brand bg-brand/5 ring-1 ring-brand"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span className="text-xl">{p.logo}</span>
            <span className="text-xs font-medium leading-snug">{p.name}</span>
          </button>
        ))}
      </div>

      {/* Gateway info banner — editable */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            {T.setup.gateway_title}
          </p>
          <button
            onClick={() => setEditingGateway((v) => !v)}
            className="text-xs text-blue-600 hover:underline"
          >
            {editingGateway ? T.setup.done : T.setup.edit}
          </button>
        </div>

        {editingGateway ? (
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{T.setup.host_label}</label>
              <input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="mail.yourdomain.com"
                className="border rounded-lg px-3 py-1.5 text-sm font-mono w-56 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{T.setup.port_label}</label>
              <input
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="25"
                className="border rounded-lg px-3 py-1.5 text-sm font-mono w-24 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-500 text-xs">{T.setup.gateway_host}</span>
              <p className="font-mono font-medium">{host}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">{T.setup.gateway_port}</span>
              <p className="font-mono font-medium">{port}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">{T.setup.gateway_protocol}</span>
              <p className="font-mono font-medium">SMTP</p>
            </div>
          </div>
        )}

        {defaultHost === "localhost" && (
          <p className="text-xs text-blue-600 mt-3 bg-blue-100 rounded-lg px-3 py-2">
            {t(T.setup.local_dev_note, { port })}
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="bg-white border rounded-xl divide-y overflow-hidden">
        <div className="px-5 py-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">{platform.logo}</span>
            <div>
              <h2 className="font-semibold text-sm">{platform.name}</h2>
              <p className="text-xs text-gray-500">{platform.description}</p>
            </div>
          </div>
        </div>

        {steps.map((step, i) => (
          <div key={i} className="px-5 py-4">
            <p className="text-sm font-medium mb-1">{step.title}</p>
            {step.content && (
              <p className="text-sm text-gray-600 whitespace-pre-line">{step.content}</p>
            )}
            {step.code && <CodeBlock code={step.code} />}
          </div>
        ))}
      </div>

      {/* Azure AD integration — shown only for Microsoft 365 */}
      {selected === "microsoft365" && (
        <AzureSection tenantId={tenantId} initialConfig={azureConfig} />
      )}
    </div>
  );
}
