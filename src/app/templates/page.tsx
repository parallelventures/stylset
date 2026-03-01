"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springAnimation } from "@/app/template";
import { CardGridSkeleton } from "@/components/Skeleton";
import { ConfirmModal } from "@/components/ConfirmModal";

interface Template {
    id: string;
    name: string;
    basePromptJson: string;
    createdAt: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [initialLoading, setInitialLoading] = useState(true);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

    async function load() {
        const res = await fetch("/api/templates");
        setTemplates(await res.json());
    }

    useEffect(() => {
        load().finally(() => setInitialLoading(false));
    }, []);

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const form = e.currentTarget;
        const body = {
            name: (form.elements.namedItem("name") as HTMLInputElement).value,
            basePromptJson: (form.elements.namedItem("basePromptJson") as HTMLTextAreaElement).value,
        };

        try {
            JSON.parse(body.basePromptJson);
        } catch {
            setError("Invalid JSON");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/templates", {
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

    async function handleDeleteConfirmed() {
        if (!templateToDelete) return;
        const id = templateToDelete;
        await fetch(`/api/templates/${id}`, { method: "DELETE" });
        load();
        setTemplateToDelete(null);
    }

    if (initialLoading) return <CardGridSkeleton count={3} />;

    return (
        <>
            <div className="page-header">
                <div>
                    <h2>Templates</h2>
                    <p>Slide request templates with base prompt structure</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + New Template
                </button>
            </div>

            {templates.length === 0 ? (
                <div className="empty-state">
                    <h3>No templates yet</h3>
                    <p>Create one or run the seed script</p>
                </div>
            ) : (
                <div className="card-grid">
                    {templates.map((t) => {
                        let parsed: Record<string, unknown> = {};
                        try {
                            parsed = JSON.parse(t.basePromptJson);
                        } catch {
                            /* empty */
                        }
                        return (
                            <div key={t.id} className="card">
                                <div className="flex items-center justify-between">
                                    <div className="card-title">{t.name}</div>
                                    <button
                                        className="btn btn-danger btn-sm btn-icon"
                                        onClick={() => setTemplateToDelete(t.id)}
                                        title="Delete Template"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                </div>
                                <div className="card-meta">
                                    {new Date(t.createdAt).toLocaleDateString()}
                                </div>
                                <pre className="code-preview" style={{ marginTop: 12 }}>
                                    {JSON.stringify(parsed, null, 2)}
                                </pre>
                            </div>
                        );
                    })}
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
                                <h3>New Template</h3>
                                <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)} title="Close">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            <form onSubmit={handleCreate}>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input name="name" className="form-input" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Base Prompt JSON</label>
                                    <textarea
                                        name="basePromptJson"
                                        className="form-textarea mono"
                                        rows={10}
                                        required
                                        defaultValue={JSON.stringify(
                                            {
                                                prompt: "Professional portrait photography, high quality, detailed",
                                                negative_prompt: "blurry, distorted, low quality, cartoon, drawing",
                                                style: "photorealistic",
                                                aspect_ratio: "3:4",
                                                lighting: "soft studio lighting",
                                                background: "neutral studio background",
                                            },
                                            null,
                                            2
                                        )}
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
                isOpen={!!templateToDelete}
                title="Delete Template?"
                description="Are you sure you want to delete this generation template? Styles using it may not regenerate correctly."
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setTemplateToDelete(null)}
                confirmText="Delete Template"
            />
        </>
    );
}
