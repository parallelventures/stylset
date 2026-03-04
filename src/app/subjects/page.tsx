"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storageUrl } from "@/lib/urls";
import { motion, AnimatePresence } from "framer-motion";
import { springAnimation } from "@/app/template";
import { CardGridSkeleton } from "@/components/Skeleton";
import { ConfirmModal } from "@/components/ConfirmModal";

interface Subject {
    id: string;
    name: string;
    description: string | null;
    referenceImagePaths: string;
    lockedAttributesJson: string;
    createdAt: string;
}

const AESTHETIC_OUTFITS: Record<string, { value: string, label: string }[]> = {
    "classic": [
        { value: "structured corset-style top, matte premium crepe, clean lines (white)", label: "White Corset Top" },
        { value: "elegant minimalist slip dress", label: "Minimalist Slip Dress" },
        { value: "crisp white button-down shirt, slightly unbuttoned", label: "White Button-Down" },
        { value: "simple high-quality fitted t-shirt", label: "Fitted T-Shirt" },
        { value: "chic black turtleneck sweater", label: "Black Turtleneck" },
        { value: "tailored beige trench coat over a white tee", label: "Beige Trench & White Tee" },
        { value: "elegant silk blouse with bow tie", label: "Silk Bow Blouse" },
        { value: "strapless sweetheart neckline gown bodice", label: "Strapless Sweetheart Gown (Bodice)" },
    ],
    "clean tiktok girl": [
        { value: "casual stylish denim and white crop top", label: "Denim & Crop Top" },
        { value: "cozy oversized ribbed sweater off one shoulder", label: "Off-Shoulder Sweater" },
        { value: "trendy matching athleisure set", label: "Athleisure Set" },
        { value: "simple sleek bodysuit", label: "Sleek Bodysuit" },
        { value: "cute knit pastel cardigan and camisole", label: "Pastel Cardigan" },
        { value: "baggy vintage t-shirt and loose jeans", label: "Baggy Vintage Tee" },
        { value: "basic white tank top with silver jewelry", label: "White Tank + Silver Jewelry" },
        { value: "plaid shirt open over a bra top", label: "Plaid Shirt Over Bra" },
    ],
    "y2k": [
        { value: "velour tracksuit jacket with rhinestone details", label: "Velour Tracksuit" },
        { value: "cropped baby tee with a cute graphic", label: "Graphic Baby Tee" },
        { value: "denim halter top", label: "Denim Halter" },
        { value: "metallic tube top", label: "Metallic Tube Top" },
        { value: "asymmetrical off-shoulder long sleeve", label: "Asymmetrical Off-Shoulder" },
        { value: "pleated mini skirt with a tied front top", label: "Tied Front Top" },
        { value: "mesh long sleeve printed top over a cami", label: "Mesh Printed Top" },
        { value: "fuzzy faux fur trim cardigan", label: "Fuzzy Trim Cardigan" },
    ],
    "goth": [
        { value: "black lace-trimmed corset top", label: "Lace Corset" },
        { value: "fishnet long sleeve under a vintage black band tee", label: "Fishnet & Band Tee" },
        { value: "dark romantic ruffled black blouse", label: "Ruffled Blouse" },
        { value: "structured leather bustier", label: "Leather Bustier" },
        { value: "sheer black mesh crop top", label: "Sheer Mesh Crop Top" },
        { value: "strappy pentagram harness over black dress", label: "Harness over Black Dress" },
        { value: "velvet off-shoulder top in deep burgundy", label: "Burgundy Velvet Top" },
        { value: "black latex zip-up top", label: "Black Latex Zip-Up" },
    ],
    "old money": [
        { value: "cashmere turtleneck sweater in camel", label: "Camel Turtleneck" },
        { value: "stylish tailored navy blazer over white top", label: "Navy Blazer" },
        { value: "elegant pearl button cardigan", label: "Pearl Cardigan" },
        { value: "classic tweed cropped jacket", label: "Tweed Jacket" },
        { value: "cable knit v-neck tennis sweater", label: "Cable Knit Tennis Sweater" },
        { value: "silk scarf tied over a crisp oxford shirt", label: "Oxford + Silk Scarf" },
        { value: "high-neck ruffled poplin blouse", label: "High-Neck Poplin Blouse" },
        { value: "tan cashmere wrap coat", label: "Cashmere Wrap Coat" },
    ],
    "parisian girl": [
        { value: "structured black bustier top, fashion not lingerie", label: "Black Bustier" },
        { value: "classic breton striped long sleeve top", label: "Striped Top" },
        { value: "effortless oversized button-down shirt tucked in", label: "Oversized Shirt" },
        { value: "chic vintage silk camisole", label: "Silk Camisole" },
        { value: "red wrap top with tiny white polka dots", label: "Polka Dot Wrap Top" },
        { value: "oversized men's blazer worn as a dress", label: "Oversized Blazer" },
        { value: "soft mohair v-neck sweater, slightly messy", label: "Mohair V-Neck" },
        { value: "simple black slip dress with dainty jewelry", label: "Black Slip Dress" },
    ]
};

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [presets, setPresets] = useState<any[]>([]);
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
    const [editingSubject, setEditingSubject] = useState<{ id: string; name: string } | null>(null);
    const [aesthetic, setAesthetic] = useState("classic");
    const [outfit, setOutfit] = useState("structured corset-style top, matte premium crepe, clean lines (white)");
    const [enhanceQuality, setEnhanceQuality] = useState(false);
    const router = useRouter();

    async function loadSubjects() {
        const res = await fetch("/api/subjects");
        const data = await res.json();
        setSubjects(data);
    }

    async function loadPresets() {
        const res = await fetch("/api/presets");
        const data = await res.json();
        setPresets(data);
    }

    useEffect(() => {
        Promise.all([loadSubjects(), loadPresets()]).finally(() => setInitialLoading(false));
    }, []);

    function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(e.target.files || []);
        setFiles(selected);
        setPreviews(selected.map((f) => URL.createObjectURL(f)));
    }

    function handleAestheticChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const val = e.target.value;
        setAesthetic(val);
        const options = AESTHETIC_OUTFITS[val] || AESTHETIC_OUTFITS["classic"];
        setOutfit(options[0].value);
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
        fd.set("enhanceQuality", enhanceQuality.toString());

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
            const fd = new FormData();
            fd.set("aesthetic", (form.elements.namedItem("aesthetic") as HTMLSelectElement).value);
            fd.set("ethnicity", (form.elements.namedItem("ethnicity") as HTMLSelectElement).value);
            fd.set("age", (form.elements.namedItem("age") as HTMLSelectElement).value);
            fd.set("hairColor", (form.elements.namedItem("hairColor") as HTMLSelectElement).value);
            fd.set("outfit", (form.elements.namedItem("outfit") as HTMLSelectElement).value);
            fd.set("pose", (form.elements.namedItem("pose") as HTMLSelectElement).value);
            fd.set("makeup", (form.elements.namedItem("makeup") as HTMLSelectElement).value);
            fd.set("expression", (form.elements.namedItem("expression") as HTMLSelectElement).value);

            const combo = (form.elements.namedItem("hairstyleCombo") as HTMLSelectElement).value;
            if (combo.startsWith("PRESET:")) {
                const presetId = combo.split(":")[1];
                const preset = presets.find(p => p.id === presetId);
                if (preset) {
                    fd.set("hairstylePrompt", preset.hairstylePrompt);
                    fd.set("hairstyleName", preset.name);
                }
            } else if (combo.startsWith("MANUAL:")) {
                fd.set("hairstylePrompt", combo.replace("MANUAL:", ""));
            } else {
                fd.set("hairstylePrompt", "glossy. Straight to wavy, thick, smooth. Long layered butterfly cut, 90s blowout style. Face-framing curtain bangs. Heavily layered mid-lengths to ends. Voluminous.");
            }

            const res = await fetch("/api/subjects/auto", {
                method: "POST",
                body: fd,
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
            const res = await fetch(`/api/subjects/${subjectId}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            // Navigate to the new set
            router.push(`/sets/${data.setId}`);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Generation failed");
            setGenerating(null);
        }
    }

    async function handleGenerateSelfies(subjectId: string) {
        setGenerating(subjectId + "_selfies");
        try {
            const res = await fetch(`/api/subjects/${subjectId}/generate-selfies`, {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            // Navigate to the new set
            router.push(`/sets/${data.setId}`);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Selfie generation failed");
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

    async function handleDownloadSubject(s: Subject) {
        try {
            const images: string[] = JSON.parse(s.referenceImagePaths || "[]");
            for (let i = 0; i < images.length; i++) {
                const url = storageUrl(images[i]);
                const res = await fetch(url);
                const blob = await res.blob();
                const objectUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = objectUrl;
                a.download = `${s.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ref${i > 0 ? i : ''}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(objectUrl);
            }
        } catch (err) {
            console.error("Failed to download", err);
        }
    }

    async function handleUpdateSubjectName(id: string, newName: string) {
        if (!newName.trim()) {
            setEditingSubject(null);
            return;
        }

        try {
            const res = await fetch(`/api/subjects/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim() })
            });
            if (res.ok) {
                setSubjects(subjects.map(s => s.id === id ? { ...s, name: newName.trim() } : s));
            }
        } catch (err) {
            console.error("Failed to update subject name", err);
        } finally {
            setEditingSubject(null);
        }
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
                        const isGeneratingSelfies = generating === s.id + "_selfies";
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

                                {editingSubject?.id === s.id ? (
                                    <input
                                        autoFocus
                                        className="form-input text-sm"
                                        style={{ padding: "4px 8px", height: "auto", margin: "-4px -8px" }}
                                        value={editingSubject.name}
                                        onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleUpdateSubjectName(s.id, editingSubject.name);
                                            if (e.key === "Escape") setEditingSubject(null);
                                        }}
                                        onBlur={() => handleUpdateSubjectName(s.id, editingSubject.name)}
                                    />
                                ) : (
                                    <div
                                        className="card-title cursor-pointer hover:opacity-70 transition-opacity"
                                        onClick={() => setEditingSubject({ id: s.id, name: s.name })}
                                        title="Click to rename"
                                    >
                                        {s.name}
                                    </div>
                                )}
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
                                        disabled={isGenerating || isGeneratingSelfies}
                                        style={{ flex: 1 }}
                                    >
                                        {isGenerating ? (
                                            <><span className="spinner" /> Generating…</>
                                        ) : (
                                            "⚡ All Hairstyles"
                                        )}
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleGenerateSelfies(s.id)}
                                        disabled={isGenerating || isGeneratingSelfies}
                                        style={{ flex: 1 }}
                                    >
                                        {isGeneratingSelfies ? (
                                            <><span className="spinner" /> Generating…</>
                                        ) : (
                                            "📸 Selfies"
                                        )}
                                    </button>
                                </div>

                                <div className="flex gap-2" style={{ marginTop: 8 }}>
                                    <Link href={`/subjects/${s.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: "center", justifyContent: "center" }}>
                                        View
                                    </Link>
                                    <a
                                        href={`/api/subjects/${s.id}/download`}
                                        download
                                        className="btn btn-secondary btn-sm btn-icon"
                                        title="Download All Generations"
                                        style={{ flexShrink: 0 }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                                    </a>
                                    <button
                                        className="btn btn-secondary btn-sm btn-icon"
                                        onClick={() => handleDownloadSubject(s)}
                                        title="Download Reference"
                                        style={{ flexShrink: 0 }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    </button>
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
            )
            }

            <AnimatePresence>
                {
                    showModal && (
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

                                    <div className="form-group" style={{ marginTop: "-12px", marginBottom: "16px" }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer", color: "var(--text-secondary)" }}>
                                            <input
                                                type="checkbox"
                                                checked={enhanceQuality}
                                                onChange={(e) => setEnhanceQuality(e.target.checked)}
                                                style={{ accentColor: "var(--primary)" }}
                                            />
                                            ✨ Enhance quality and resolution with AI
                                        </label>
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
                    )
                }
            </AnimatePresence >

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
                                    <label className="form-label">Hairstyle</label>
                                    <select name="hairstyleCombo" className="form-select" defaultValue="DEFAULT">
                                        <optgroup label="General Styles">
                                            <option value="DEFAULT">90s Blowout Layered</option>
                                            <option value="MANUAL:sleek straight long hair, center part, glossy, perfectly smooth glass hair">Sleek Straight Glass Hair</option>
                                            <option value="MANUAL:loose effortless beach waves, texturized, casual and chic">Effortless Beach Waves</option>
                                            <option value="MANUAL:textured wavy long bob, shoulder length lob, effortless cool girl waves">Wavy Lob</option>
                                            <option value="MANUAL:perfectly defined ringlet curls, highly textured, moisturizing shine, flawless curly hair">Defined Curls</option>
                                            <option value="MANUAL:sharp chin-length classic french bob, slight effortless wave">Classic French Bob</option>
                                            <option value="MANUAL:half-up half-down styling, sleek crown, long voluminous lengths, soft fashion glam">Half-Up Half-Down Glam</option>
                                            <option value="MANUAL:tight bouncy curls, extreme volume, natural texture, healthy shine">Voluminous Natural Curls</option>
                                            <option value="MANUAL:messy romantic 90s updo with face framing pieces">Romantic 90s Updo</option>
                                            <option value="MANUAL:long straight hair with blunt bangs across forehead">Long Hair + Blunt Bangs</option>
                                            <option value="MANUAL:feathered layers throughout, massive 90s supermodel volume, airy flipped ends">Feathered Supermodel Layers</option>
                                            <option value="MANUAL:chic gamine pixie cut, short, defined texture, effortless">Chic Pixie Cut</option>
                                            <option value="MANUAL:sleek high ponytail, snatched, smooth, polished">Sleek High Ponytail</option>
                                        </optgroup>
                                        {presets.length > 0 && (
                                            <optgroup label="Saved Presets">
                                                {presets.map(p => (
                                                    <option key={`PRESET:${p.id}`} value={`PRESET:${p.id}`}>{p.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Aesthetic / Style</label>
                                    <select name="aesthetic" className="form-select" value={aesthetic} onChange={handleAestheticChange}>
                                        <option value="classic">Classic Beauty</option>
                                        <option value="clean tiktok girl">Clean TikTok Girl</option>
                                        <option value="y2k">Y2K Nostalgia</option>
                                        <option value="goth">Goth / Alternative</option>
                                        <option value="old money">Quiet Luxury / Old Money</option>
                                        <option value="parisian girl">Parisian Girl / Effortless</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Ethnicity / Skin Tone</label>
                                    <select name="ethnicity" className="form-select" defaultValue="medium skin tone">
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
                                    <select name="age" className="form-select" defaultValue="Young">
                                        <option value="Teenage">Teenage</option>
                                        <option value="Young">Young (20s)</option>
                                        <option value="Middle-aged">Adult (30s-40s)</option>
                                        <option value="Mature">Mature (50s+)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Hair Color</label>
                                    <select name="hairColor" className="form-select" defaultValue="Dark espresso brown">
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
                                    <select name="outfit" className="form-select" value={outfit} onChange={(e) => setOutfit(e.target.value)}>
                                        {(AESTHETIC_OUTFITS[aesthetic] || AESTHETIC_OUTFITS["classic"]).map((opt, i) => (
                                            <option key={i} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Pose</label>
                                    <select name="pose" className="form-select" defaultValue="standing tall, shoulders relaxed, arms down and fully out of frame">
                                        <option value="standing tall, shoulders relaxed, arms down and fully out of frame">Standing Tall (Arms out of frame)</option>
                                        <option value="subtle contrapposto, hands on hips (cropped out of frame)">Subtle Contrapposto</option>
                                        <option value="sitting slightly angled, looking over shoulder">Looking Over Shoulder</option>
                                        <option value="close up portrait, head tilted slightly">Close-Up Portrait</option>
                                    </select>
                                </div>


                                <div className="form-group">
                                    <label className="form-label">Expression</label>
                                    <select name="expression" className="form-select" defaultValue="neutral expression">
                                        <option value="neutral expression">Neutral & Serene</option>
                                        <option value="soft gentle smile">Soft Gentle Smile</option>
                                        <option value="fierce editorial gaze">Fierce Editorial Gaze</option>
                                        <option value="playful smirk">Playful Smirk</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Makeup Style</label>
                                    <select name="makeup" className="form-select" defaultValue="soft natural everyday makeup">
                                        <option value="soft natural everyday makeup">Soft Natural / No-Makeup Look</option>
                                        <option value="glamorous evening makeup with red lips">Glamorous Red Lips</option>
                                        <option value="smokey eyes with nude lips">Smokey Eyes & Nude Lips</option>
                                        <option value="dewy glowing glass skin, minimal makeup">Dewy Glass Skin</option>
                                        <option value="bold dramatic editorial makeup">Bold Editorial</option>
                                    </select>
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
