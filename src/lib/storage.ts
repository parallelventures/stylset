/**
 * Storage — Supabase Storage
 *
 * All files go to the "styleset" bucket in Supabase Storage.
 * Paths: subjects/{id}/ref_0.png, sets/{id}/images/000.png, etc.
 */
import { getSupabase, BUCKET, getPublicUrl } from "./supabase";
import crypto from "crypto";

// ─── Upload a buffer to Supabase Storage ───
export async function uploadFile(
    storagePath: string,
    buffer: Buffer,
    contentType = "image/png",
): Promise<string> {
    const { error } = await getSupabase().storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
            contentType,
            upsert: true,
        });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    return getPublicUrl(BUCKET, storagePath);
}

// ─── Upload a JSON object ───
export async function uploadJson(storagePath: string, data: unknown): Promise<string> {
    const buffer = Buffer.from(JSON.stringify(data, null, 2));
    return uploadFile(storagePath, buffer, "application/json");
}

// ─── Download a file as Buffer ───
export async function downloadFile(storagePath: string): Promise<Buffer> {
    const { data, error } = await getSupabase().storage
        .from(BUCKET)
        .download(storagePath);

    if (error) throw new Error(`Storage download failed: ${error.message}`);
    const arrayBuf = await data.arrayBuffer();
    return Buffer.from(arrayBuf);
}

// ─── Get public URL ───
export function getFileUrl(storagePath: string): string {
    return getPublicUrl(BUCKET, storagePath);
}

// ─── Hash a buffer ───
export function bufferHash(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
}

// ─── Path helpers ───
export function subjectPath(subjectId: string, filename: string): string {
    return `subjects/${subjectId}/${filename}`;
}

export function setImagePath(setId: string, filename: string): string {
    return `sets/${setId}/images/${filename}`;
}

export function setManifestPath(setId: string): string {
    return `sets/${setId}/manifest.json`;
}

// ─── Create the bucket if it doesn't exist ───
export async function ensureBucket(): Promise<void> {
    const { error } = await getSupabase().storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
    });

    // Ignore "already exists" error
    if (error && !error.message.includes("already exists")) {
        console.warn("[Storage] Bucket creation:", error.message);
    }
}
