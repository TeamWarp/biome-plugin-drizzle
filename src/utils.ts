/**
 * Utility functions for biome-plugin-drizzle.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Returns the absolute path to the default plugin .grit file.
 * Useful for wiring up biome.json configuration.
 */
export function getPluginPath(): string {
  return join(__dirname, "drizzle.grit");
}

/**
 * Returns the content of the default plugin .grit file.
 */
export function getDefaultPluginContent(): string {
  return readFileSync(getPluginPath(), "utf-8");
}

/**
 * Resolves the plugin path relative to node_modules.
 * Returns a path suitable for use in biome.json plugins array.
 */
export function getRelativePluginPath(): string {
  return "./node_modules/biome-plugin-drizzle/dist/drizzle.grit";
}
