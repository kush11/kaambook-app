/**
 * Generate KaamBook app icons using sharp.
 * Run: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets', 'images');

// Design: green background, white open book with a checkmark
// Clean, modern, recognizable at small sizes

function createMainIconSvg(size) {
  const s = size;
  const r = Math.round(s * 0.215); // corner radius ~220/1024
  return `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22C55E"/>
      <stop offset="100%" stop-color="#15803D"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${s}" height="${s}" rx="${r}" fill="url(#bg)"/>

  <!-- Book body (open book shape) -->
  <!-- Left page -->
  <path d="M${s*0.18} ${s*0.22}
           Q${s*0.18} ${s*0.19} ${s*0.21} ${s*0.19}
           L${s*0.47} ${s*0.19}
           L${s*0.47} ${s*0.76}
           L${s*0.21} ${s*0.76}
           Q${s*0.18} ${s*0.76} ${s*0.18} ${s*0.73}
           Z" fill="white" opacity="0.95"/>
  <!-- Right page -->
  <path d="M${s*0.53} ${s*0.19}
           L${s*0.79} ${s*0.19}
           Q${s*0.82} ${s*0.19} ${s*0.82} ${s*0.22}
           L${s*0.82} ${s*0.73}
           Q${s*0.82} ${s*0.76} ${s*0.79} ${s*0.76}
           L${s*0.53} ${s*0.76}
           Z" fill="white" opacity="0.90"/>
  <!-- Book spine shadow -->
  <rect x="${s*0.47}" y="${s*0.19}" width="${s*0.06}" height="${s*0.57}" fill="white" opacity="0.80"/>
  <line x1="${s*0.50}" y1="${s*0.19}" x2="${s*0.50}" y2="${s*0.76}" stroke="#15803D" stroke-width="${s*0.005}" opacity="0.3"/>

  <!-- Lines on left page -->
  <line x1="${s*0.24}" y1="${s*0.32}" x2="${s*0.43}" y2="${s*0.32}" stroke="#D1D5DB" stroke-width="${s*0.008}" stroke-linecap="round"/>
  <line x1="${s*0.24}" y1="${s*0.40}" x2="${s*0.43}" y2="${s*0.40}" stroke="#D1D5DB" stroke-width="${s*0.008}" stroke-linecap="round"/>
  <line x1="${s*0.24}" y1="${s*0.48}" x2="${s*0.43}" y2="${s*0.48}" stroke="#D1D5DB" stroke-width="${s*0.008}" stroke-linecap="round"/>
  <line x1="${s*0.24}" y1="${s*0.56}" x2="${s*0.43}" y2="${s*0.56}" stroke="#D1D5DB" stroke-width="${s*0.008}" stroke-linecap="round"/>
  <line x1="${s*0.24}" y1="${s*0.64}" x2="${s*0.43}" y2="${s*0.64}" stroke="#D1D5DB" stroke-width="${s*0.008}" stroke-linecap="round"/>

  <!-- Lines on right page -->
  <line x1="${s*0.57}" y1="${s*0.32}" x2="${s*0.76}" y2="${s*0.32}" stroke="#D1D5DB" stroke-width="${s*0.008}" stroke-linecap="round"/>
  <line x1="${s*0.57}" y1="${s*0.40}" x2="${s*0.76}" y2="${s*0.40}" stroke="#D1D5DB" stroke-width="${s*0.008}" stroke-linecap="round"/>
  <line x1="${s*0.57}" y1="${s*0.48}" x2="${s*0.76}" y2="${s*0.48}" stroke="#D1D5DB" stroke-width="${s*0.008}" stroke-linecap="round"/>
  <line x1="${s*0.57}" y1="${s*0.56}" x2="${s*0.76}" y2="${s*0.56}" stroke="#D1D5DB" stroke-width="${s*0.008}" stroke-linecap="round"/>
  <line x1="${s*0.57}" y1="${s*0.64}" x2="${s*0.76}" y2="${s*0.64}" stroke="#D1D5DB" stroke-width="${s*0.008}" stroke-linecap="round"/>

  <!-- Checkmark circle (bottom right overlay) -->
  <circle cx="${s*0.74}" cy="${s*0.72}" r="${s*0.14}" fill="#16A34A" stroke="white" stroke-width="${s*0.02}"/>
  <!-- Checkmark -->
  <polyline points="${s*0.65},${s*0.72} ${s*0.72},${s*0.79} ${s*0.83},${s*0.64}"
            stroke="white" stroke-width="${s*0.032}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
}

function createSplashIconSvg(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Book icon only (no background, for splash screen) -->
  <path d="M${size*0.08} ${size*0.05}
           Q${size*0.08} ${size*0.02} ${size*0.12} ${size*0.02}
           L${size*0.46} ${size*0.02}
           L${size*0.46} ${size*0.88}
           L${size*0.12} ${size*0.88}
           Q${size*0.08} ${size*0.88} ${size*0.08} ${size*0.85}
           Z" fill="#16A34A"/>
  <path d="M${size*0.54} ${size*0.02}
           L${size*0.88} ${size*0.02}
           Q${size*0.92} ${size*0.02} ${size*0.92} ${size*0.05}
           L${size*0.92} ${size*0.85}
           Q${size*0.92} ${size*0.88} ${size*0.88} ${size*0.88}
           L${size*0.54} ${size*0.88}
           Z" fill="#15803D"/>
  <rect x="${size*0.46}" y="${size*0.02}" width="${size*0.08}" height="${size*0.86}" fill="#1A8F42"/>

  <!-- Lines on left -->
  <line x1="${size*0.16}" y1="${size*0.18}" x2="${size*0.40}" y2="${size*0.18}" stroke="white" stroke-width="${size*0.02}" stroke-linecap="round" opacity="0.6"/>
  <line x1="${size*0.16}" y1="${size*0.32}" x2="${size*0.40}" y2="${size*0.32}" stroke="white" stroke-width="${size*0.02}" stroke-linecap="round" opacity="0.6"/>
  <line x1="${size*0.16}" y1="${size*0.46}" x2="${size*0.40}" y2="${size*0.46}" stroke="white" stroke-width="${size*0.02}" stroke-linecap="round" opacity="0.6"/>
  <line x1="${size*0.16}" y1="${size*0.60}" x2="${size*0.40}" y2="${size*0.60}" stroke="white" stroke-width="${size*0.02}" stroke-linecap="round" opacity="0.6"/>
  <line x1="${size*0.16}" y1="${size*0.74}" x2="${size*0.40}" y2="${size*0.74}" stroke="white" stroke-width="${size*0.02}" stroke-linecap="round" opacity="0.6"/>

  <!-- Lines on right -->
  <line x1="${size*0.60}" y1="${size*0.18}" x2="${size*0.84}" y2="${size*0.18}" stroke="white" stroke-width="${size*0.02}" stroke-linecap="round" opacity="0.5"/>
  <line x1="${size*0.60}" y1="${size*0.32}" x2="${size*0.84}" y2="${size*0.32}" stroke="white" stroke-width="${size*0.02}" stroke-linecap="round" opacity="0.5"/>
  <line x1="${size*0.60}" y1="${size*0.46}" x2="${size*0.84}" y2="${size*0.46}" stroke="white" stroke-width="${size*0.02}" stroke-linecap="round" opacity="0.5"/>
  <line x1="${size*0.60}" y1="${size*0.60}" x2="${size*0.84}" y2="${size*0.60}" stroke="white" stroke-width="${size*0.02}" stroke-linecap="round" opacity="0.5"/>
  <line x1="${size*0.60}" y1="${size*0.74}" x2="${size*0.84}" y2="${size*0.74}" stroke="white" stroke-width="${size*0.02}" stroke-linecap="round" opacity="0.5"/>

  <!-- Checkmark -->
  <circle cx="${size*0.78}" cy="${size*0.78}" r="${size*0.18}" fill="#22C55E" stroke="#FAFAF5" stroke-width="${size*0.025}"/>
  <polyline points="${size*0.68},${size*0.78} ${size*0.76},${size*0.86} ${size*0.90},${size*0.67}"
            stroke="white" stroke-width="${size*0.04}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
}

function createAdaptiveForegroundSvg(size) {
  // Adaptive icons need padding - the icon should be within the inner 66% (safe zone)
  // Size is 108dp, safe zone is 72dp centered
  const offset = size * 0.17; // padding around the icon
  const inner = size * 0.66;
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Book icon centered for adaptive icon -->
  <g transform="translate(${offset}, ${offset})">
    <!-- Left page -->
    <path d="M${inner*0.08} ${inner*0.05}
             Q${inner*0.08} ${inner*0.02} ${inner*0.12} ${inner*0.02}
             L${inner*0.46} ${inner*0.02}
             L${inner*0.46} ${inner*0.88}
             L${inner*0.12} ${inner*0.88}
             Q${inner*0.08} ${inner*0.88} ${inner*0.08} ${inner*0.85}
             Z" fill="white"/>
    <!-- Right page -->
    <path d="M${inner*0.54} ${inner*0.02}
             L${inner*0.88} ${inner*0.02}
             Q${inner*0.92} ${inner*0.02} ${inner*0.92} ${inner*0.05}
             L${inner*0.92} ${inner*0.85}
             Q${inner*0.92} ${inner*0.88} ${inner*0.88} ${inner*0.88}
             L${inner*0.54} ${inner*0.88}
             Z" fill="rgba(255,255,255,0.9)"/>
    <!-- Spine -->
    <rect x="${inner*0.46}" y="${inner*0.02}" width="${inner*0.08}" height="${inner*0.86}" fill="rgba(255,255,255,0.85)"/>

    <!-- Lines left -->
    <line x1="${inner*0.16}" y1="${inner*0.20}" x2="${inner*0.40}" y2="${inner*0.20}" stroke="#D1D5DB" stroke-width="${inner*0.015}" stroke-linecap="round"/>
    <line x1="${inner*0.16}" y1="${inner*0.35}" x2="${inner*0.40}" y2="${inner*0.35}" stroke="#D1D5DB" stroke-width="${inner*0.015}" stroke-linecap="round"/>
    <line x1="${inner*0.16}" y1="${inner*0.50}" x2="${inner*0.40}" y2="${inner*0.50}" stroke="#D1D5DB" stroke-width="${inner*0.015}" stroke-linecap="round"/>
    <line x1="${inner*0.16}" y1="${inner*0.65}" x2="${inner*0.40}" y2="${inner*0.65}" stroke="#D1D5DB" stroke-width="${inner*0.015}" stroke-linecap="round"/>

    <!-- Lines right -->
    <line x1="${inner*0.60}" y1="${inner*0.20}" x2="${inner*0.84}" y2="${inner*0.20}" stroke="#D1D5DB" stroke-width="${inner*0.015}" stroke-linecap="round"/>
    <line x1="${inner*0.60}" y1="${inner*0.35}" x2="${inner*0.84}" y2="${inner*0.35}" stroke="#D1D5DB" stroke-width="${inner*0.015}" stroke-linecap="round"/>
    <line x1="${inner*0.60}" y1="${inner*0.50}" x2="${inner*0.84}" y2="${inner*0.50}" stroke="#D1D5DB" stroke-width="${inner*0.015}" stroke-linecap="round"/>
    <line x1="${inner*0.60}" y1="${inner*0.65}" x2="${inner*0.84}" y2="${inner*0.65}" stroke="#D1D5DB" stroke-width="${inner*0.015}" stroke-linecap="round"/>

    <!-- Checkmark circle -->
    <circle cx="${inner*0.78}" cy="${inner*0.76}" r="${inner*0.16}" fill="#16A34A" stroke="white" stroke-width="${inner*0.03}"/>
    <polyline points="${inner*0.68},${inner*0.76} ${inner*0.76},${inner*0.84} ${inner*0.89},${inner*0.65}"
              stroke="white" stroke-width="${inner*0.04}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;
}

function createAdaptiveBackgroundSvg(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="abg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22C55E"/>
      <stop offset="100%" stop-color="#15803D"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#abg)"/>
</svg>`;
}

function createMonochromeSvg(size) {
  const offset = size * 0.17;
  const inner = size * 0.66;
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${offset}, ${offset})">
    <path d="M${inner*0.08} ${inner*0.05}
             Q${inner*0.08} ${inner*0.02} ${inner*0.12} ${inner*0.02}
             L${inner*0.46} ${inner*0.02}
             L${inner*0.46} ${inner*0.88}
             L${inner*0.12} ${inner*0.88}
             Q${inner*0.08} ${inner*0.88} ${inner*0.08} ${inner*0.85}
             Z" fill="black"/>
    <path d="M${inner*0.54} ${inner*0.02}
             L${inner*0.88} ${inner*0.02}
             Q${inner*0.92} ${inner*0.02} ${inner*0.92} ${inner*0.05}
             L${inner*0.92} ${inner*0.85}
             Q${inner*0.92} ${inner*0.88} ${inner*0.88} ${inner*0.88}
             L${inner*0.54} ${inner*0.88}
             Z" fill="black"/>
    <rect x="${inner*0.46}" y="${inner*0.02}" width="${inner*0.08}" height="${inner*0.86}" fill="black"/>
    <circle cx="${inner*0.78}" cy="${inner*0.76}" r="${inner*0.16}" fill="black"/>
    <polyline points="${inner*0.68},${inner*0.76} ${inner*0.76},${inner*0.84} ${inner*0.89},${inner*0.65}"
              stroke="white" stroke-width="${inner*0.04}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;
}

async function generate() {
  console.log('Generating KaamBook app icons...\n');

  // Main icon (1024x1024)
  await sharp(Buffer.from(createMainIconSvg(1024)))
    .png()
    .toFile(path.join(ASSETS, 'icon.png'));
  console.log('  icon.png (1024x1024)');

  // Splash icon (200x200)
  await sharp(Buffer.from(createSplashIconSvg(200)))
    .png()
    .toFile(path.join(ASSETS, 'splash-icon.png'));
  console.log('  splash-icon.png (200x200)');

  // Favicon (48x48)
  await sharp(Buffer.from(createMainIconSvg(48)))
    .png()
    .toFile(path.join(ASSETS, 'favicon.png'));
  console.log('  favicon.png (48x48)');

  // Android adaptive icon foreground (1024x1024)
  await sharp(Buffer.from(createAdaptiveForegroundSvg(1024)))
    .png()
    .toFile(path.join(ASSETS, 'android-icon-foreground.png'));
  console.log('  android-icon-foreground.png (1024x1024)');

  // Android adaptive icon background (1024x1024)
  await sharp(Buffer.from(createAdaptiveBackgroundSvg(1024)))
    .png()
    .toFile(path.join(ASSETS, 'android-icon-background.png'));
  console.log('  android-icon-background.png (1024x1024)');

  // Android monochrome icon (1024x1024)
  await sharp(Buffer.from(createMonochromeSvg(1024)))
    .png()
    .toFile(path.join(ASSETS, 'android-icon-monochrome.png'));
  console.log('  android-icon-monochrome.png (1024x1024)');

  console.log('\nAll icons generated successfully!');
}

generate().catch(console.error);
