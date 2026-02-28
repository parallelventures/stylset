/**
 * Next.js Instrumentation — runs once when the server starts.
 * Starts the in-app cron scheduler for autonomous agent runs.
 */
export async function register() {
    // Only run on server, not during build
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { startScheduler } = await import("@/agent/scheduler");
        startScheduler();
        console.log("[Boot] StyleSet agent scheduler initialized");
    }
}
