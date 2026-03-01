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
    const [showAutoModal, setShowAutoModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [initialLoading, setInitialLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [generatingSubject, setGeneratingSubject] = useState(false);
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
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleAutoGenerateSubject}>
                                <div className="form-group">
                                    <label className="form-label">Ethnicity / Skin Tone</label>
                                    <select name="ethnicity" className="form-input" defaultValue="medium skin tone">
                                        <option value="fair skin tone, caucasian">Caucasian / Fair</option>
                                        <option value="medium skin tone, hispanic">Hispanic / Latin</option>
                                        <option value="olive skin tone, middle eastern">Middle Eastern / Olive</option>
                                        <option value="dark skin tone, black">Black / Dark</option>
                                        <option value="light skin tone, east asian">East Asian / Light</option>
                                        <option value="brown skin tone, south asian">South Asian / Brown</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Age</label>
                                    <select name="age" className="form-input" defaultValue="Young">
                                        <option value="Teenage">Teenage</option>
                                        <option value="Young">Young (20s)</option>
                                        <option value="Middle-aged">Adult (30s-40s)</option>
                                        <option value="Mature">Mature (50s+)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Hair Color</label>
                                    <select name="hairColor" className="form-input" defaultValue="Dark espresso brown">
                                        <option value="Dark espresso brown">Dark Espresso Brown</option>
                                        <option value="Jet black">Jet Black</option>
                                        <option value="Soft honey blonde">Soft Honey Blonde</option>
                                        <option value="Icy platinum blonde">Icy Platinum Blonde</option>
                                        <option value="Warm copper red">Warm Copper Red</option>
                                        <option value="Ash brown">Ash Brown</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Outfit</label>
                                    <select name="outfit" className="form-input" defaultValue="Simple heather grey fitted t-shirt">
                                        <option value="Simple heather grey fitted t-shirt">Heather Grey T-Shirt</option>
                                        <option value="Elegant white silk slip dress">White Silk Slip Dress</option>
                                        <option value="Sleek black turtleneck sweater">Black Turtleneck</option>
                                        <option value="Minimalist beige trench coat">Beige Trench Coat</option>
                                        <option value="Classic denim jacket over a white tee">Denim Jacket</option>
                                        <option value="Black leather moto jacket">Black Leather Moto Jacket</option>
                                        <option value="Cozy oversized cream knit sweater">Oversized Cream Sweater</option>
                                        <option value="Crisp white button-down shirt">White Button-Down Shirt</option>
                                        <option value="Stylish tailored navy blazer">Tailored Navy Blazer</option>
                                        <option value="Casual vintage graphic tee">Vintage Graphic Tee</option>
                                        <option value="Bohemian floral maxi dress">Floral Maxi Dress</option>
                                        <option value="Athleisure black sports bra and leggings">Athleisure Sports Bra</option>
                                        <option value="Structured tweed cropped jacket">Structured Tweed Jacket</option>
                                        <option value="Chic monochrome matching trousers and vest">Monochrome Vest & Trousers</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Background</label>
                                    <select name="background" className="form-input" defaultValue="Solid high-key PURE WHITE seamless studio backdrop">
                                        <option value="Solid high-key PURE WHITE seamless studio backdrop">Pure White Studio</option>
                                        <option value="Soft warm beige seamless backdrop">Warm Beige Studio</option>
                                        <option value="Moody dark slate gray backdrop">Dark Moody Studio</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Expression</label>
                                    <select name="expression" className="form-input" defaultValue="neutral expression">
                                        <option value="neutral expression">Neutral & Serene</option>
                                        <option value="soft gentle smile">Soft Gentle Smile</option>
                                        <option value="fierce editorial gaze">Fierce Editorial Gaze</option>
                                        <option value="playful smirk">Playful Smirk</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Makeup Style</label>
                                    <select name="makeup" className="form-input" defaultValue="soft natural everyday makeup">
                                        <option value="soft natural everyday makeup">Soft Natural / No-Makeup Look</option>
                                        <option value="glamorous evening makeup with red lips">Glamorous Red Lips</option>
                                        <option value="smokey eyes with nude lips">Smokey Eyes & Nude Lips</option>
                                        <option value="dewy glowing glass skin, minimal makeup">Dewy Glass Skin</option>
                                        <option value="bold dramatic editorial makeup">Bold Editorial</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Lighting</label>
                                    <select name="lighting" className="form-input" defaultValue="Soft shadowless studio lighting">
                                        <option value="Soft shadowless studio lighting">Soft Shadowless Studio</option>
                                        <option value="Dramatic moody chiaroscuro lighting">Dramatic Moody (Chiaroscuro)</option>
                                        <option value="Warm golden hour natural sunlight lighting">Warm Golden Hour Sunlight</option>
                                        <option value="Hard flash editorial photography lighting">Hard Flash Editorial</option>
                                        <option value="Cinematic neon rim lighting">Cinematic Neon Rim Light</option>
                                    </select>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowAutoModal(false)}
                                        disabled={generatingSubject}
                                    >
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
        </>
    );
}
