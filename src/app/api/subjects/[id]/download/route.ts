import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import archiver from "archiver";
import { downloadFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const subject = await prisma.subject.findUnique({
            where: { id },
            include: {
                slideshowSets: {
                    include: {
                        slides: {
                            where: {
                                status: "succeeded",
                                outputImagePath: { not: null }
                            },
                            include: {
                                preset: true
                            }
                        }
                    }
                }
            }
        });

        if (!subject) {
            return new NextResponse("Subject not found", { status: 404 });
        }

        const archive = archiver('zip', {
            zlib: { level: 0 } // No compression, just store since png/jpg are already compressed
        });

        const stream = new ReadableStream({
            start(controller) {
                archive.on('data', (data) => {
                    controller.enqueue(data);
                });
                archive.on('end', () => {
                    controller.close();
                });
                archive.on('error', (err) => {
                    controller.error(err);
                });
            }
        });

        // Start processing independently
        (async () => {
            try {
                let fileCount = 0;
                for (const set of subject.slideshowSets) {
                    for (const slide of set.slides) {
                        if (!slide.outputImagePath) continue;

                        try {
                            const buffer = await downloadFile(slide.outputImagePath);

                            const cleanName = (slide.preset?.name || "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                            const fname = cleanName ? `${String(slide.orderIndex + 1).padStart(3, "0")}_${cleanName}.png` : `${String(slide.orderIndex + 1).padStart(3, "0")}.png`;

                            // Include set name as a folder to avoid duplicate filenames from different sets
                            const folderName = set.name.replace(/[^a-z0-9]+/gi, '_');
                            archive.append(buffer, { name: `${folderName}/${fname}` });
                            fileCount++;
                        } catch (err) {
                            console.warn(`[Download ZIP] Failed to download image ${slide.outputImagePath}`, err);
                        }
                    }
                }

                if (fileCount === 0) {
                    archive.append('No successful generated images found.', { name: 'error.txt' });
                }
            } catch (err) {
                console.error("[Download ZIP] Error processing slides", err);
                archive.append(String(err), { name: 'error.txt' });
            } finally {
                archive.finalize();
            }
        })();

        const subjectName = subject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${subjectName}_all_images.zip"`,
            }
        });

    } catch (err) {
        console.error("[Download ZIP] Fatal error:", err);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
