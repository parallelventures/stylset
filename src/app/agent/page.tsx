"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface AgentRun {
    id: string;
    status: string;
    setsPlanned: number;
    setsCompleted: number;
    setsFailed: number;
    slidesTotal: number;
    slidesOk: number;
    slidesFailed: number;
    startedAt: string;
    completedAt: string | null;
}

interface CronJobInfo {
    id: string;
    name: string;
    schedule: string;
    enabled: boolean;
    lastRunAt: string | null;
    lastResult: string | null;
}

interface AgentStatus {
    runs: AgentRun[];
    cronJob: CronJobInfo | null;
    counts: { subjects: number; presets: number; templates: number };
    defaultSubject: { id: string; name: string } | null;
}

export default function AgentPage() {
    const [status, setStatus] = useState<AgentStatus | null>(null);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState("");
    const [setsPerDay, setSetsPerDay] = useState(5);
    const [slidesPerSet, setSlidesPerSet] = useState(6);
    const [pauseBetweenSets, setPauseBetweenSets] = useState(false);

    const load = useCallback(() => {
        fetch("/api/agent")
            .then((r) => r.json())
            .then(setStatus);
    }, []);

    useEffect(() => { load(); }, [load]);

    // Auto-refresh if a run is active
    useEffect(() => {
        if (!status?.runs?.some((r) => r.status === "running")) return;
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, [status, load]);

    async function handleRunNow() {
        setRunning(true);
        setError("");
        try {
            const body: Record<string, unknown> = { setsPerDay, slidesPerSet, pauseBetweenSets };
            if (status?.defaultSubject) {
                body.subjectId = status.defaultSubject.id;
            }
            const res = await fetch("/api/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTimeout(load, 2000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Agent run failed");
        } finally {
            setRunning(false);
        }
    }

    async function handleCancel(id: string) {
        if (!confirm("Cancel this run?")) return;
        try {
            await fetch(`/api/agent/${id}/cancel`, { method: "POST" });
            load();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to cancel");
        }
    }

    async function handleResume(id: string) {
        try {
            await fetch(`/api/agent/${id}/resume`, { method: "POST" });
            setTimeout(load, 1000);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to resume");
        }
    }

    if (!status) {
        return (
            <div className="flex items-center gap-3" style={{ padding: 40 }}>
                <span className="spinner" /> Loading agent status…
            </div>
        );
    }

    const hasActiveRun = status.runs.some((r) => r.status === "running");
    const isReady = status.counts.subjects > 0 && status.counts.presets >= 6;

    return (
        <>
            <div className="page-header">
                <div>
                    <h2>Agent</h2>
                    <p>Autonomous daily hairstyle generation</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleRunNow}
                    disabled={running || hasActiveRun || !isReady}
                    style={{ minWidth: 160 }}
                >
                    {hasActiveRun ? (
                        <><span className="spinner" /> Running…</>
                    ) : running ? (
                        <><span className="spinner" /> Starting…</>
                    ) : (
                        `⚡ Run Now (${setsPerDay}×${slidesPerSet})`
                    )}
                </button>
            </div>

            {error && (
                <div className="card" style={{ borderColor: "var(--danger)", marginBottom: 16 }}>
                    <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>
                </div>
            )}

            {/* Readiness */}
            {!isReady && (
                <div className="card" style={{ marginBottom: 24, borderColor: "var(--warning)" }}>
                    <div className="card-title" style={{ marginBottom: 8 }}>Setup Required</div>
                    <div className="text-sm text-secondary">
                        {status.counts.subjects === 0 && (
                            <div>• <Link href="/subjects">Upload a subject</Link> (reference photo)</div>
                        )}
                        {status.counts.presets < 6 && (
                            <div>• Need at least 6 <Link href="/presets">hairstyle presets</Link> (have {status.counts.presets}). Run <code className="mono">npm run db:seed</code></div>
                        )}
                    </div>
                </div>
            )}

            {/* Config */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.5fr", gap: 12, marginBottom: 24 }}>
                <div className="card">
                    <div className="card-meta">Active Subject</div>
                    <div className="card-title" style={{ marginTop: 4 }}>
                        {status.defaultSubject ? (
                            <Link href={`/subjects/${status.defaultSubject.id}`}>
                                {status.defaultSubject.name}
                            </Link>
                        ) : (
                            <span className="text-muted">None</span>
                        )}
                    </div>
                </div>
                <div className="card">
                    <div className="card-meta">Sets per Day</div>
                    <div style={{ marginTop: 4 }}>
                        <select
                            className="form-select"
                            value={setsPerDay}
                            onChange={(e) => setSetsPerDay(Number(e.target.value))}
                            style={{ width: 80 }}
                        >
                            {[1, 2, 3, 4, 5, 7, 10].map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="card">
                    <div className="card-meta">Slides per Set</div>
                    <div style={{ marginTop: 4 }}>
                        <select
                            className="form-select"
                            value={slidesPerSet}
                            onChange={(e) => setSlidesPerSet(Number(e.target.value))}
                            style={{ width: 80 }}
                        >
                            {[3, 4, 5, 6, 8, 10].map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="card">
                    <div className="card-meta">Verification</div>
                    <div style={{ marginTop: 8 }}>
                        <label className="flex items-center gap-2" style={{ cursor: "pointer", fontSize: 13 }}>
                            <input
                                type="checkbox"
                                checked={pauseBetweenSets}
                                onChange={(e) => setPauseBetweenSets(e.target.checked)}
                            />
                            Pause between sets
                        </label>
                    </div>
                </div>
            </div>

            {/* Schedule */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="card-title">Cron Schedule</div>
                        <div className="card-meta" style={{ marginTop: 2 }}>
                            {status.cronJob ? (
                                <>
                                    <span className="mono">{status.cronJob.schedule}</span>
                                    {" · "}
                                    <span className={`badge ${status.cronJob.enabled ? "badge-success" : "badge-neutral"}`}>
                                        {status.cronJob.enabled ? "Active" : "Paused"}
                                    </span>
                                    {status.cronJob.lastRunAt && (
                                        <> · Last: {new Date(status.cronJob.lastRunAt).toLocaleString()}</>
                                    )}
                                </>
                            ) : (
                                "No cron configured. Run seed or create via /cron"
                            )}
                        </div>
                    </div>
                    <Link href="/cron" className="btn btn-secondary btn-sm">Configure</Link>
                </div>
            </div>

            {/* Presets */}
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <div>
                    <span className="text-sm" style={{ fontWeight: 600 }}>Preset Pool</span>
                    <span className="text-sm text-muted"> · {status.counts.presets} hairstyles available</span>
                </div>
                <Link href="/presets" className="btn btn-secondary btn-sm">Manage</Link>
            </div>

            {/* Runs */}
            <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Run History</h3>

                {status.runs.length === 0 ? (
                    <div className="empty-state">
                        <h3>No runs yet</h3>
                        <p>Click "Run Now" to generate your first batch</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Started</th>
                                    <th>Status</th>
                                    <th>Sets</th>
                                    <th>Slides</th>
                                    <th>Duration</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {status.runs.map((run) => {
                                    const duration = run.completedAt
                                        ? `${Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s`
                                        : "—";

                                    return (
                                        <tr key={run.id}>
                                            <td className="text-sm">
                                                {new Date(run.startedAt).toLocaleString()}
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${run.status === "completed"
                                                        ? "badge-success"
                                                        : run.status === "running"
                                                            ? "badge-warning"
                                                            : "badge-danger"
                                                        }`}
                                                >
                                                    {run.status === "running" ? "Running…" : run.status}
                                                </span>
                                            </td>
                                            <td className="text-sm">
                                                {run.setsCompleted}/{run.setsPlanned} OK
                                                {run.setsFailed > 0 && <span style={{ color: "var(--danger)" }}> · {run.setsFailed} failed</span>}
                                            </td>
                                            <td className="text-sm">
                                                {run.slidesOk}/{run.slidesTotal} OK
                                                {run.slidesFailed > 0 && <span style={{ color: "var(--danger)" }}> · {run.slidesFailed} failed</span>}
                                            </td>
                                            <td className="text-sm text-secondary mono">{duration}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    {run.status === "paused" && (
                                                        <button className="btn btn-primary btn-sm" onClick={() => handleResume(run.id)}>
                                                            Resume
                                                        </button>
                                                    )}
                                                    {(run.status === "running" || run.status === "paused") && (
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(run.id)}>
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
