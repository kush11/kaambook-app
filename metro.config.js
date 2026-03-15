const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add wasm to asset extensions so Metro doesn't try to resolve it as a JS module
config.resolver.assetExts.push('wasm');

module.exports = config;
