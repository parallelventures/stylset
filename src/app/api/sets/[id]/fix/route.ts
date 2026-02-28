import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSet } from "@/services/generator";

/**
 * POST /api/sets/:id/fix
 * Fix a stuck set: mark stuck slides as failed, recalculate set status,
 * and optionally re-trigger generation for queued/failed slides.
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const set = await prisma.slideshowSet.findUnique({
            where: { id },
            include: { slides: true },
        });

        if (!set) {
            return NextResponse.json({ error: "Set not found" }, { status: 404 });
        }

        // 1. Mark any "running" slides as "failed" (they're stuck)
        const stuckSlides = await prisma.slideGeneration.updateMany({
            where: { slideshowSetId: id, status: "running" },
            data: { status: "failed", error: "Stuck — marked as failed by fix endpoint" },
        });

        // 2. Count slide statuses
        const slides = await prisma.slideGeneration.findMany({
            where: { slideshowSetId: id },
        });

        const succeeded = slides.filter(s => s.status === "succeeded").length;
        const failed = slides.filter(s => s.status === "failed").length;
        const queued = slides.filter(s => s.status === "queued").length;
        const total = slides.length;

        // 3. Determine correct set status
        let newStatus: string;
        if (queued > 0) {
            newStatus = "idle"; // has work to do
        } else if (failed > 0 && succeeded === 0) {
            newStatus = "failed";
        } else if (failed > 0) {
            newStatus = "ready"; // partial success, but done
        } else {
            newStatus = "ready";
        }

        await prisma.slideshowSet.update({
            where: { id },
            data: { status: newStatus },
        });

        // 4. If there are queued slides, re-trigger generation
        let retriggered = false;
        if (queued > 0) {
            generateSet(id).catch(err => {
                console.error(`[Fix] Re-generation failed for set ${id}:`, err);
            });
            retriggered = true;
        }

        return NextResponse.json({
            ok: true,
            stuckFixed: stuckSlides.count,
            status: newStatus,
            slides: { total, succeeded, failed, queued },
            retriggered,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
