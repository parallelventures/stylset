import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadFile, subjectPath, ensureBucket } from "@/lib/storage";
import { v4 as uuid } from "uuid";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
    const subjects = await prisma.subject.findMany({
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(subjects);
}

export async function POST(req: NextRequest) {
    try {
        await ensureBucket();

        const formData = await req.formData();
        const name = formData.get("name") as string;
        const description = (formData.get("description") as string) || null;
        const lockedAttributesJson = (formData.get("lockedAttributesJson") as string) || "{}";

        if (!name) {
            return NextResponse.json({ error: "name is required" }, { status: 400 });
        }

        try {
            JSON.parse(lockedAttributesJson);
        } catch {
            return NextResponse.json({ error: "Invalid lockedAttributesJson" }, { status: 400 });
        }

        const id = uuid();
        const storagePaths: string[] = [];
        const images = formData.getAll("images");

        for (let i = 0; i < images.length; i++) {
            const file = images[i];
            if (file instanceof File && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const ext = path.extname(file.name) || ".png";
                const filename = `ref_${i}${ext}`;
                const storagePath = subjectPath(id, filename);

                await uploadFile(storagePath, buffer,
                    ext === ".png" ? "image/png" :
                        ext === ".webp" ? "image/webp" :
                            "image/jpeg"
                );

                storagePaths.push(storagePath);
            }
        }

        if (storagePaths.length === 0) {
            return NextResponse.json({ error: "At least one reference image is required" }, { status: 400 });
        }

        const subject = await prisma.subject.create({
            data: {
                id,
                name,
                description,
                referenceImagePaths: JSON.stringify(storagePaths),
                lockedAttributesJson,
            },
        });

        return NextResponse.json(subject, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
