import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSupabase, BUCKET } from "@/lib/supabase";

/**
 * POST /api/reset
 *
 * Clears generated data to start fresh.
 * Supports selective clearing via body:
 *   { sets: true, runs: true, storage: true }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({
            sets: true,
            runs: true,
            storage: true,
        }));

        const clearSets = body.sets !== false;
        const clearRuns = body.runs !== false;
        const clearStorage = body.storage !== false;

        const result: Record<string, number | string> = {};

        if (clearSets) {
            // Delete all slide generations first (FK constraint)
            const slides = await prisma.slideGeneration.deleteMany({});
            result.slidesDeleted = slides.count;

            // Delete all slideshow sets
            const sets = await prisma.slideshowSet.deleteMany({});
            result.setsDeleted = sets.count;
        }

        if (clearRuns) {
            // Delete all agent runs
            const runs = await prisma.agentRun.deleteMany({});
            result.runsDeleted = runs.count;
        }

        if (clearStorage) {
            // Clean up Supabase storage — remove all files in sets/
            try {
                const supabase = getSupabase();

                // List all files in sets/ folder
                const { data: folders } = await supabase.storage
                    .from(BUCKET)
                    .list("sets", { limit: 1000 });

                if (folders && folders.length > 0) {
                    // For each set folder, list and delete files
                    let filesDeleted = 0;
                    for (const folder of folders) {
                        // List files in the set folder (images, manifest, zip)
                        const { data: subItems } = await supabase.storage
                            .from(BUCKET)
                            .list(`sets/${folder.name}`, { limit: 100 });

                        if (subItems && subItems.length > 0) {
                            // Delete direct files
                            const directFiles = subItems
                                .filter((f) => f.id) // actual files have an id
                                .map((f) => `sets/${folder.name}/${f.name}`);

                            if (directFiles.length > 0) {
                                await supabase.storage.from(BUCKET).remove(directFiles);
                                filesDeleted += directFiles.length;
                            }

                            // Check for images/ subfolder
                            const hasImagesDir = subItems.some((f) => f.name === "images");
                            if (hasImagesDir) {
                                const { data: imageFiles } = await supabase.storage
                                    .from(BUCKET)
                                    .list(`sets/${folder.name}/images`, { limit: 100 });

                                if (imageFiles && imageFiles.length > 0) {
                                    const imagePaths = imageFiles
                                        .filter((f) => f.id)
                                        .map((f) => `sets/${folder.name}/images/${f.name}`);

                                    if (imagePaths.length > 0) {
                                        await supabase.storage.from(BUCKET).remove(imagePaths);
                                        filesDeleted += imagePaths.length;
                                    }
                                }
                            }
                        }
                    }
                    result.storageFilesDeleted = filesDeleted;
                } else {
                    result.storageFilesDeleted = 0;
                }
            } catch (storageErr) {
                const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
                result.storageError = msg;
                console.warn("[Reset] Storage cleanup failed:", msg);
            }
        }

        return NextResponse.json({
            ok: true,
            message: "Reset complete",
            ...result,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
