// Agent CLI — run the daily orchestrator directly
// Usage: npx tsx scripts/run-agent.ts
// Optional env: SETS_PER_DAY=5 SLIDES_PER_SET=6

async function main() {
    console.log("[Agent CLI] Starting daily agent run...");

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    const body: Record<string, unknown> = {};
    if (process.env.SUBJECT_ID) body.subjectId = process.env.SUBJECT_ID;
    if (process.env.SETS_PER_DAY) body.setsPerDay = parseInt(process.env.SETS_PER_DAY, 10);
    if (process.env.SLIDES_PER_SET) body.slidesPerSet = parseInt(process.env.SLIDES_PER_SET, 10);

    try {
        const res = await fetch(`${baseUrl}/api/agent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) {
            console.error("[Agent CLI] Error:", data.error);
            process.exit(1);
        }

        console.log("[Agent CLI] Result:", data);
    } catch (error) {
        console.error("[Agent CLI] Failed to reach server:", error);
        process.exit(1);
    }
}

main();
