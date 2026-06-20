const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets', 'images');
const GREEN = '#16A34A';
const GREEN_LIGHT = '#22C55E';
const GREEN_DARK = '#15803D';

// ── App Icon: Green bg + white clipboard with checkmark ──
function appIconSvg(size) {
  const s = (v) => Math.round((v / 1024) * size);
  return `<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GREEN_LIGHT}"/>
      <stop offset="100%" stop-color="${GREEN_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>
  <rect x="300" y="270" width="424" height="524" rx="40" fill="white"/>
  <rect x="400" y="210" width="224" height="100" rx="50" fill="white"/>
  <rect x="430" y="238" width="164" height="44" rx="22" fill="${GREEN_DARK}"/>
  <polyline points="390,500 468,580 640,390" fill="none" stroke="${GREEN}" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="380" y="650" width="264" height="22" rx="11" fill="#E5E5E0" opacity="0.8"/>
  <rect x="380" y="700" width="200" height="22" rx="11" fill="#E5E5E0" opacity="0.6"/>
</svg>`;
}

// ── Splash Icon: Clipboard on transparent bg ──
function splashIconSvg() {
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GREEN_LIGHT}"/>
      <stop offset="100%" stop-color="${GREEN_DARK}"/>
    </linearGradient>
  </defs>
  <rect x="56" y="10" width="400" height="492" rx="56" fill="url(#sbg)"/>
  <rect x="130" y="90" width="252" height="330" rx="28" fill="white"/>
  <rect x="194" y="55" width="124" height="62" rx="31" fill="white"/>
  <rect x="212" y="70" width="88" height="32" rx="16" fill="${GREEN_DARK}"/>
  <polyline points="175,250 215,292 300,195" fill="none" stroke="${GREEN}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="172" y="330" width="168" height="14" rx="7" fill="#E5E5E0" opacity="0.8"/>
  <rect x="172" y="358" width="124" height="14" rx="7" fill="#E5E5E0" opacity="0.6"/>
</svg>`;
}

// ── Android Adaptive Foreground: clipboard centered in safe zone ──
function androidForegroundSvg() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(200,200) scale(0.6)">
    <rect x="300" y="270" width="424" height="524" rx="40" fill="white"/>
    <rect x="400" y="210" width="224" height="100" rx="50" fill="white"/>
    <rect x="430" y="238" width="164" height="44" rx="22" fill="${GREEN_DARK}"/>
    <polyline points="390,500 468,580 640,390" fill="none" stroke="${GREEN}" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="380" y="650" width="264" height="22" rx="11" fill="#E5E5E0" opacity="0.8"/>
    <rect x="380" y="700" width="200" height="22" rx="11" fill="#E5E5E0" opacity="0.6"/>
  </g>
</svg>`;
}

// ── Android Adaptive Background: green gradient ──
function androidBackgroundSvg() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="abg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GREEN_LIGHT}"/>
      <stop offset="100%" stop-color="${GREEN_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#abg)"/>
</svg>`;
}

// ── Android Monochrome: clipboard outline ──
function androidMonochromeSvg() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(200,200) scale(0.6)">
    <rect x="300" y="270" width="424" height="524" rx="40" fill="none" stroke="black" stroke-width="20"/>
    <rect x="400" y="210" width="224" height="100" rx="50" fill="none" stroke="black" stroke-width="20"/>
    <rect x="430" y="238" width="164" height="44" rx="22" fill="black"/>
    <polyline points="390,500 468,580 640,390" fill="none" stroke="black" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="380" y="650" width="264" height="22" rx="11" fill="black" opacity="0.5"/>
    <rect x="380" y="700" width="200" height="22" rx="11" fill="black" opacity="0.3"/>
  </g>
</svg>`;
}

async function generate() {
  console.log('Generating Hisab Pagar app icons...\n');

  await sharp(Buffer.from(appIconSvg(1024))).png().toFile(path.join(ASSETS, 'icon.png'));
  console.log('  icon.png (1024x1024)');

  await sharp(Buffer.from(splashIconSvg())).png().toFile(path.join(ASSETS, 'splash-icon.png'));
  console.log('  splash-icon.png (512x512)');

  await sharp(Buffer.from(appIconSvg(48))).resize(48, 48).png().toFile(path.join(ASSETS, 'favicon.png'));
  console.log('  favicon.png (48x48)');

  await sharp(Buffer.from(androidForegroundSvg())).png().toFile(path.join(ASSETS, 'android-icon-foreground.png'));
  console.log('  android-icon-foreground.png (1024x1024)');

  await sharp(Buffer.from(androidBackgroundSvg())).png().toFile(path.join(ASSETS, 'android-icon-background.png'));
  console.log('  android-icon-background.png (1024x1024)');

  await sharp(Buffer.from(androidMonochromeSvg())).png().toFile(path.join(ASSETS, 'android-icon-monochrome.png'));
  console.log('  android-icon-monochrome.png (1024x1024)');

  console.log('\nAll icons generated!');
}

generate().catch(console.error);
