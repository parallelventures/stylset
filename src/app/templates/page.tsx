"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springAnimation } from "@/app/template";
import { CardGridSkeleton } from "@/components/Skeleton";

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

    async function handleDelete(id: string) {
        if (!confirm("Delete this template?")) return;
        await fetch(`/api/templates/${id}`, { method: "DELETE" });
        load();
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
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(t.id)}
                                    >
                                        Delete
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
                                <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>
                                    ✕
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
