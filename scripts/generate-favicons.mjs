import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function getSvg(size) {
  // rx border radius ~25% of size
  const rx = Math.round(size * 0.22);
  
  // Icon size ~58% of canvas size
  const iconSize = Math.round(size * 0.60);
  const offset = Math.round((size - iconSize) / 2);
  const scale = iconSize / 24;
  
  // For smaller icons, slightly boost stroke width so lines remain clear
  let strokeWidth = 2.0;
  if (size <= 16) strokeWidth = 2.8;
  else if (size <= 32) strokeWidth = 2.5;
  else if (size <= 48) strokeWidth = 2.2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#0f172a" />
  <g transform="translate(${offset}, ${offset}) scale(${scale})" fill="none" stroke="#FBC02D" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </g>
</svg>`;
}

function renderPng(size, outPath) {
  const svgContent = getSvg(size);
  const tempHtml = path.resolve(`./temp_${size}.html`);
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
  svg { display: block; width: ${size}px; height: ${size}px; }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;
  fs.writeFileSync(tempHtml, html, "utf8");

  const cmd = `"${CHROME_PATH}" --headless=new --disable-gpu --force-device-scale-factor=1 --screenshot="${outPath}" --window-size=${size},${size} --default-background-color=00000000 "file:///${tempHtml.replace(/\\/g, "/")}"`;
  execSync(cmd, { stdio: "pipe" });

  try {
    fs.unlinkSync(tempHtml);
  } catch (e) {}
}

// Build standard ICO from PNG buffers (16, 32, 48)
function createIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  // Header: 6 bytes
  // Directory entries: 16 bytes each
  let offset = 6 + 16 * count;
  
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const dirEntries = [];
  for (let i = 0; i < count; i++) {
    const buf = pngBuffers[i];
    const size = sizes[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // Width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buf.length, 8); // Image data size
    entry.writeUInt32LE(offset, 12); // Image data offset
    dirEntries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

async function run() {
  const targets = [
    { size: 512, name: "android-chrome-512x512.png" },
    { size: 192, name: "android-chrome-192x192.png" },
    { size: 180, name: "apple-touch-icon.png" },
    { size: 48, name: "favicon-48x48.png" },
    { size: 32, name: "favicon-32x32.png" },
    { size: 16, name: "favicon-16x16.png" },
  ];

  const publicDir = path.resolve("./public");
  const faviconDir = path.resolve("./favicon");

  if (!fs.existsSync(faviconDir)) {
    fs.mkdirSync(faviconDir, { recursive: true });
  }

  console.log("Generating icon sizes...");
  const pngBuffers = {};

  for (const t of targets) {
    const pubFile = path.join(publicDir, t.name);
    const favFile = path.join(faviconDir, t.name);
    renderPng(t.size, pubFile);
    fs.copyFileSync(pubFile, favFile);
    pngBuffers[t.size] = fs.readFileSync(pubFile);
    console.log(`Generated ${t.name} (${t.size}x${t.size}) - ${pngBuffers[t.size].length} bytes`);
  }

  // Create favicon.ico with 16, 32, 48
  console.log("Creating multi-resolution favicon.ico...");
  const icoSizes = [16, 32, 48];
  const icoBuf = createIco([pngBuffers[16], pngBuffers[32], pngBuffers[48]], icoSizes);

  fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuf);
  fs.writeFileSync(path.join(faviconDir, "favicon.ico"), icoBuf);
  console.log(`Created favicon.ico (${icoBuf.length} bytes) with sizes 16, 32, 48`);
}

run().catch(console.error);
