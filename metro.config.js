// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

// 1) Support .cjs files
config.resolver.sourceExts.push("cjs");

// 2) Re-enable legacy package exports
config.resolver.unstable_enablePackageExports = false;

module.exports = config;