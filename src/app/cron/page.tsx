"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springAnimation } from "@/app/template";

interface CronJobData {
    id: string;
    name: string;
    schedule: string;
    enabled: boolean;
    actionType: string;
    configJson: string;
    lastRunAt: string | null;
    lastResult: string | null;
    lastError: string | null;
    createdAt: string;
}

export default function CronPage() {
    const [jobs, setJobs] = useState<CronJobData[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [runningId, setRunningId] = useState<string | null>(null);
    const [error, setError] = useState("");

    async function load() {
        const res = await fetch("/api/cronjobs");
        setJobs(await res.json());
    }

    useEffect(() => {
        load();
    }, []);

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const form = e.currentTarget;
        const body = {
            name: (form.elements.namedItem("name") as HTMLInputElement).value,
            schedule: (form.elements.namedItem("schedule") as HTMLInputElement).value,
            enabled: true,
            actionType: "GENERATE_SET",
            configJson: (form.elements.namedItem("configJson") as HTMLTextAreaElement).value,
        };

        try {
            JSON.parse(body.configJson);
        } catch {
            setError("Invalid JSON in config");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/cronjobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setShowModal(false);
            load();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleRunOnce(id: string) {
        setRunningId(id);
        try {
            const res = await fetch(`/api/cronjobs/${id}/run`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            load();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to run job");
        } finally {
            setRunningId(null);
        }
    }

    async function handleToggle(id: string, enabled: boolean) {
        await fetch(`/api/cronjobs/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled: !enabled }),
        });
        load();
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this cron job?")) return;
        await fetch(`/api/cronjobs/${id}`, { method: "DELETE" });
        load();
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h2>Cron Jobs</h2>
                    <p>Schedule automated set generation</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + New Cron Job
                </button>
            </div>

            {jobs.length === 0 ? (
                <div className="empty-state">
                    <h3>No cron jobs</h3>
                    <p>Schedule automated hairstyle set generation</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Schedule</th>
                                <th>Enabled</th>
                                <th>Last Run</th>
                                <th>Last Result</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((j) => (
                                <tr key={j.id}>
                                    <td style={{ fontWeight: 500 }}>{j.name}</td>
                                    <td className="mono">{j.schedule}</td>
                                    <td>
                                        <button
                                            className={`badge ${j.enabled ? "badge-success" : "badge-neutral"}`}
                                            style={{ cursor: "pointer", border: "none" }}
                                            onClick={() => handleToggle(j.id, j.enabled)}
                                        >
                                            {j.enabled ? "ON" : "OFF"}
                                        </button>
                                    </td>
                                    <td className="text-sm text-secondary">
                                        {j.lastRunAt
                                            ? new Date(j.lastRunAt).toLocaleString()
                                            : "Never"}
                                    </td>
                                    <td>
                                        {j.lastResult && (
                                            <span
                                                className={`badge ${j.lastResult === "success"
                                                    ? "badge-success"
                                                    : j.lastResult === "failed"
                                                        ? "badge-danger"
                                                        : "badge-neutral"
                                                    }`}
                                                title={j.lastError || ""}
                                            >
                                                {j.lastResult}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleRunOnce(j.id)}
                                                disabled={runningId === j.id}
                                            >
                                                {runningId === j.id ? (
                                                    <span className="spinner" />
                                                ) : (
                                                    "Run Now"
                                                )}
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(j.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="modal-overlay"
                        onClick={() => setShowModal(false)}
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
                                <h3>New Cron Job</h3>
                                <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleCreate}>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input name="name" className="form-input" placeholder="Daily hairstyle set" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Schedule</label>
                                    <input
                                        name="schedule"
                                        className="form-input mono"
                                        placeholder="daily, hourly, 0 0 * * *, etc."
                                        defaultValue="daily"
                                        required
                                    />
                                    <div className="text-xs text-muted mt-2">
                                        Supports: daily, hourly, or cron expressions
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Config JSON</label>
                                    <textarea
                                        name="configJson"
                                        className="form-textarea mono"
                                        rows={8}
                                        required
                                        defaultValue={JSON.stringify(
                                            {
                                                subjectId: "",
                                                templateId: "",
                                                presetIds: [],
                                                namingPattern: "Daily set {date}",
                                            },
                                            null,
                                            2
                                        )}
                                    />
                                    <div className="text-xs text-muted mt-2">
                                        Must include subjectId and either presetIds or customHairstyles array
                                    </div>
                                </div>
                                {error && (
                                    <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>
                                        {error}
                                    </div>
                                )}
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? <span className="spinner" /> : "Create"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
