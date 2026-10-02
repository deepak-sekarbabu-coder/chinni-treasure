/**
 * Generates Android launcher icons from public/icons/icon-512x512.png.
 *
 * The brand asset is a black mermaid on transparency, which is invisible on the
 * app's dark surface, so every icon here gets the cream background behind it.
 *
 *   node mobile/generate-icons.mjs
 *
 * Uses sharp, already present in the root node_modules (transitive dep of
 * next/image's toolchain). Delete this script if the icon ever stops changing.
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "public", "icons", "icon-512x512.png");
const RES = join(ROOT, "mobile", "app", "src", "main", "res");

/** Brand tokens, mirrored from app/styles/variables.css. */
const CREAM = "#faf7f2"; // --cream-light
const GOLD = "#d4af37"; // --gold

/** Legacy launcher icon: the whole canvas is the visible icon. */
const LEGACY = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
/** Adaptive layer: art must survive a 72/108 safe-zone crop. */
const ADAPTIVE = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

const mermaid = (size, inset) =>
  sharp(SRC)
    .resize(Math.round(size * (1 - inset * 2)), Math.round(size * (1 - inset * 2)), {
      fit: "inside",
    })
    .toBuffer();

for (const [density, size] of Object.entries(LEGACY)) {
  const dir = join(RES, `mipmap-${density}`);
  await mkdir(dir, { recursive: true });
  const art = await mermaid(size, 0.08);

  // Flatten to opaque first: masking an image that still has an alpha channel
  // wipes the art along with the corners.
  const square = await sharp({
    create: { width: size, height: size, channels: 4, background: CREAM },
  })
    .composite([{ input: art, gravity: "center" }])
    .removeAlpha()
    .png()
    .toBuffer();

  await sharp(square).toFile(join(dir, "ic_launcher.png"));

  // Pre-26 launchers get no adaptive mask, so ship a circle too.
  const circle = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${
      size / 2 - 0.5
    }"/></svg>`,
  );
  await sharp(square)
    .ensureAlpha()
    .composite([{ input: circle, blend: "dest-in" }])
    .png()
    .toFile(join(dir, "ic_launcher_round.png"));
}

for (const [density, size] of Object.entries(ADAPTIVE)) {
  const dir = join(RES, `mipmap-${density}`);
  await mkdir(dir, { recursive: true });
  // The layer must stay a full 108dp canvas: the launcher crops the outer
  // 18dp, so the art is centred at 66% and the rest is transparent bleed.
  await sharp({
    create: { width: size, height: size, channels: 4, background: { ...0, r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: await mermaid(size, 0.17), gravity: "center" }])
    .png()
    .toFile(join(dir, "ic_launcher_foreground.png"));
}

await mkdir(join(RES, "drawable"), { recursive: true });
await writeFile(
  join(RES, "drawable", "ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<!-- Brand token --cream-light. Change here and in ic_launcher_monochrome.xml. -->
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="${CREAM}" />
</shape>
`,
);

// Themed-icon mask (Android 13+). Solid gold reads as the brand mark at 48dp.
await writeFile(
  join(RES, "drawable", "ic_launcher_monochrome.xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<!-- Themed icons are a single-colour mask; gold is the brand token. -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="${GOLD}"
        android:pathData="M54,96c-22,-18 -36,-33 -36,-46c0,-10 7,-17 17,-17c6,0 11,3 14,8c3,-5 8,-8 14,-8c10,0 17,7 17,17c0,13 -14,28 -36,46z" />
</vector>
`,
);

console.log("icons written to", RES);