"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Key, 
  CreditCard,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  Wrench,
  Download,
  FileJson
} from "lucide-react";

import { GlassPanel, Button, Badge } from "@jdstudio/ui";

// =============================================================================
// TYPES
// =============================================================================

interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  createdAt: string;
}

interface ApiKeysResponse {
  keys: ApiKeyData[];
  tier: string;
  limit: number;
  canCreate: boolean;
}

interface NewKeyResponse {
  id: string;
  name: string;
  key: string; // Full key - only shown once
  keyPrefix: string;
  createdAt: string;
  message: string;
}

// =============================================================================
// SETTINGS PAGE
// =============================================================================

/**
 * Settings Page
 * User profile, notifications, subscription, and API key management.
 */
export default function SettingsPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Back Link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-white/50 mt-1">
          Manage your account preferences and subscription.
        </p>
      </div>

      {/* Profile Section */}
      <GlassPanel className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <User className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-medium text-white">Profile</h2>
            <p className="text-sm text-white/50 mt-1">
              Your profile information is managed through Clerk.
            </p>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-white/60">Email</span>
                <span className="text-sm text-white font-mono">
                  {user?.primaryEmailAddress?.emailAddress || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-white/60">Name</span>
                <span className="text-sm text-white">
                  {user?.fullName || user?.firstName || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-white/60">Member Since</span>
                <span className="text-sm text-white font-mono">
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "—"
                  }
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button variant="secondary" size="sm" asChild>
                <a 
                  href="https://accounts.prism.jeffdev.studio/user" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Manage Profile
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Subscription Section */}
      <SubscriptionUsageSection />

      {/* Notifications Section */}
      <NotificationsSection />

      {/* API Keys Section */}
      <ApiKeysSection />

      {/* Export Rules Section */}
      <ExportRulesSection />

      {/* Dev Tools Section - Only in development */}
      {process.env.NODE_ENV === "development" && <DevToolsSection />}
    </div>
  );
}

// =============================================================================
// API KEYS SECTION
// =============================================================================

