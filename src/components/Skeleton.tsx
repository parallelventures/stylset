"use client";

import React from "react";

/* ─── Base shimmer block ─── */
function Bone({
    width,
    height,
    radius,
    style,
    className = "",
}: {
    width?: string | number;
    height?: string | number;
    radius?: string | number;
    style?: React.CSSProperties;
    className?: string;
}) {
    return (
        <div
            className={`skel-bone ${className}`}
            style={{
                width: width ?? "100%",
                height: height ?? 14,
                borderRadius: radius ?? 6,
                ...style,
            }}
        />
    );
}

/* ─── Page-level skeletons ─── */

/** Dashboard / home page */
export function DashboardSkeleton() {
    return (
        <div className="skel-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <Bone width={120} height={26} radius={8} />
                    <Bone width={200} height={13} style={{ marginTop: 6 }} />
                </div>
                <Bone width={130} height={36} radius={100} />
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="card" style={{ padding: 20 }}>
                        <Bone width={80} height={12} style={{ marginBottom: 10 }} />
                        <Bone width={48} height={28} radius={8} />
                    </div>
                ))}
            </div>

            {/* Subject cards */}
            <Bone width={120} height={15} style={{ marginBottom: 14 }} />
            <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="card" style={{ padding: 20 }}>
                        <Bone height={120} radius={8} style={{ marginBottom: 12 }} />
                        <Bone width="60%" height={14} style={{ marginBottom: 6 }} />
                        <Bone width="40%" height={12} />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Table-based pages: Sets, Cron */
