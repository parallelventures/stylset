"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storageUrl } from "@/lib/urls";
import { motion, AnimatePresence } from "framer-motion";
import { springAnimation } from "@/app/template";
import { CardGridSkeleton } from "@/components/Skeleton";
import { Select } from "@/components/Select";
import { ConfirmModal } from "@/components/ConfirmModal";

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
    const [showAutoModal, setShowAutoModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [initialLoading, setInitialLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [generatingSubject, setGeneratingSubject] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
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

    async function handleAutoGenerateSubject(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setGeneratingSubject(true);
        const form = e.currentTarget;

        try {
            const body = {
                ethnicity: (form.elements.namedItem("ethnicity") as HTMLSelectElement).value,
                age: (form.elements.namedItem("age") as HTMLSelectElement).value,
                hairColor: (form.elements.namedItem("hairColor") as HTMLSelectElement).value,
                outfit: (form.elements.namedItem("outfit") as HTMLSelectElement).value,
                background: (form.elements.namedItem("background") as HTMLSelectElement).value,
                makeup: (form.elements.namedItem("makeup") as HTMLSelectElement).value,
                expression: (form.elements.namedItem("expression") as HTMLSelectElement).value,
                lighting: (form.elements.namedItem("lighting") as HTMLSelectElement).value,
            };

            const res = await fetch("/api/subjects/auto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setShowAutoModal(false);
            loadSubjects();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to auto-generate subject");
        } finally {
            setGeneratingSubject(false);
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

    async function handleDeleteConfirmed() {
        if (!subjectToDelete) return;
        const id = subjectToDelete;
        await fetch(`/api/subjects/${id}`, { method: "DELETE" });
        loadSubjects();
        setSubjectToDelete(null);
    }

    if (initialLoading) return <CardGridSkeleton count={4} hasImage />;

    return (
        <>
            <div className="page-header">
                <div>
                    <h2>Subjects</h2>
                    <p>Upload a reference photo, then generate all hairstyles automatically</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowAutoModal(true)}
                        disabled={generatingSubject}
                    >
                        {generatingSubject ? <><span className="spinner" /> Generating...</> : "✨ Auto-Generate Subject"}
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Upload Subject
                    </button>
                </div>
            </div>

            {subjects.length === 0 ? (
                <div className="empty-state">
                    <h3>No subjects yet</h3>
                    <p>Upload a reference image to get started</p>
                    <div style={{ display: "flex", gap: "8px", marginTop: 16 }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowModal(true)}
                        >
                            Upload Subject
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowAutoModal(true)}
                            disabled={generatingSubject}
                        >
                            {generatingSubject ? <><span className="spinner" /> Generating...</> : "✨ Auto-Generate Subject"}
                        </button>
                    </div>
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
                                                        height: "auto",
                                                        aspectRatio: "3/4",
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
                                        className="btn btn-danger btn-sm btn-icon"
                                        onClick={() => setSubjectToDelete(s.id)}
                                        title="Delete Subject"
                                        style={{ flexShrink: 0 }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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
                                    title="Close"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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

            <AnimatePresence>
                {showAutoModal && (
                    <motion.div
                        className="modal-overlay"
                        onClick={() => !generatingSubject && setShowAutoModal(false)}
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
                                <h3>✨ Auto-Generate Subject</h3>
                                <button
                                    className="btn btn-icon btn-secondary"
                                    onClick={() => setShowAutoModal(false)}
                                    disabled={generatingSubject}
                                    title="Close"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <form onSubmit={handleAutoGenerateSubject}>
                                <div className="form-group">
                                    <label className="form-label">Ethnicity / Skin Tone</label>
                                    <Select
                                        name="ethnicity"
                                        defaultValue="medium skin tone"
                                        items={[
                                            { value: "fair skin tone, caucasian", label: "Caucasian / Fair" },
                                            { value: "medium skin tone, hispanic", label: "Hispanic / Latin" },
                                            { value: "olive skin tone, middle eastern", label: "Middle Eastern / Olive" },
                                            { value: "dark skin tone, black", label: "Black / Dark" },
                                            { value: "light skin tone, east asian", label: "East Asian / Light" },
                                            { value: "brown skin tone, south asian", label: "South Asian / Brown" }
                                        ]}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Age</label>
                                    <Select
                                        name="age"
                                        defaultValue="Young"
                                        items={[
                                            { value: "Teenage", label: "Teenage" },
                                            { value: "Young", label: "Young (20s)" },
                                            { value: "Middle-aged", label: "Adult (30s-40s)" },
                                            { value: "Mature", label: "Mature (50s+)" }
                                        ]}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Hair Color</label>
                                    <Select
                                        name="hairColor"
                                        defaultValue="Dark espresso brown"
                                        items={[
                                            { value: "Dark espresso brown", label: "Dark Espresso Brown" },
                                            { value: "Jet black", label: "Jet Black" },
                                            { value: "Soft honey blonde", label: "Soft Honey Blonde" },
                                            { value: "Icy platinum blonde", label: "Icy Platinum Blonde" },
                                            { value: "Warm copper red", label: "Warm Copper Red" },
                                            { value: "Ash brown", label: "Ash Brown" }
                                        ]}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Outfit</label>
                                    <Select
                                        name="outfit"
                                        defaultValue="Simple heather grey fitted t-shirt"
                                        items={[
                                            { value: "Simple heather grey fitted t-shirt", label: "Heather Grey T-Shirt" },
                                            { value: "Elegant white silk slip dress", label: "White Silk Slip Dress" },
                                            { value: "Sleek black turtleneck sweater", label: "Black Turtleneck" },
                                            { value: "Minimalist beige trench coat", label: "Beige Trench Coat" },
                                            { value: "Classic denim jacket over a white tee", label: "Denim Jacket" },
                                            { value: "Black leather moto jacket", label: "Black Leather Moto Jacket" },
                                            { value: "Cozy oversized cream knit sweater", label: "Oversized Cream Sweater" },
                                            { value: "Crisp white button-down shirt", label: "White Button-Down Shirt" },
                                            { value: "Stylish tailored navy blazer", label: "Tailored Navy Blazer" },
                                            { value: "Casual vintage graphic tee", label: "Vintage Graphic Tee" },
                                            { value: "Bohemian floral maxi dress", label: "Floral Maxi Dress" },
                                            { value: "Athleisure black sports bra and leggings", label: "Athleisure Sports Bra" },
                                            { value: "Structured tweed cropped jacket", label: "Structured Tweed Jacket" },
                                            { value: "Chic monochrome matching trousers and vest", label: "Monochrome Vest & Trousers" }
                                        ]}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Background</label>
                                    <Select
                                        name="background"
                                        defaultValue="Solid high-key PURE WHITE seamless studio backdrop"
                                        items={[
                                            { value: "Solid high-key PURE WHITE seamless studio backdrop", label: "Pure White Studio" },
                                            { value: "Soft warm beige seamless backdrop", label: "Warm Beige Studio" },
                                            { value: "Moody dark slate gray backdrop", label: "Dark Moody Studio" }
                                        ]}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Expression</label>
                                    <Select
                                        name="expression"
                                        defaultValue="neutral expression"
                                        items={[
                                            { value: "neutral expression", label: "Neutral & Serene" },
                                            { value: "soft gentle smile", label: "Soft Gentle Smile" },
                                            { value: "fierce editorial gaze", label: "Fierce Editorial Gaze" },
                                            { value: "playful smirk", label: "Playful Smirk" }
                                        ]}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Makeup Style</label>
                                    <Select
                                        name="makeup"
                                        defaultValue="soft natural everyday makeup"
                                        items={[
                                            { value: "soft natural everyday makeup", label: "Soft Natural / No-Makeup Look" },
                                            { value: "glamorous evening makeup with red lips", label: "Glamorous Red Lips" },
                                            { value: "smokey eyes with nude lips", label: "Smokey Eyes & Nude Lips" },
                                            { value: "dewy glowing glass skin, minimal makeup", label: "Dewy Glass Skin" },
                                            { value: "bold dramatic editorial makeup", label: "Bold Editorial" }
                                        ]}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Lighting</label>
                                    <Select
                                        name="lighting"
                                        defaultValue="Soft shadowless studio lighting"
                                        items={[
                                            { value: "Soft shadowless studio lighting", label: "Soft Shadowless Studio" },
                                            { value: "Dramatic moody chiaroscuro lighting", label: "Dramatic Moody (Chiaroscuro)" },
                                            { value: "Warm golden hour natural sunlight lighting", label: "Warm Golden Hour Sunlight" },
                                            { value: "Hard flash editorial photography lighting", label: "Hard Flash Editorial" },
                                            { value: "Cinematic neon rim lighting", label: "Cinematic Neon Rim Light" }
                                        ]}
                                    />
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowAutoModal(false)}
                                        disabled={generatingSubject}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={generatingSubject}
                                    >
                                        {generatingSubject ? <span className="spinner" /> : "Generate ✨"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <ConfirmModal
                isOpen={!!subjectToDelete}
                title="Delete Subject?"
                description="This will permanently delete this subject, all their generated sets, and permanently remove the reference images. This action cannot be undone."
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setSubjectToDelete(null)}
                confirmText="Delete Subject"
            />
        </>
    );
}
