"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springAnimation } from "@/app/template";
import { CardGridSkeleton } from "@/components/Skeleton";
import { ConfirmModal } from "@/components/ConfirmModal";

interface Preset {
    id: string;
    name: string;
    description: string | null;
    hairstylePrompt: string;
    negativeHairPrompt: string | null;
    tags: string | null;
    createdAt: string;
}

export default function PresetsPage() {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [initialLoading, setInitialLoading] = useState(true);
    const [presetToDelete, setPresetToDelete] = useState<string | null>(null);

    async function loadPresets() {
        const res = await fetch("/api/presets");
        setPresets(await res.json());
    }

    useEffect(() => {
        loadPresets().finally(() => setInitialLoading(false));
    }, []);

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const form = e.currentTarget;
        const body = {
            name: (form.elements.namedItem("name") as HTMLInputElement).value,
            description: (form.elements.namedItem("description") as HTMLInputElement).value || undefined,
            hairstylePrompt: (form.elements.namedItem("hairstylePrompt") as HTMLTextAreaElement).value,
            negativeHairPrompt: (form.elements.namedItem("negativeHairPrompt") as HTMLTextAreaElement).value || null,
            tags: (form.elements.namedItem("tags") as HTMLInputElement).value || null,
        };

        try {
            const res = await fetch("/api/presets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setShowModal(false);
            loadPresets();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteConfirmed() {
        if (!presetToDelete) return;
        const id = presetToDelete;
        await fetch(`/api/presets/${id}`, { method: "DELETE" });
        loadPresets();
        setPresetToDelete(null);
    }

    if (initialLoading) return <CardGridSkeleton count={4} />;

    return (
        <>
            <div className="page-header">
                <div>
                    <h2>Hairstyle Presets</h2>
                    <p>Reusable hairstyle descriptions — only hair, nothing else</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + New Preset
                </button>
            </div>

            {presets.length === 0 ? (
                <div className="empty-state">
                    <h3>No presets yet</h3>
                    <p>Create hairstyle presets or run the seed script</p>
                </div>
            ) : (
                <div className="card-grid">
                    {presets.map((p) => (
                        <div key={p.id} className="card">
                            <div className="flex items-center justify-between">
                                <div className="card-title">{p.name}</div>
                                <button
                                    className="btn btn-danger btn-sm btn-icon"
                                    onClick={() => setPresetToDelete(p.id)}
                                    title="Delete Preset"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            </div>
                            {p.description && (
                                <div className="text-sm text-secondary">{p.description}</div>
                            )}
                            <div
                                className="text-sm"
                                style={{
                                    marginTop: 12,
                                    padding: 12,
                                    background: "var(--gray-50)",
                                    borderRadius: "var(--radius-sm)",
                                    lineHeight: 1.6,
                                    color: "var(--text-secondary)",
                                }}
                            >
                                {p.hairstylePrompt}
                            </div>
                            {p.negativeHairPrompt && (
                                <div
                                    className="text-xs text-muted"
                                    style={{ marginTop: 8 }}
                                >
                                    Negative: {p.negativeHairPrompt}
                                </div>
                            )}
                            {p.tags && (
                                <div className="flex gap-2" style={{ marginTop: 8, flexWrap: "wrap" }}>
                                    {JSON.parse(p.tags).map((tag: string) => (
                                        <span key={tag} className="badge badge-neutral">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
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
                                <h3>New Hairstyle Preset</h3>
                                <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)} title="Close">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            <form onSubmit={handleCreate}>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input name="name" className="form-input" placeholder="e.g. Sleek Bun" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <input name="description" className="form-input" placeholder="Optional" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Hairstyle Prompt</label>
                                    <textarea
                                        name="hairstylePrompt"
                                        className="form-textarea"
                                        placeholder="Describe ONLY the hairstyle..."
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Negative Hair Prompt</label>
                                    <textarea
                                        name="negativeHairPrompt"
                                        className="form-textarea"
                                        rows={2}
                                        placeholder="What to avoid (optional)"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tags (JSON array)</label>
                                    <input
                                        name="tags"
                                        className="form-input mono"
                                        placeholder='["updo", "formal"]'
                                    />
                                </div>
                                {error && (
                                    <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>
                                        {error}
                                    </div>
                                )}
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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
            <ConfirmModal
                isOpen={!!presetToDelete}
                title="Delete Hairstyle Preset?"
                description="This will permanently remove this preset. Any existing styles using it won't be modified, but it won't be available for new generations."
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setPresetToDelete(null)}
                confirmText="Delete Preset"
            />
        </>
    );
}
