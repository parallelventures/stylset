import { z } from "zod";

// ─── Safety: blocked terms ───
const BLOCKED_IDENTITY_TERMS = [
    "make her look like",
    "make him look like",
    "change face",
    "different person",
    "change identity",
    "change skin",
    "change body",
    "change age",
    "younger",
    "older",
    "change ethnicity",
    "change race",
    "nude",
    "naked",
    "sexual",
    "explicit",
    "nsfw",
    "child",
    "minor",
    "underage",
    "kid",
];

function safetyCheck(text: string): { safe: boolean; reason?: string } {
    const lower = text.toLowerCase();
    for (const term of BLOCKED_IDENTITY_TERMS) {
        if (lower.includes(term)) {
            return { safe: false, reason: `Blocked term detected: "${term}". Only hairstyle changes are allowed.` };
        }
    }
    return { safe: true };
}

export function validatePromptSafety(prompt: string, negativePrompt?: string): void {
    const check = safetyCheck(prompt);
    if (!check.safe) throw new Error(check.reason);
    if (negativePrompt) {
        const negCheck = safetyCheck(negativePrompt);
        if (!negCheck.safe) throw new Error(negCheck.reason);
    }
}

// ─── Zod schemas ───

export const SubjectCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    lockedAttributesJson: z.string().optional().default("{}"),
});

export const SubjectUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    // Cannot update referenceImagePaths or lockedAttributesJson after creation
});

export const PresetCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    hairstylePrompt: z.string().min(1, "Hairstyle prompt is required"),
    negativeHairPrompt: z.string().nullable().optional(),
    tags: z.string().nullable().optional(), // JSON array string
});

export const PresetUpdateSchema = PresetCreateSchema.partial();

export const TemplateCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    basePromptJson: z.string().min(1, "Base prompt JSON is required"),
});

export const TemplateUpdateSchema = TemplateCreateSchema.partial();

export const SlideInputSchema = z.object({
    orderIndex: z.number().int().min(0),
    presetId: z.string().optional(),
    hairstylePrompt: z.string().optional(),
    negativeHairPrompt: z.string().optional(),
});

export const SetCreateSchema = z.object({
    subjectId: z.string().min(1, "Subject ID is required"),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    templateId: z.string().optional(),
    slides: z.array(SlideInputSchema).min(1, "At least one slide is required"),
});

export const CronJobCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    schedule: z.string().min(1, "Schedule is required"),
    enabled: z.boolean().default(true),
    actionType: z.string().default("GENERATE_SET"),
    configJson: z.string().min(1, "Config JSON is required"),
});

export const CronJobUpdateSchema = CronJobCreateSchema.partial();
