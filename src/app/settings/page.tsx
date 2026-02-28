"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        pauseBetweenSets: false,
        setsPerDay: 5,
        slidesPerSet: 6,
    });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("styleset_agent_settings");
        if (stored) {
            try {
                setSettings(JSON.parse(stored));
            } catch (err) { }
        }
    }, []);

    const handleChange = (key: string, value: unknown) => {
        setSettings(s => ({ ...s, [key]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        localStorage.setItem("styleset_agent_settings", JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Settings</h2>
                    <p>Configure agent defaults and system preferences</p>
                </div>
            </div>

            <div style={{ maxWidth: 600 }}>
                {/* Agent Generation Settings */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Agent Configuration</h3>

                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Manual Verification Flow</label>
                        <div className="text-secondary text-sm" style={{ marginBottom: 12 }}>
                            Instead of running all sets at once, pause the agent after each set to allow manual review of the generated images.
                        </div>

                        <label className="flex items-center gap-3" style={{ cursor: "pointer", background: "var(--gray-50)", padding: "16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                            <div className="switch-container">
                                <input
                                    type="checkbox"
                                    style={{ display: "none" }}
                                    checked={settings.pauseBetweenSets}
                                    onChange={(e) => handleChange("pauseBetweenSets", e.target.checked)}
                                />
                                <div className="switch-track" style={{
                                    width: 40, height: 24, background: settings.pauseBetweenSets ? "var(--primary)" : "var(--gray-300)", borderRadius: 12, position: "relative", transition: "0.2s"
                                }}>
                                    <div className="switch-thumb" style={{
                                        width: 20, height: 20, background: "white", borderRadius: "50%", position: "absolute", top: 2, left: settings.pauseBetweenSets ? 18 : 2, transition: "0.2s"
                                    }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ fontWeight: 500 }}>Pause between sets</div>
                                <div className="text-xs text-muted">Requires manual "Resume" action to continue the run.</div>
                            </div>
                        </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
                        <div className="form-group">
                            <label className="form-label">Default Sets per Day</label>
                            <select
                                className="form-select"
                                value={settings.setsPerDay}
                                onChange={(e) => handleChange("setsPerDay", Number(e.target.value))}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Slides per Set</label>
                            <select
                                className="form-select"
                                value={settings.slidesPerSet}
                                onChange={(e) => handleChange("slidesPerSet", Number(e.target.value))}
                            >
                                {[3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="btn btn-primary" onClick={handleSave}>
                        Save Settings
                    </button>
                    {saved && <span className="text-sm" style={{ color: "var(--success)" }}>✓ Settings saved successfully</span>}
                </div>
            </div>
        </div>
    );
}
