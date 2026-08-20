import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { buildLedgerAppIconSvg } from "../src/lib/brand/ledger-app-icon-svg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const appDir = path.join(rootDir, "src", "app");
const publicIconDir = path.join(rootDir, "public", "icons");

const sizes = [
  { appFileName: "icon.png", publicFileName: "icon.png", size: 32 },
  { appFileName: "apple-icon.png", publicFileName: "apple-icon.png", size: 180 },
  { publicFileName: "icon-192.png", size: 192 },
  { publicFileName: "icon-512.png", size: 512 },
];

async function main() {
  await mkdir(publicIconDir, { recursive: true });

  for (const { appFileName, publicFileName, size } of sizes) {
    const svg = Buffer.from(buildLedgerAppIconSvg(size));
    const png = await sharp(svg).png().toBuffer();

    if (appFileName) {
      await writeFile(path.join(appDir, appFileName), png);
    }

    await writeFile(path.join(publicIconDir, publicFileName), png);
    console.log(`Generated ${publicFileName} (${size}x${size})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
