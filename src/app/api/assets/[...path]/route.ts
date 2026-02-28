import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Serve static files from ./data/ directory
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: segments } = await params;
    const filePath = path.join(process.cwd(), "data", ...segments);

    try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) {
            return NextResponse.json({ error: "Not a file" }, { status: 404 });
        }

        const ext = path.extname(filePath).toLowerCase();
        const mimeMap: Record<string, string> = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".gif": "image/gif",
            ".json": "application/json",
            ".zip": "application/zip",
        };

        const contentType = mimeMap[ext] || "application/octet-stream";
        const data = await fs.readFile(filePath);

        return new NextResponse(data, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Length": String(data.length),
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
}
