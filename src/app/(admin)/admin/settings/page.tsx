"use client";

import { useEffect, useState } from "react";
import { Settings, Save, AlertTriangle, Power, UserPlus, Megaphone } from "lucide-react";

export default function ControlCenterPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/v1/admin/settings");
        const json = await res.json();
        if (json.success) setConfig(json.data.config);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    if (config.maintenance_mode && !confirm("Are you sure you want to enable Maintenance Mode? This will block all regular users.")) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const json = await res.json();
      if (json.success) {
        alert("Configuration saved successfully!");
      } else {
        alert(json.error || "Failed to save configuration");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-light" />
            Control Center
          </h1>
          <p className="text-muted font-mono text-sm mt-1">Global platform settings and emergency toggles</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-lg hover:bg-brand-light transition-colors font-mono text-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Maintenance Mode */}
        <div className={`liquid-glass rounded-xl p-6 border transition-colors ${config?.maintenance_mode ? 'border-red-500/50 bg-red-500/5' : 'border-white/5'}`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-display text-white flex items-center gap-2">
                <Power className={`w-5 h-5 ${config?.maintenance_mode ? 'text-red-400' : 'text-slate-400'}`} /> 
                Maintenance Mode
              </h3>
              <p className="text-sm text-slate-400 font-mono max-w-lg">
                When enabled, all non-admin users will see a maintenance screen and will be unable to access the platform.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-1">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={config?.maintenance_mode || false}
                onChange={(e) => setConfig({ ...config, maintenance_mode: e.target.checked })}
              />
              <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>
          {config?.maintenance_mode && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Warning: Platform is currently inaccessible to users.
            </div>
          )}
        </div>

        {/* Signup Toggle */}
        <div className="liquid-glass rounded-xl p-6 border border-white/5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-display text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-light" /> 
                Enable New Signups
              </h3>
              <p className="text-sm text-slate-400 font-mono max-w-lg">
                Allow new users to register on the platform. Disable to make the platform invite-only or pause growth.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-1">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={config?.signup_enabled ?? true}
                onChange={(e) => setConfig({ ...config, signup_enabled: e.target.checked })}
              />
              <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-light"></div>
            </label>
          </div>
        </div>

        {/* Global Announcement */}
        <div className="liquid-glass rounded-xl p-6 border border-white/5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-display text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-brand-light" /> 
              Global Announcement Banner
            </h3>
            <p className="text-sm text-slate-400 font-mono">
              Display a platform-wide banner alert to all users. Leave blank to hide the banner.
            </p>
          </div>
          <textarea 
            value={config?.global_announcement || ""}
            onChange={(e) => setConfig({ ...config, global_announcement: e.target.value })}
            placeholder="E.g., We are undergoing scheduled maintenance on Sunday at 2 AM IST."
            className="w-full h-24 bg-surface/50 border border-white/10 rounded-lg p-4 text-sm text-text focus:outline-none focus:border-brand-light font-mono transition-colors resize-none"
          />
        </div>

      </div>
    </div>
  );
}
