const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const escape = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const adminBlock = new RegExp(
  "^" + escape(path.resolve(__dirname, "admin")) + "[\\\\/].*",
);

config.resolver.blockList = [].concat(
  config.resolver.blockList ?? [],
  adminBlock,
);

module.exports = config;
