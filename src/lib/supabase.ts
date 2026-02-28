import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

// Lazy init — only creates client when first called (not at build time)
export function getSupabase(): SupabaseClient {
    if (!_client) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
            throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        }
        _client = createClient(url, key);
    }
    return _client;
}

export function getPublicUrl(bucket: string, path: string): string {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return `${url}/storage/v1/object/public/${bucket}/${path}`;
}

export const BUCKET = "styleset";
