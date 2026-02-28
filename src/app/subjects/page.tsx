"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storageUrl } from "@/lib/urls";
import { motion, AnimatePresence } from "framer-motion";
import { springAnimation } from "@/app/template";
import { CardGridSkeleton } from "@/components/Skeleton";

interface Subject {
    id: string;
    name: string;
    description: string | null;
    referenceImagePaths: string;
    lockedAttributesJson: string;
    createdAt: string;
}

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [initialLoading, setInitialLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const router = useRouter();

    async function loadSubjects() {
        const res = await fetch("/api/subjects");
        const data = await res.json();
        setSubjects(data);
    }

    useEffect(() => {
        loadSubjects().finally(() => setInitialLoading(false));
    }, []);

    function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(e.target.files || []);
        setFiles(selected);
        setPreviews(selected.map((f) => URL.createObjectURL(f)));
    }

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const form = e.currentTarget;
        const fd = new FormData();
        fd.set("name", (form.elements.namedItem("name") as HTMLInputElement).value);
        fd.set("description", (form.elements.namedItem("description") as HTMLTextAreaElement).value);
        fd.set(
            "lockedAttributesJson",
            (form.elements.namedItem("lockedAttributesJson") as HTMLTextAreaElement).value || "{}"
        );

        for (const f of files) {
            fd.append("images", f);
        }

        try {
            const res = await fetch("/api/subjects", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setShowModal(false);
            setFiles([]);
            setPreviews([]);
            loadSubjects();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create subject");
        } finally {
            setLoading(false);
        }
    }

    async function handleQuickGenerate(subjectId: string) {
        setGenerating(subjectId);
        try {
            const res = await fetch(`/api/subjects/${subjectId}/generate`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            // Navigate to the new set
            router.push(`/sets/${data.setId}`);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Generation failed");
            setGenerating(null);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this subject and all its data?")) return;
        await fetch(`/api/subjects/${id}`, { method: "DELETE" });
        loadSubjects();
    }

    if (initialLoading) return <CardGridSkeleton count={4} hasImage />;

    return (
        <>
            <div className="page-header">
                <div>
                    <h2>Subjects</h2>
                    <p>Upload a reference photo, then generate all hairstyles automatically</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + New Subject
                </button>
            </div>

            {subjects.length === 0 ? (
                <div className="empty-state">
                    <h3>No subjects yet</h3>
                    <p>Upload a reference image to get started</p>
                    <button
                        className="btn btn-primary"
                        style={{ marginTop: 16 }}
                        onClick={() => setShowModal(true)}
                    >
                        Upload Subject
                    </button>
                </div>
            ) : (
                <div className="card-grid">
                    {subjects.map((s) => {
                        const images: string[] = JSON.parse(s.referenceImagePaths || "[]");
                        const isGenerating = generating === s.id;
                        return (
                            <div key={s.id} className="card">
                                {images.length > 0 && (
                                    <div style={{ marginBottom: 14 }}>
                                        <div style={{
                                            display: "flex",
                                            gap: 6,
                                            overflow: "hidden",
                                            borderRadius: "var(--radius-sm)",
                                        }}>
                                            {images.slice(0, 3).map((img, i) => (
                                                <img
                                                    key={i}
                                                    src={storageUrl(img)}
                                                    alt={`ref ${i}`}
                                                    style={{
                                                        width: images.length === 1 ? "100%" : `${100 / Math.min(images.length, 3)}%`,
                                                        height: 140,
                                                        objectFit: "cover",
                                                        borderRadius: "var(--radius-sm)",
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="card-title">{s.name}</div>
                                {s.description && (
                                    <div className="text-sm text-secondary" style={{ marginTop: 2 }}>
                                        {s.description}
                                    </div>
                                )}
                                <div className="card-meta" style={{ marginTop: 6 }}>
                                    {images.length} ref image{images.length !== 1 ? "s" : ""} · {new Date(s.createdAt).toLocaleDateString()}
                                </div>

                                <div className="flex gap-2" style={{ marginTop: 14 }}>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleQuickGenerate(s.id)}
                                        disabled={isGenerating}
                                        style={{ flex: 1 }}
                                    >
                                        {isGenerating ? (
                                            <><span className="spinner" /> Generating…</>
                                        ) : (
                                            "⚡ Generate All Hairstyles"
                                        )}
                                    </button>
                                    <Link href={`/subjects/${s.id}`} className="btn btn-secondary btn-sm">
                                        View
                                    </Link>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(s.id)}
                                    >
                                        ×
                                    </button>
                                </div>
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
                                <h3>New Subject</h3>
                                <button
                                    className="btn btn-icon btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleCreate}>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        name="name"
                                        className="form-input"
                                        placeholder="e.g. Model A"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description (optional)</label>
                                    <textarea
                                        name="description"
                                        className="form-textarea"
                                        placeholder="Brief notes about the subject"
                                        rows={2}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Reference Photos</label>
                                    <div
                                        className="upload-zone"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <p style={{ fontWeight: 500, color: "var(--text)" }}>Click to upload</p>
                                        <p className="text-xs text-muted">PNG, JPG, WebP — These are immutable after creation</p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFiles}
                                        style={{ display: "none" }}
                                    />
                                    {previews.length > 0 && (
                                        <div className="upload-preview">
                                            {previews.map((p, i) => (
                                                <img key={i} src={p} alt="" className="upload-preview-img" />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Scene attributes (JSON)</label>
                                    <textarea
                                        name="lockedAttributesJson"
                                        className="form-textarea mono"
                                        rows={4}
                                        defaultValue={JSON.stringify(
                                            {
                                                wardrobe: "current outfit in reference",
                                                background: "same as reference",
                                                lighting: "same as reference",
                                                camera: "same framing as reference",
                                            },
                                            null,
                                            2
                                        )}
                                    />
                                    <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                                        These attributes are locked — only hairstyle will change across generations
                                    </div>
                                </div>

                                {error && (
                                    <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>
                                        {error}
                                    </div>
                                )}

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading || files.length === 0}
                                    >
                                        {loading ? <span className="spinner" /> : "Create Subject"}
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
