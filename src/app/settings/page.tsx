"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springAnimation } from "@/app/template";

const springTransition = {
    type: "spring" as const,
    damping: 20,
    stiffness: 100,
    mass: 0.8
};

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        pauseBetweenSets: false,
        setsPerDay: 5,
        slidesPerSet: 6,
    });
    const [saved, setSaved] = useState(false);

    // Reset state
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState("");
    const [resetting, setResetting] = useState(false);
    const [resetResult, setResetResult] = useState<Record<string, unknown> | null>(null);

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

    const handleReset = async () => {
        if (resetConfirmText !== "RESET") return;
        setResetting(true);
        try {
            const res = await fetch("/api/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sets: true, runs: true, storage: true }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setResetResult(data);
            setResetConfirmText("");
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Reset failed");
        } finally {
            setResetting(false);
        }
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
                                <motion.div
                                    className="switch-track"
                                    animate={{ backgroundColor: settings.pauseBetweenSets ? "var(--primary)" : "var(--gray-300)" }}
                                    style={{ width: 40, height: 24, borderRadius: 12, position: "relative" }}
                                >
                                    <motion.div
                                        className="switch-thumb"
                                        animate={{ x: settings.pauseBetweenSets ? 16 : 0 }}
                                        transition={springTransition}
                                        style={{ width: 20, height: 20, background: "white", borderRadius: "50%", position: "absolute", top: 2, left: 2 }}
                                    />
                                </motion.div>
                            </div>
                            <div>
                                <div style={{ fontWeight: 500 }}>Pause between sets</div>
                                <div className="text-xs text-muted">Requires manual &quot;Resume&quot; action to continue the run.</div>
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

                <div className="flex items-center gap-3" style={{ marginBottom: 48 }}>
                    <button className="btn btn-primary" onClick={handleSave}>
                        Save Settings
                    </button>
                    {saved && <span className="text-sm" style={{ color: "var(--success)" }}>✓ Settings saved successfully</span>}
                </div>

                {/* ─── Danger Zone ─── */}
                <div
                    className="card"
                    style={{
                        borderColor: "var(--danger)",
                        borderStyle: "dashed",
                    }}
                >
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "var(--danger)" }}>
                        Danger Zone
                    </h3>
                    <p className="text-sm text-secondary" style={{ marginBottom: 16 }}>
                        Destructive actions that cannot be undone.
                    </p>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 16px",
                            background: "var(--danger-subtle)",
                            borderRadius: "var(--radius-sm)",
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>Clear All Sets & History</div>
                            <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                                Deletes all generated sets, slides, agent runs, and storage files.
                            </div>
                        </div>
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                                setShowResetModal(true);
                                setResetResult(null);
                                setResetConfirmText("");
                            }}
                        >
                            Reset Everything
                        </button>
                    </div>
                </div>
            </div>

            {/* Reset confirmation modal */}
            <AnimatePresence>
                {showResetModal && (
                    <motion.div
                        className="modal-overlay"
                        onClick={() => setShowResetModal(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={springAnimation}
                        >
                            <div className="modal-header">
                                <h3 style={{ color: "var(--danger)" }}>⚠ Confirm Reset</h3>
                                <button
                                    className="btn btn-icon btn-secondary"
                                    onClick={() => setShowResetModal(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            {resetResult ? (
                                <div>
                                    <div
                                        style={{
                                            padding: 20,
                                            background: "var(--success-subtle)",
                                            borderRadius: "var(--radius-sm)",
                                            marginBottom: 16,
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, color: "var(--success)", marginBottom: 8 }}>
                                            ✓ Reset complete
                                        </div>
                                        <div className="text-sm" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                            {resetResult.setsDeleted !== undefined && (
                                                <div>{String(resetResult.setsDeleted)} sets deleted</div>
                                            )}
                                            {resetResult.slidesDeleted !== undefined && (
                                                <div>{String(resetResult.slidesDeleted)} slides deleted</div>
                                            )}
                                            {resetResult.runsDeleted !== undefined && (
                                                <div>{String(resetResult.runsDeleted)} agent runs deleted</div>
                                            )}
                                            {resetResult.storageFilesDeleted !== undefined && (
                                                <div>{String(resetResult.storageFilesDeleted)} storage files removed</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                setShowResetModal(false);
                                                window.location.reload();
                                            }}
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-secondary" style={{ marginBottom: 16, lineHeight: 1.6 }}>
                                        This will permanently delete:
                                    </p>
                                    <div
                                        style={{
                                            padding: 14,
                                            background: "var(--gray-50)",
                                            borderRadius: "var(--radius-sm)",
                                            marginBottom: 16,
                                        }}
                                    >
                                        <div className="text-sm" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                            <div>• All generated <strong>slideshow sets</strong> and their images</div>
                                            <div>• All <strong>slide generation</strong> records</div>
                                            <div>• All <strong>agent run</strong> history</div>
                                            <div>• All generated files in <strong>Supabase storage</strong></div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-secondary" style={{ marginBottom: 6 }}>
                                        Subjects, presets, templates, and cron jobs will <strong>not</strong> be affected.
                                    </p>
                                    <div className="form-group" style={{ marginTop: 16 }}>
                                        <label className="form-label">
                                            Type <strong>RESET</strong> to confirm
                                        </label>
                                        <input
                                            className="form-input"
                                            value={resetConfirmText}
                                            onChange={(e) => setResetConfirmText(e.target.value)}
                                            placeholder="Type RESET here"
                                            autoFocus
                                            style={{
                                                borderColor: resetConfirmText === "RESET" ? "var(--danger)" : undefined,
                                            }}
                                        />
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => setShowResetModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            disabled={resetConfirmText !== "RESET" || resetting}
                                            onClick={handleReset}
                                        >
                                            {resetting ? <span className="spinner" /> : "Delete Everything"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
