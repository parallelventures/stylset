/**
 * Resolve a storage path to a Supabase public URL.
 * Works on both old `data/subjects/...` paths and new `subjects/...` paths.
 */
export function storageUrl(storagePath: string | null | undefined): string {
    if (!storagePath) return "";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

    // Strip "data/" prefix if present (legacy migration)
    const cleanPath = storagePath.replace(/^data\//, "");

    return `${supabaseUrl}/storage/v1/object/public/styleset/${cleanPath}`;
}
