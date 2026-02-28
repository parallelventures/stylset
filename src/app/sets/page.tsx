"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { springAnimation } from "@/app/template";
interface Subject {
    id: string;
    name: string;
}

interface Preset {
    id: string;
    name: string;
    hairstylePrompt: string;
}

interface Template {
    id: string;
    name: string;
}

interface SlideshowSet {
    id: string;
    name: string;
    status: string;
    subjectId: string;
    createdAt: string;
    subject?: { name: string };
    _count?: { slides: number };
}

interface SlideInput {
    orderIndex: number;
    presetId?: string;
    hairstylePrompt?: string;
    negativeHairPrompt?: string;
}

function SetsPageInner() {
    const searchParams = useSearchParams();
    const prefillSubjectId = searchParams.get("subjectId") || "";

    const [sets, setSets] = useState<SlideshowSet[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [presets, setPresets] = useState<Preset[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [selectedSubject, setSelectedSubject] = useState(prefillSubjectId);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [setName, setSetName] = useState("");
    const [slides, setSlides] = useState<SlideInput[]>([]);

    async function loadData() {
        const [setsRes, subjectsRes, presetsRes, templatesRes] = await Promise.all([
            fetch("/api/sets").then((r) => r.json()),
            fetch("/api/subjects").then((r) => r.json()),
            fetch("/api/presets").then((r) => r.json()),
            fetch("/api/templates").then((r) => r.json()),
        ]);
        setSets(setsRes);
        setSubjects(subjectsRes);
        setPresets(presetsRes);
        setTemplates(templatesRes);
    }

    useEffect(() => {
        loadData();
    }, []);

    function addSlideFromPreset(preset: Preset) {
        setSlides((prev) => [
            ...prev,
            {
                orderIndex: prev.length,
                presetId: preset.id,
                hairstylePrompt: preset.hairstylePrompt,
            },
        ]);
    }

    function addCustomSlide() {
        setSlides((prev) => [
            ...prev,
            { orderIndex: prev.length, hairstylePrompt: "" },
        ]);
    }

    function removeSlide(index: number) {
        setSlides((prev) =>
            prev
                .filter((_, i) => i !== index)
                .map((s, i) => ({ ...s, orderIndex: i }))
        );
    }

    function moveSlide(index: number, direction: -1 | 1) {
        const newSlides = [...slides];
        const target = index + direction;
        if (target < 0 || target >= newSlides.length) return;
        [newSlides[index], newSlides[target]] = [newSlides[target], newSlides[index]];
        setSlides(newSlides.map((s, i) => ({ ...s, orderIndex: i })));
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedSubject || !setName || slides.length === 0) {
            setError("Subject, name, and at least one slide are required");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/sets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subjectId: selectedSubject,
                    name: setName,
                    templateId: selectedTemplate || undefined,
                    slides: slides.map((s) => ({
                        orderIndex: s.orderIndex,
                        presetId: s.presetId,
                        hairstylePrompt: s.hairstylePrompt,
                        negativeHairPrompt: s.negativeHairPrompt,
                    })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setShowModal(false);
            setSlides([]);
            setSetName("");
            loadData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h2>Slideshow Sets</h2>
                    <p>Generated image collections</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + New Set
                </button>
            </div>

            {sets.length === 0 ? (
                <div className="empty-state">
                    <h3>No sets yet</h3>
                    <p>Create a set to start generating hairstyle variations</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Subject</th>
                                <th>Slides</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {sets.map((s) => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                                    <td className="text-secondary">{s.subject?.name || s.subjectId.slice(0, 8)}</td>
                                    <td>{s._count?.slides ?? "—"}</td>
                                    <td>
                                        <span
                                            className={`badge ${s.status === "ready"
                                                ? "badge-success"
                                                : s.status === "generating"
                                                    ? "badge-warning"
                                                    : s.status === "failed"
                                                        ? "badge-danger"
                                                        : "badge-neutral"
                                                }`}
                                        >
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="text-sm text-secondary">
                                        {new Date(s.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <Link href={`/sets/${s.id}`} className="btn btn-secondary btn-sm">
                                            View
                                        </Link>
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
                            style={{ maxWidth: 700 }}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={springAnimation}
                        >
                            <div className="modal-header">
                                <h3>New Slideshow Set</h3>
                                <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleCreate}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Subject</label>
                                        <select
                                            className="form-select"
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            required
                                        >
                                            <option value="">Select subject…</option>
                                            {subjects.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Template</label>
                                        <select
                                            className="form-select"
                                            value={selectedTemplate}
                                            onChange={(e) => setSelectedTemplate(e.target.value)}
                                        >
                                            <option value="">None (default)</option>
                                            {templates.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Set Name</label>
                                    <input
                                        className="form-input"
                                        value={setName}
                                        onChange={(e) => setSetName(e.target.value)}
                                        placeholder="e.g. Spring Collection"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Slides</label>
                                    <div className="flex gap-2 mb-4" style={{ flexWrap: "wrap" }}>
                                        {presets.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => addSlideFromPreset(p)}
                                            >
                                                + {p.name}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={addCustomSlide}
                                        >
                                            + Custom
                                        </button>
                                    </div>

                                    {slides.length === 0 && (
                                        <div className="text-sm text-muted" style={{ padding: 20, textAlign: "center" }}>
                                            Add slides by clicking presets above or &quot;+ Custom&quot;
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        {slides.map((slide, i) => (
                                            <div
                                                key={i}
                                                className="slide-row"
                                            >
                                                <span
                                                    className="badge badge-neutral"
                                                    style={{ minWidth: 28, justifyContent: "center" }}
                                                >
                                                    {i + 1}
                                                </span>
                                                <input
                                                    className="form-input"
                                                    style={{ flex: 1, marginBottom: 0 }}
                                                    value={slide.hairstylePrompt || ""}
                                                    onChange={(e) => {
                                                        const updated = [...slides];
                                                        updated[i] = { ...updated[i], hairstylePrompt: e.target.value };
                                                        setSlides(updated);
                                                    }}
                                                    placeholder="Hairstyle description…"
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-icon btn-secondary"
                                                    onClick={() => moveSlide(i, -1)}
                                                    disabled={i === 0}
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-icon btn-secondary"
                                                    onClick={() => moveSlide(i, 1)}
                                                    disabled={i === slides.length - 1}
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-icon btn-danger"
                                                    onClick={() => removeSlide(i)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
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
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading || slides.length === 0}
                                    >
                                        {loading ? <span className="spinner" /> : `Create Set (${slides.length} slides)`}
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

export default function SetsPage() {
    return (
        <Suspense fallback={<div className="flex items-center gap-3" style={{ padding: 40 }}><span className="spinner" /> Loading…</div>}>
            <SetsPageInner />
        </Suspense>
    );
}
