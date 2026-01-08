/**
 * biome-plugin-drizzle
 *
 * Biome linter plugin for Drizzle ORM safety rules.
 * Enforces .where() clauses on delete and update operations.
 */

export { type GeneratePluginOptions, generatePlugin } from "./generator.js";
export { getDefaultPluginContent, getPluginPath } from "./utils.js";
