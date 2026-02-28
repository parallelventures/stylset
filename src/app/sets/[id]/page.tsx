"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { storageUrl } from "@/lib/urls";
import { SetDetailSkeleton } from "@/components/Skeleton";

interface SlideGeneration {
    id: string;
    orderIndex: number;
    status: string;
    outputImagePath: string | null;
    error: string | null;
    inputJson: string;
    preset?: { id: string; name: string } | null;
}

interface SetDetail {
    id: string;
    name: string;
    description: string | null;
    status: string;
    subjectId: string;
    templateId: string | null;
    manifestPath: string | null;
    zipPath: string | null;
    createdAt: string;
    subject: { name: string; id: string };
    slides: SlideGeneration[];
}

export default function SetDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [set, setSet] = useState<SetDetail | null>(null);

    const loadSet = useCallback(() => {
        fetch(`/api/sets/${id}`)
            .then((r) => r.json())
            .then(setSet);
    }, [id]);

    useEffect(() => {
        loadSet();
    }, [loadSet]);

    // Auto-refresh while generating
    useEffect(() => {
        if (!set || set.status !== "generating") return;
        const interval = setInterval(loadSet, 3000);
        return () => clearInterval(interval);
    }, [set?.status, loadSet]);

    if (!set) {
        return <SetDetailSkeleton />;
    }

    const succeeded = set.slides.filter((s) => s.status === "succeeded").length;
    const failed = set.slides.filter((s) => s.status === "failed").length;
    const total = set.slides.length;
    const progress = total > 0 ? (succeeded / total) * 100 : 0;

    return (
        <>
            <div className="page-header">
                <div>
                    <Link href="/sets" className="text-muted" style={{ fontSize: 13 }}>
                        ← Back to sets
                    </Link>
                    <h2 style={{ marginTop: 6 }}>{set.name}</h2>
                    <div className="flex items-center gap-3" style={{ marginTop: 6 }}>
                        <span
                            className={`badge ${set.status === "ready"
                                ? "badge-success"
                                : set.status === "generating"
                                    ? "badge-warning"
                                    : set.status === "failed"
                                        ? "badge-danger"
                                        : "badge-neutral"
                                }`}
                        >
                            {set.status === "generating" ? "Generating…" : set.status}
                        </span>
                        <span className="text-sm text-secondary">
                            <Link href={`/subjects/${set.subject.id}`}>{set.subject.name}</Link>
                        </span>
                        <span className="text-sm text-muted">
                            {succeeded}/{total} completed
                            {failed > 0 && ` · ${failed} failed`}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {(set.status === "generating" || set.status === "idle") && (
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={async () => {
                                const res = await fetch(`/api/sets/${id}/fix`, { method: "POST" });
                                const data = await res.json();
                                alert(`Fixed: ${data.stuckFixed} stuck slides. New status: ${data.status}. ${data.retriggered ? "Re-triggered generation!" : ""}`);
                                loadSet();
                            }}
                        >
                            🔧 Fix & Retry
                        </button>
                    )}
                    {set.manifestPath && (
                        <a
                            href={storageUrl(set.manifestPath)}
                            download
                            className="btn btn-secondary btn-sm"
                        >
                            ↓ Manifest
                        </a>
                    )}
                    {set.zipPath && (
                        <a
                            href={storageUrl(set.zipPath)}
                            download
                            className="btn btn-primary btn-sm"
                        >
                            ↓ Download ZIP
                        </a>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            {total > 0 && set.status !== "ready" && (
                <div style={{ marginBottom: 24 }}>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                        {set.status === "generating" && "Generating images with Gemini… "}
                        {Math.round(progress)}% ({succeeded}/{total})
                    </div>
                </div>
            )}

            {/* Image grid */}
            <div className="image-grid">
                {set.slides.map((slide) => {
                    let hairstyle = "";
                    try {
                        const input = JSON.parse(slide.inputJson || "{}");
                        hairstyle = input.hairstylePrompt || "";
                    } catch {
                        /* empty */
                    }

                    return (
                        <div key={slide.id} className="image-card">
                            {slide.status === "succeeded" && slide.outputImagePath ? (
                                <img
                                    src={storageUrl(slide.outputImagePath)}
                                    alt={`Slide ${slide.orderIndex}`}
                                />
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        height: "100%",
                                        padding: 16,
                                        textAlign: "center",
                                    }}
                                >
                                    {slide.status === "queued" && (
                                        <span className="badge badge-neutral">Queued</span>
                                    )}
                                    {slide.status === "running" && (
                                        <>
                                            <span className="spinner" />
                                            <div className="text-xs text-muted" style={{ marginTop: 8 }}>
                                                Generating…
                                            </div>
                                        </>
                                    )}
                                    {slide.status === "failed" && (
                                        <>
                                            <span className="badge badge-danger">Failed</span>
                                            <div
                                                className="text-xs text-muted"
                                                style={{ marginTop: 8, maxWidth: 160 }}
                                            >
                                                {slide.error?.slice(0, 120)}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            <div className="image-card-overlay">
                                <div style={{ fontWeight: 500, marginBottom: 1 }}>
                                    #{slide.orderIndex + 1}
                                    {slide.preset && ` · ${slide.preset.name}`}
                                </div>
                                <div className="text-xs truncate" style={{ opacity: 0.8, maxWidth: 180 }}>
                                    {hairstyle}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
