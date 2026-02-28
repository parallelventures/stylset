/**
 * Seed: 1 template + 30 hairstyle presets + default cron job
 * Run: npx tsx scripts/seed.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...\n");

    // ─── Template ───
    const template = await prisma.slideRequestTemplate.upsert({
        where: { id: "default-template" },
        update: {},
        create: {
            id: "default-template",
            name: "Standard Lookbook",
            basePromptJson: JSON.stringify({
                prompt: "Professional portrait photography, high quality, photorealistic, sharp focus, natural skin texture, magazine lookbook style",
                negative_prompt: "blurry, distorted, low quality, cartoon, drawing, painting, illustration, anime, 3d render, deformed, disfigured, watermark",
                style: "photorealistic",
                aspect_ratio: "3:4",
                lighting: "soft diffused studio lighting, beauty lighting, 3-point lighting",
                background: "clean neutral studio background, seamless white",
            }),
        },
    });
    console.log(`✅ Template: ${template.name}`);

    // ─── 30 Hairstyle Presets ───
    const presets = [
        // Classic
        { name: "Sleek Low Bun", hairstylePrompt: "Sleek low bun, hair pulled back smoothly into a tight low bun at the nape, polished and sophisticated, no flyaways", negativeHairPrompt: "messy hair, loose strands, high bun", tags: '["updo","formal","sleek"]' },
        { name: "High Ponytail", hairstylePrompt: "High ponytail at the crown, smooth and bouncy, sleek pull-back, long flowing tail", negativeHairPrompt: "low ponytail, messy, braids", tags: '["ponytail","sporty"]' },
        { name: "Classic Bob", hairstylePrompt: "Classic chin-length bob, straight and sleek, blunt cut at chin level, one-length with slight inward curve", negativeHairPrompt: "long hair, curly, asymmetrical", tags: '["bob","short","classic"]' },
        { name: "French Bob", hairstylePrompt: "French bob with wispy micro bangs, jaw-length, slightly tousled texture, effortlessly chic Parisian style", negativeHairPrompt: "long hair, heavy bangs, straight", tags: '["bob","french","chic"]' },
        { name: "Blunt Lob", hairstylePrompt: "Blunt lob (long bob) just above the shoulders, perfectly straight ends, sleek and modern, center-parted", negativeHairPrompt: "layers, curly, short pixie", tags: '["lob","modern","sleek"]' },

        // Short
        { name: "Pixie Cut", hairstylePrompt: "Modern pixie cut, short cropped sides and back, slightly longer textured layers on top, edgy and chic", negativeHairPrompt: "long hair, bob, extensions", tags: '["pixie","short","edgy"]' },
        { name: "Soft Angled Bob", hairstylePrompt: "Soft angled bob, slightly longer in the front than the back, elegant sweep, chin-length, perfectly straight and smooth", negativeHairPrompt: "blunt cut, long hair, curly", tags: '["bob","angled","elegant"]' },
        { name: "Long Face-Framing Layers", hairstylePrompt: "Long flowing hair with soft face-framing layers starting below the chin, voluminous blowout texture, middle part", negativeHairPrompt: "short hair, blunt cut, tight curls", tags: '["long","layers","volume"]' },
        { name: "Asymmetric Pixie", hairstylePrompt: "Asymmetric pixie with one side longer, swept across the forehead, edgy and fashion-forward", negativeHairPrompt: "symmetrical, long, curly", tags: '["pixie","asymmetric","avant-garde"]' },
        { name: "Voluminous Vintage Curls", hairstylePrompt: "Huge voluminous 70s disco curls, brushed out fluffy texture, extreme root volume, glamorous and big", negativeHairPrompt: "flat, straight, sleek, wet look", tags: '["curls","vintage","big"]' },

        // Waves & Curls
        { name: "Beach Waves", hairstylePrompt: "Loose beach waves, natural soft waves throughout, relaxed and effortless, shoulder-length, middle part", negativeHairPrompt: "tight curls, straight, updos", tags: '["waves","casual","natural"]' },
        { name: "Hollywood Waves", hairstylePrompt: "Glamorous old Hollywood finger waves, deep side part, smooth S-shaped waves cascading down one side", negativeHairPrompt: "messy, casual, straight", tags: '["waves","glamorous","vintage"]' },
        { name: "Tight Ringlet Curls", hairstylePrompt: "Tight springy ringlet curls, voluminous, well-defined corkscrew curls all over, natural texture", negativeHairPrompt: "straight, relaxed, flat", tags: '["curls","natural","voluminous"]' },
        { name: "Loose Romantic Curls", hairstylePrompt: "Large loose romantic curls, soft and bouncy, barrel-curled, flowing past shoulders with subtle volume at roots", negativeHairPrompt: "tight curls, straight, pixie", tags: '["curls","romantic","soft"]' },
        { name: "Crimped Texture", hairstylePrompt: "All-over crimped hair texture, zig-zag pattern, voluminous 90s-inspired crimp, medium to long length", negativeHairPrompt: "smooth, straight, curls", tags: '["crimp","retro","texture"]' },

        // Updos & Braids
        { name: "Braided Crown", hairstylePrompt: "Braided crown wrapping around the head like a halo, elegantly pinned, romantic and ethereal", negativeHairPrompt: "loose hair, straight, ponytail", tags: '["braids","updo","elegant"]' },
        { name: "Double Dutch Braids", hairstylePrompt: "Two symmetrical Dutch braids running from front to back, tight and neat, sporty clean look", negativeHairPrompt: "loose hair, waves, bun", tags: '["braids","sporty","neat"]' },
        { name: "High Messy Bun", hairstylePrompt: "High messy bun on top of the head, loose and effortless with face-framing tendrils, relaxed chic", negativeHairPrompt: "sleek, polished, ponytail", tags: '["bun","messy","casual"]' },
        { name: "Space Buns", hairstylePrompt: "Two high space buns symmetrically placed on top of the head, neat and round, playful and youthful", negativeHairPrompt: "single bun, ponytail, loose hair", tags: '["buns","playful","trendy"]' },
        { name: "Low Twisted Chignon", hairstylePrompt: "Elegant low twisted chignon at the nape, soft twisted sections gathered into a refined bun, timeless and formal", negativeHairPrompt: "loose hair, ponytail, high bun", tags: '["chignon","formal","elegant"]' },

        // Bangs & Fringe
        { name: "Curtain Bangs", hairstylePrompt: "Curtain bangs with soft layers, face-framing bangs parted in the center, flowing into layered lengths, bouncy volume", negativeHairPrompt: "blunt bangs, no bangs, pixie", tags: '["bangs","layers","trendy"]' },
        { name: "Blunt Bangs Straight", hairstylePrompt: "Thick blunt-cut straight-across bangs, heavy fringe hitting just above eyebrows, with long straight hair below", negativeHairPrompt: "no bangs, wispy, side-swept", tags: '["bangs","blunt","bold"]' },
        { name: "Side-Swept Bangs", hairstylePrompt: "Long side-swept bangs sweeping gracefully across the forehead to one side, blended into shoulder-length layers", negativeHairPrompt: "center part, blunt bangs, no bangs", tags: '["bangs","side-swept","classic"]' },
        { name: "Birkin Bangs", hairstylePrompt: "Jane Birkin-inspired wispy thin bangs, barely-there fringe with long slightly wavy hair, French effortless cool", negativeHairPrompt: "thick bangs, blunt cut, heavy fringe", tags: '["bangs","french","wispy"]' },

        // Statement
        { name: "Slicked Back Wet Look", hairstylePrompt: "Slicked back hair combed backwards, smooth and shiny wet-look gel finish, sophisticated editorial style", negativeHairPrompt: "messy, curly, bangs, loose", tags: '["slicked","editorial","wet-look"]' },
        { name: "Voluminous Blowout", hairstylePrompt: "Voluminous blowout, big bouncy round hair with lots of body, salon-fresh with soft curled ends, luxurious", negativeHairPrompt: "flat, straight, no volume", tags: '["blowout","volume","glamorous"]' },
        { name: "Half-Up Half-Down", hairstylePrompt: "Half-up half-down style, top half pulled back and secured with the bottom half flowing freely, balanced and versatile", negativeHairPrompt: "all up, all down, bun", tags: '["half-up","versatile","classic"]' },
        { name: "Top Knot", hairstylePrompt: "Tight high top knot, all hair gathered into a firm neat knot on the very top of the head, clean and modern", negativeHairPrompt: "low bun, ponytail, loose hair", tags: '["bun","topknot","clean"]' },
        { name: "Long Center Part Straight", hairstylePrompt: "Very long pin-straight hair with a precise center part, sleek and polished, hair falling past chest, ultra smooth", negativeHairPrompt: "wavy, curly, short, bangs", tags: '["long","straight","sleek"]' },
        { name: "Braided Crown Updo", hairstylePrompt: "Elaborate thick braided crown updo, wrapped elegantly around the head, soft romantic tendrils framing the face", negativeHairPrompt: "down, straight, slicked back", tags: '["braids","updo","romantic"]' },
    ];

    await prisma.hairstylePreset.deleteMany();
    for (const p of presets) {
        await prisma.hairstylePreset.create({ data: p });
    }
    console.log(`✅ ${presets.length} hairstyle presets created`);

    // ─── Default Cron Job ───
    const existingCron = await prisma.cronJob.findFirst({
        where: { actionType: "GENERATE_DAILY_SETS" },
    });

    if (!existingCron) {
        await prisma.cronJob.create({
            data: {
                name: "Daily Agent Run",
                schedule: "0 9 * * *",
                enabled: true,
                actionType: "GENERATE_DAILY_SETS",
                configJson: JSON.stringify({
                    setsPerDay: 5,
                    slidesPerSet: 6,
                    note: "subjectId auto-resolves to first subject. Override here if needed.",
                }),
            },
        });
        console.log(`✅ Default cron job: daily at 09:00`);
    }

    console.log(`\n🎉 Seeded: 1 template + ${presets.length} presets + cron job`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
