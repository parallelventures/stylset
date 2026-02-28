"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storageUrl } from "@/lib/urls";

interface Subject {
    id: string;
    name: string;
    description: string | null;
    referenceImagePaths: string;
    lockedAttributesJson: string;
    createdAt: string;
    updatedAt: string;
    slideshowSets: Array<{
        id: string;
        name: string;
        status: string;
        createdAt: string;
    }>;
}

export default function SubjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [subject, setSubject] = useState<Subject | null>(null);
    const [generating, setGenerating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/subjects/${id}`)
            .then((r) => r.json())
            .then(setSubject);
    }, [id]);

    async function handleQuickGenerate() {
        setGenerating(true);
        try {
            const res = await fetch(`/api/subjects/${id}/generate`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            router.push(`/sets/${data.setId}`);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Generation failed");
            setGenerating(false);
        }
    }

    if (!subject) {
        return (
            <div className="flex items-center gap-3" style={{ padding: 40 }}>
                <span className="spinner" /> Loading…
            </div>
        );
    }

    const images: string[] = JSON.parse(subject.referenceImagePaths || "[]");
    let lockedAttrs: Record<string, string> = {};
    try {
        lockedAttrs = JSON.parse(subject.lockedAttributesJson);
    } catch {
        /* empty */
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <Link href="/subjects" className="text-muted" style={{ fontSize: 13 }}>
                        ← Back to subjects
                    </Link>
                    <h2 style={{ marginTop: 6 }}>{subject.name}</h2>
                    {subject.description && (
                        <p>{subject.description}</p>
                    )}
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleQuickGenerate}
                    disabled={generating}
                >
                    {generating ? (
                        <><span className="spinner" /> Generating…</>
                    ) : (
                        "⚡ Generate Sets (All Hairstyles)"
                    )}
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="card">
                    <div className="card-title" style={{ marginBottom: 12 }}>Reference Images</div>
                    <div className="text-xs text-muted" style={{ marginBottom: 12 }}>
                        Immutable — locked at creation
                    </div>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(auto-fill, minmax(100px, 1fr))`,
                        gap: 8,
                    }}>
                        {images.map((img, i) => (
                            <img
                                key={i}
                                src={storageUrl(img)}
                                alt={`Reference ${i + 1}`}
                                style={{
                                    width: "100%",
                                    aspectRatio: "1",
                                    objectFit: "cover",
                                    borderRadius: "var(--radius-sm)",
                                    border: "1px solid var(--border)",
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-title" style={{ marginBottom: 12 }}>Locked Attributes</div>
                    <div className="text-xs text-muted" style={{ marginBottom: 12 }}>
                        Preserved across all generated images — only hairstyle changes
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {Object.entries(lockedAttrs).map(([key, value]) => (
                            <div key={key} style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px 12px",
                                background: "var(--gray-50)",
                                borderRadius: "var(--radius-sm)",
                            }}>
                                <span className="text-xs text-muted" style={{ textTransform: "capitalize" }}>
                                    {key}
                                </span>
                                <span className="text-sm">{String(value)}</span>
                            </div>
                        ))}
                        {Object.keys(lockedAttrs).length === 0 && (
                            <div className="text-sm text-muted">No attributes defined</div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 32 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>Generated Sets</h3>
                </div>

                {subject.slideshowSets.length === 0 ? (
                    <div className="empty-state">
                        <h3>No sets generated yet</h3>
                        <p>Click &quot;Generate All Hairstyles&quot; to create your first set</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {subject.slideshowSets.map((set) => (
                                    <tr key={set.id}>
                                        <td style={{ fontWeight: 500 }}>{set.name}</td>
                                        <td>
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
                                                {set.status}
                                            </span>
                                        </td>
                                        <td className="text-sm text-secondary">
                                            {new Date(set.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <Link
                                                href={`/sets/${set.id}`}
                                                className="btn btn-secondary btn-sm"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