export function TableSkeleton({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
    return (
        <div className="skel-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <Bone width={160} height={26} radius={8} />
                    <Bone width={240} height={13} style={{ marginTop: 6 }} />
                </div>
                <Bone width={120} height={36} radius={100} />
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            {[...Array(columns)].map((_, i) => (
                                <th key={i}>
                                    <Bone width={60 + Math.random() * 40} height={10} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(rows)].map((_, ri) => (
                            <tr key={ri}>
                                {[...Array(columns)].map((_, ci) => (
                                    <td key={ci}>
                                        <Bone
                                            width={ci === 0 ? "70%" : ci === columns - 1 ? 56 : "50%"}
                                            height={ci === columns - 1 ? 28 : 13}
                                            radius={ci === columns - 1 ? 100 : 6}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/** Card grid pages: Subjects, Presets, Templates */
export function CardGridSkeleton({ count = 4, hasImage = false }: { count?: number; hasImage?: boolean }) {
    return (
        <div className="skel-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <Bone width={140} height={26} radius={8} />
                    <Bone width={280} height={13} style={{ marginTop: 6 }} />
                </div>
                <Bone width={130} height={36} radius={100} />
            </div>

            {/* Cards */}
            <div className="card-grid">
                {[...Array(count)].map((_, i) => (
                    <div key={i} className="card" style={{ padding: 20 }}>
                        {hasImage && (
                            <Bone height={140} radius={8} style={{ marginBottom: 14 }} />
                        )}
                        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                            <Bone width="55%" height={14} />
                            {!hasImage && <Bone width={56} height={28} radius={100} />}
                        </div>
                        <Bone width="35%" height={12} style={{ marginBottom: hasImage ? 6 : 12 }} />
                        {!hasImage && (
                            <Bone height={64} radius={8} style={{ marginTop: 12 }} />
                        )}
                        {hasImage && (
                            <div className="flex gap-2" style={{ marginTop: 14 }}>
                                <Bone height={32} radius={100} style={{ flex: 1 }} />
                                <Bone width={52} height={32} radius={100} />
                                <Bone width={32} height={32} radius={100} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Agent page */
export function AgentSkeleton() {
    return (
        <div className="skel-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <Bone width={90} height={26} radius={8} />
                    <Bone width={240} height={13} style={{ marginTop: 6 }} />
                </div>
                <Bone width={160} height={36} radius={100} />
            </div>

            {/* Config cards */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <div className="card" style={{ flex: 1, padding: 20 }}>
                    <Bone width={100} height={12} style={{ marginBottom: 6 }} />
                    <Bone width={140} height={14} />
                </div>
                <div className="card" style={{ flex: 2, padding: 20 }}>
                    <Bone width={100} height={12} style={{ marginBottom: 6 }} />
                    <Bone width="70%" height={14} />
                </div>
            </div>

            {/* Schedule card */}
            <div className="card" style={{ marginBottom: 24, padding: 20 }}>
                <Bone width={120} height={14} style={{ marginBottom: 6 }} />
                <Bone width={220} height={12} />
            </div>

            {/* Preset Pool */}
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <Bone width={200} height={13} />
                <Bone width={72} height={28} radius={100} />
            </div>

            {/* Run History */}
            <Bone width={100} height={15} style={{ marginTop: 24, marginBottom: 12 }} />
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            {[...Array(6)].map((_, i) => (
                                <th key={i}><Bone width={50 + Math.random() * 30} height={10} /></th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(3)].map((_, ri) => (
                            <tr key={ri}>
                                {[...Array(6)].map((_, ci) => (
                                    <td key={ci}><Bone width={ci === 0 ? "80%" : "50%"} height={13} /></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/** Set detail page */
export function SetDetailSkeleton() {
    return (
        <div className="skel-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <Bone width={100} height={13} style={{ marginBottom: 8 }} />
                    <Bone width={200} height={26} radius={8} />
                    <div className="flex items-center gap-3" style={{ marginTop: 8 }}>
                        <Bone width={64} height={22} radius={100} />
                        <Bone width={90} height={13} />
                        <Bone width={80} height={13} />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Bone width={90} height={32} radius={100} />
                    <Bone width={120} height={32} radius={100} />
                </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 24 }}>
                <Bone height={4} radius={2} />
                <Bone width={120} height={11} style={{ marginTop: 6 }} />
            </div>

            {/* Image grid */}
            <div className="image-grid">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="image-card"
                        style={{ overflow: "hidden" }}
                    >
                        <div className="skel-bone" style={{ width: "100%", height: "100%", borderRadius: 0 }} />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Subject detail page */
export function SubjectDetailSkeleton() {
    return (
        <div className="skel-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <Bone width={120} height={13} style={{ marginBottom: 8 }} />
                    <Bone width={180} height={26} radius={8} />
                    <Bone width={200} height={13} style={{ marginTop: 6 }} />
                </div>
                <Bone width={220} height={36} radius={100} />
            </div>

            {/* Two-col layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="card" style={{ padding: 20 }}>
                    <Bone width={130} height={14} style={{ marginBottom: 12 }} />
                    <Bone width={160} height={11} style={{ marginBottom: 12 }} />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                        {[...Array(3)].map((_, i) => (
                            <Bone key={i} height={0} style={{ paddingBottom: "100%" }} radius={8} />
                        ))}
                    </div>
                </div>
                <div className="card" style={{ padding: 20 }}>
                    <Bone width={140} height={14} style={{ marginBottom: 12 }} />
                    <Bone width={220} height={11} style={{ marginBottom: 12 }} />
                    {[...Array(4)].map((_, i) => (
                        <Bone key={i} height={36} radius={8} style={{ marginBottom: 8 }} />
                    ))}
                </div>
            </div>

            {/* Generated sets */}
            <Bone width={130} height={16} style={{ marginTop: 32, marginBottom: 16 }} />
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            {[...Array(4)].map((_, i) => (
                                <th key={i}><Bone width={60} height={10} /></th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(3)].map((_, ri) => (
                            <tr key={ri}>
                                {[...Array(4)].map((_, ci) => (
                                    <td key={ci}><Bone width={ci === 3 ? 52 : "60%"} height={ci === 3 ? 28 : 13} radius={ci === 3 ? 100 : 6} /></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/** Settings page */
export function SettingsSkeleton() {
    return (
        <div className="skel-fade-in">
            <div className="page-header">
                <div>
                    <Bone width={100} height={26} radius={8} />
                    <Bone width={300} height={13} style={{ marginTop: 6 }} />
                </div>
            </div>

            <div style={{ maxWidth: 600 }}>
                <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                    <Bone width={180} height={16} style={{ marginBottom: 20 }} />
                    <Bone width="100%" height={12} style={{ marginBottom: 8 }} />
                    <Bone width="80%" height={12} style={{ marginBottom: 16 }} />
                    <Bone height={56} radius={8} style={{ marginBottom: 24 }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <Bone width={120} height={12} style={{ marginBottom: 6 }} />
                            <Bone height={36} radius={8} />
                        </div>
                        <div>
                            <Bone width={100} height={12} style={{ marginBottom: 6 }} />
                            <Bone height={36} radius={8} />
                        </div>
                    </div>
                </div>
                <Bone width={120} height={36} radius={100} />
            </div>
        </div>
    );
}
