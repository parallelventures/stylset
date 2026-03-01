"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springAnimation } from "@/app/template";
import { CardGridSkeleton } from "@/components/Skeleton";

interface ModelVariation {
    id: string;
    name: string;
    description: string | null;
    prompt: string;
    tags: string | null;
    enabled: boolean;
    createdAt: string;
    _count?: { slideshowSets: number };
}

export default function ModelsPage() {
    const [models, setModels] = useState<ModelVariation[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [initialLoading, setInitialLoading] = useState(true);

    async function loadModels() {
        const res = await fetch("/api/models");
        setModels(await res.json());
    }

    useEffect(() => {
        loadModels().finally(() => setInitialLoading(false));
    }, []);

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");
        const fd = new FormData(e.currentTarget);

        try {
            const res = await fetch("/api/models", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: fd.get("name"),
                    description: fd.get("description") || null,
                    prompt: fd.get("prompt"),
                    tags: fd.get("tags") || null,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }
            setShowModal(false);
            loadModels();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this model variation?")) return;
        await fetch(`/api/models/${id}`, { method: "DELETE" });
        loadModels();
    }

    async function handleToggle(id: string, enabled: boolean) {
        await fetch(`/api/models/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled: !enabled }),
        });
        loadModels();
    }

    if (initialLoading) return <CardGridSkeleton count={4} />;

    return (
        <>
            <div className="page-header">
                <div>
                    <h2>Model Pool</h2>
                    <p>Define different models/looks — each set gets a unique model</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + Add Model
                </button>
            </div>

            {models.length === 0 ? (
                <div className="empty-state">
                    <h3>No model variations yet</h3>
                    <p>
                        Add model descriptions to generate unique models for each set.
                        <br />
                        Without models, the agent uses your original subject reference.
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        Add Your First Model
                    </button>
                </div>
            ) : (
                <div className="card-grid">
                    {models.map((model) => (
                        <motion.div
                            key={model.id}
                            className="card"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={springAnimation}
                            style={{ opacity: model.enabled ? 1 : 0.5 }}
                        >
                            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                                <div
                                    className="card-title"
                                    style={{
                                        fontSize: 14,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    {model.name}
                                    <span
                                        className={`badge ${model.enabled ? "badge-success" : "badge-neutral"}`}
                                        style={{ fontSize: 10 }}
                                    >
                                        {model.enabled ? "active" : "disabled"}
                                    </span>
                                </div>
                            </div>

                            {model.description && (
                                <p className="text-sm text-secondary" style={{ marginBottom: 8 }}>
                                    {model.description}
                                </p>
                            )}

                            <div
                                style={{
                                    padding: 10,
                                    background: "var(--gray-50)",
                                    borderRadius: "var(--radius-sm)",
                                    marginBottom: 10,
                                    fontSize: 12,
                                    lineHeight: 1.5,
                                    color: "var(--text-secondary)",
                                    maxHeight: 80,
                                    overflow: "hidden",
                                }}
                            >
                                {model.prompt}
                            </div>

                            {model.tags && (
                                <div className="flex gap-1" style={{ flexWrap: "wrap", marginBottom: 10 }}>
                                    {model.tags.split(",").map((tag) => (
                                        <span
                                            key={tag}
                                            className="badge badge-neutral"
                                            style={{ fontSize: 10 }}
                                        >
                                            {tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="text-xs text-muted" style={{ marginBottom: 10 }}>
                                Used in {model._count?.slideshowSets || 0} sets
                            </div>

                            <div className="flex gap-2">
                                <button
                                    className={`btn btn-sm ${model.enabled ? "btn-secondary" : "btn-primary"}`}
                                    onClick={() => handleToggle(model.id, model.enabled)}
                                    style={{ flex: 1 }}
                                >
                                    {model.enabled ? "Disable" : "Enable"}
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(model.id)}
                                >
                                    ✕
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
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
                                <h3>New Model Variation</h3>
                                <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>✕</button>
                            </div>

                            <form onSubmit={handleCreate}>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input name="name" className="form-input" required placeholder="e.g. Moroccan Elegance" />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description <span className="text-muted">(optional)</span></label>
                                    <input name="description" className="form-input" placeholder="Short description" />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Model Prompt</label>
                                    <textarea
                                        name="prompt"
                                        className="form-textarea"
                                        required
                                        rows={5}
                                        placeholder="Beautiful Moroccan woman in her mid-20s, olive skin, dark brown eyes, full lips, wearing a silk cream blouse, gold jewelry, professional studio lighting, soft warm tones"
                                    />
                                    <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                                        Describe the model in detail. Be specific about ethnicity, features, outfit, and style.
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tags <span className="text-muted">(comma-separated)</span></label>
                                    <input name="tags" className="form-input" placeholder="moroccan, elegant, studio" />
                                </div>

                                {error && <p style={{ color: "var(--danger)", marginBottom: 12 }}>{error}</p>}

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? <span className="spinner" /> : "Create Model"}
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
