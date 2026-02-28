import JSZip from "jszip";
import { downloadFile, uploadFile } from "./storage";

export async function createAndUploadZip(
    imagesToZip: { filename: string; storagePath: string }[],
    outputZipPath: string
): Promise<string> {
    const zip = new JSZip();

    // Download and add all images to the zip
    await Promise.all(
        imagesToZip.map(async ({ filename, storagePath }) => {
            try {
                const buffer = await downloadFile(storagePath);
                zip.file(filename, buffer);
            } catch (err) {
                console.warn(`[ZIP] Failed to download ${storagePath}:`, err);
            }
        })
    );

    // Generate zip buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "STORE" });

    // Upload to Supabase Storage
    const publicUrl = await uploadFile(outputZipPath, zipBuffer, "application/zip");
    console.log(`[ZIP] Uploaded zip archive: ${outputZipPath}`);

    return publicUrl;
}
