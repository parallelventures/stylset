import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role (can upload to storage)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Public URL helper
export function getPublicUrl(bucket: string, path: string): string {
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export const BUCKET = "styleset";