function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [tier, setTier] = useState<string>("free");
  const [limit, setLimit] = useState<number>(0);
  const [canCreate, setCanCreate] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New key modal state
  const [showNewKeyModal, setShowNewKeyModal] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch keys on mount
  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/api-keys");
      const data: ApiKeysResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { error: string }).error || "Failed to fetch keys");
      }

      setKeys(data.keys);
      setTier(data.tier);
      setLimit(data.limit);
      setCanCreate(data.canCreate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // Generate new key
  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      setGenerating(true);
      setError(null);

      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      const data: NewKeyResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { error: string }).error || "Failed to generate key");
      }

      setGeneratedKey(data.key);
      await fetchKeys(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate API key");
    } finally {
      setGenerating(false);
    }
  };

  // Revoke key
  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to revoke key");
      }

      await fetchKeys(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key");
    }
  };

  // Copy key to clipboard
  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close modal and reset state
  const closeModal = () => {
    setShowNewKeyModal(false);
    setNewKeyName("");
    setGeneratedKey(null);
    setCopied(false);
  };

  return (
    <GlassPanel className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
          <Key className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-white">API Access</h2>
              <p className="text-sm text-white/50 mt-1">
                Manage your API keys for MCP integration.
              </p>
            </div>
            {canCreate && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowNewKeyModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Generate Key
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="mt-4 p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            </div>
          ) : limit === 0 ? (
          /* No Access - Free Tier */
            <div className="mt-4 p-4 rounded-md border border-white/5 bg-white/[0.02]">
              <p className="text-sm text-white/40 text-center">
                API keys are available on Pro plans and above.
              </p>
              <div className="mt-3 flex justify-center">
                <Button variant="primary" size="sm" asChild>
                  <Link href="/subscription">Upgrade to Pro</Link>
                </Button>
              </div>
            </div>
          ) : keys.length === 0 ? (
            /* No Keys Yet */
            <div className="mt-4 p-4 rounded-md border border-white/5 bg-white/[0.02]">
              <p className="text-sm text-white/40 text-center">
                No API keys yet. Generate one to connect your IDE.
              </p>
            </div>
          ) : (
            /* Keys List */
            <div className="mt-4 space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="p-4 rounded-md border border-white/5 bg-white/[0.02] flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{key.name}</p>
                    <p className="text-xs font-mono text-white/40 mt-1">
                      {key.keyPrefix}...
                    </p>
                    <p className="text-xs text-white/30 mt-1">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && (
                        <> · Last used {new Date(key.lastUsedAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    className="p-2 text-white/40 hover:text-red-400 transition-colors"
                    title="Revoke key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Limit Info */}
              <p className="text-xs text-white/30 text-center pt-2">
                {limit === -1
                  ? "Unlimited API keys on your plan"
                  : `${keys.length} of ${limit} API key${limit !== 1 ? 's' : ''} used`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Key Modal - Portal to document body */}
      {showNewKeyModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 p-6 rounded-lg border border-white/10 bg-[#0a0a0a] shadow-2xl">
            {!generatedKey ? (
              /* Step 1: Enter Name */
              <>
                <h3 className="text-lg font-semibold text-white">Generate API Key</h3>
                <p className="text-sm text-white/50 mt-1">
                  Give your key a name to identify it later.
                </p>

                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., MacBook Pro"
                  maxLength={50}
                  className="mt-4 w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                  autoFocus
                />

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="secondary" size="sm" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateKey}
                    disabled={!newKeyName.trim() || generating}
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              /* Step 2: Show Generated Key */
              <>
                <h3 className="text-lg font-semibold text-white">Your API Key</h3>
                <p className="text-sm text-amber-400 mt-1 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Copy this key now. It will not be shown again.
                </p>

                <div className="mt-4 p-4 rounded-md bg-black border border-white/10 font-mono text-sm text-white break-all">
                  {generatedKey}
                  </div>

                  <div className="mt-4 flex justify-end gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyKey(generatedKey)}
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button variant="primary" size="sm" onClick={closeModal}>
                      Done
                    </Button>
                  </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </GlassPanel>
  );
}

// =============================================================================
// SUBSCRIPTION USAGE SECTION
// =============================================================================

function SubscriptionUsageSection() {
  const [usage, setUsage] = useState<{
    tier: string;
    usage: {
      projects: { used: number; limit: number | 'unlimited' };
      rules: { used: number; limit: number | 'unlimited' };
      components: { used: number; limit: number | 'unlimited' };
      aiGenerations: { used: number; limit: number | 'unlimited' };
    };
    resetDate: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/usage');
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  const formatLimit = (limit: number | 'unlimited') =>
    limit === 'unlimited' ? '∞' : String(limit);

  const tierLabel = usage?.tier?.charAt(0).toUpperCase() + (usage?.tier?.slice(1) || '');

  return (
    <GlassPanel className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
          <CreditCard className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-white">Subscription</h2>
            <Badge variant={usage?.tier === 'free' ? 'default' : 'success'}>
              {loading ? '...' : tierLabel}
            </Badge>
          </div>
          <p className="text-sm text-white/50 mt-1">
            Your current plan and usage limits.
          </p>

          {loading ? (
            <div className="mt-4 flex items-center gap-2 text-white/40">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading usage...</span>
            </div>
          ) : usage ? (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <UsageStatItem
                label="Projects"
                value={usage.usage.projects.used}
                limit={formatLimit(usage.usage.projects.limit)}
              />
              <UsageStatItem
                label="Rules"
                value={usage.usage.rules.used}
                limit={formatLimit(usage.usage.rules.limit)}
              />
              <UsageStatItem
                label="Components"
                value={usage.usage.components.used}
                limit={formatLimit(usage.usage.components.limit)}
              />
              <UsageStatItem
                label="AI Gen/mo"
                value={usage.usage.aiGenerations.used}
                limit={formatLimit(usage.usage.aiGenerations.limit)}
              />
            </div>
          ) : null}

          <div className="mt-6">
            <Button variant="primary" size="sm" asChild>
              <Link href="/subscription">
                Upgrade Plan
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

function UsageStatItem({
  label,
  value,
  limit
}: {
  label: string;
  value: number;
  limit: string;
}) {
  return (
    <div className="p-3 rounded-md border border-white/5 bg-white/[0.02]">
      <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-mono text-white mt-1">
        {value}
        <span className="text-white/30 text-base">/{limit}</span>
      </p>
    </div>
  );
}

// =============================================================================
// NOTIFICATIONS SECTION (with persistence)
// =============================================================================

interface NotificationPrefs {
  productUpdates: boolean;
  usageAlerts: boolean;
  marketing: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  productUpdates: true,
  usageAlerts: true,
  marketing: false,
};

function NotificationsSection() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimerRef = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    return () => clearTimeout(t);
  }, []);

  // Load preferences
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json() as { prefs: NotificationPrefs };
          setPrefs(data.prefs);
        }
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Save preferences (debounced)
  const save = useCallback(async (newPrefs: NotificationPrefs) => {
    setSaving(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs),
      });
      setSavedAt(Date.now());
    } catch { /* silent */ }
    finally { setSaving(false); }
  }, []);

  const handleToggle = (key: keyof NotificationPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    save(next);
  };

  return (
    <GlassPanel className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
          <Bell className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-white">Notifications</h2>
              <p className="text-sm text-white/50 mt-1">Configure how you receive updates.</p>
            </div>
            {saving && <Loader2 className="h-4 w-4 animate-spin text-white/30" />}
            {!saving && savedAt !== null && (
              <span className="text-xs text-emerald-400/60">Saved</span>
            )}
          </div>

          {loading ? (
            <div className="mt-4 flex items-center gap-2 text-white/30">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading preferences...</span>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <NotificationToggle
                id="pref-product-updates"
                label="Product Updates"
                description="New features and improvements"
                checked={prefs.productUpdates}
                onToggle={() => handleToggle("productUpdates")}
              />
              <NotificationToggle
                id="pref-usage-alerts"
                label="Usage Alerts"
                description="When approaching plan limits"
                checked={prefs.usageAlerts}
                onToggle={() => handleToggle("usageAlerts")}
              />
              <NotificationToggle
                id="pref-marketing"
                label="Marketing"
                description="Tips, tutorials, and offers"
                checked={prefs.marketing}
                onToggle={() => handleToggle("marketing")}
              />
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}

function NotificationToggle({
  id,
  label,
  description,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center justify-between py-2 cursor-pointer group">
      <div>
        <p className="text-sm text-white group-hover:text-white/90 transition-colors">{label}</p>
        <p className="text-xs text-white/40">{description}</p>
      </div>
      <div className="relative flex-shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="sr-only"
        />
        <div
          onClick={onToggle}
          className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${
            checked ? "bg-cyan-500" : "bg-white/10"
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
      </div>
    </label>
  );
}


// =============================================================================
// =============================================================================
// EXPORT RULES SECTION
// =============================================================================

interface ProjectItem {
  id: string;
  name: string;
  slug: string;
}

function ExportRulesSection() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/v1/projects");
        if (res.ok) {
          const data = await res.json() as { data?: ProjectItem[]; projects?: ProjectItem[] } | ProjectItem[];
          const list = Array.isArray(data) ? data : (data.data ?? data.projects ?? []);
          setProjects(list);
          if (list.length > 0 && list[0]) setSelectedProject(list[0].id);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleExport = async (format: string) => {
    if (!selectedProject) return;
    setExporting(true);
    try {
      const url = `/api/brand/export?projectId=${selectedProject}&format=${format}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const filename = format === "cursor" ? ".cursorrules"
        : format === "windsurf" ? ".windsurfrules"
        : format === "vscode" ? "settings.json"
        : format === "claude" ? "CLAUDE.md"
        : `rules-${selectedProject.slice(-6)}.json`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* silent */ }
    finally { setExporting(false); }
  };

  const formats = [
    { id: "cursor", label: ".cursorrules", icon: "⚡", desc: "Cursor IDE" },
    { id: "windsurf", label: ".windsurfrules", icon: "🏄", desc: "Windsurf IDE" },
    { id: "vscode", label: "settings.json", icon: "🔵", desc: "VS Code MCP" },
    { id: "claude", label: "CLAUDE.md", icon: "🤖", desc: "Claude Desktop" },
  ];

  return (
    <GlassPanel className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
          <Download className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-medium text-white">Export Rules</h2>
          <p className="text-sm text-white/50 mt-1">
            Download your rules as IDE configuration files.
          </p>

          {loading ? (
            <div className="mt-4 flex items-center gap-2 text-white/30">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-4 p-4 rounded-md border border-white/5 bg-white/[0.02] text-center">
              <FileJson className="h-6 w-6 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/40">No projects yet. Create a project first.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Project selector */}
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Project</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0a0a0a]">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Format buttons */}
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {formats.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleExport(f.id)}
                      disabled={exporting}
                      className="flex items-center gap-3 p-3 rounded-md border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all text-left disabled:opacity-50 group"
                    >
                      <span className="text-base">{f.icon}</span>
                      <div>
                        <p className="text-xs font-mono font-medium text-white">{f.label}</p>
                        <p className="text-[10px] text-white/40">{f.desc}</p>
                      </div>
                      <Download className="h-3 w-3 text-white/20 group-hover:text-white/50 ml-auto transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {exporting && (
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating export...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}

// =============================================================================
// DEV TOOLS SECTION (Development Only)
// =============================================================================

function DevToolsSection() {
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [selectedTier, setSelectedTier] = useState<string>("free");
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tiers = ["free", "pro", "team", "enterprise"];

  // Fetch current tier on mount
  useEffect(() => {
    const fetchTier = async () => {
      try {
        const response = await fetch("/api/admin/subscription");
        const data = await response.json();
        setCurrentTier(data.tier || "free");
        setSelectedTier(data.tier || "free");
      } catch {
        setError("Failed to fetch current tier");
      } finally {
        setLoading(false);
      }
    };
    fetchTier();
  }, []);

  // Update tier
  const handleUpdateTier = async () => {
    if (selectedTier === currentTier) return;

    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/admin/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update tier");
      }

      setCurrentTier(selectedTier);
      setSuccess(`Successfully changed to ${selectedTier} tier`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tier");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <GlassPanel className="p-6 border-dashed border-amber-500/30">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
          <Wrench className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-white">Dev Tools</h2>
            <Badge variant="warning">Development Only</Badge>
          </div>
          <p className="text-sm text-white/50 mt-1">
            Test subscription tiers without going through PayPal.
          </p>

          {loading ? (
            <div className="mt-4 p-4 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-white/40" />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Current Tier Display */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/60">Current Tier:</span>
                <span className="text-sm font-mono uppercase px-2 py-1 rounded bg-amber-500/20 text-amber-400">
                  {currentTier}
                </span>
              </div>

              {/* Tier Selector */}
              <div className="flex items-center gap-3">
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="h-10 px-4 rounded-md bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                >
                  {tiers.map((t) => (
                    <option key={t} value={t} className="bg-[#0a0a0a]">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUpdateTier}
                  disabled={updating || selectedTier === currentTier}
                  className="flex items-center gap-2"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>

              {/* Success Message */}
              {success && (
                <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400">
                  <Check className="h-4 w-4" />
                  <p className="text-sm">{success}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
