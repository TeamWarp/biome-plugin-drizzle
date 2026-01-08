#!/usr/bin/env node

/**
 * CLI for biome-plugin-drizzle
 *
 * Commands:
 * - init: Initialize plugin configuration in the current project
 * - generate: Generate a customized .grit plugin file
 * - print-path: Print the path to the installed plugin
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { program } from "commander";
import { generatePlugin } from "./generator.js";
import { getPluginPath, getRelativePluginPath } from "./utils.js";

const packageJson = JSON.parse(
  readFileSync(join(dirname(getPluginPath()), "..", "package.json"), "utf-8"),
);

program
  .name("biome-plugin-drizzle")
  .description("CLI for biome-plugin-drizzle - Drizzle ORM safety rules")
  .version(packageJson.version);

program
  .command("init")
  .description("Initialize biome-plugin-drizzle in your project")
  .option(
    "-c, --config <path>",
    "Path to biome.json config file",
    "./biome.json",
  )
  .option(
    "--object-names <names>",
    "Comma-separated list of Drizzle object names (e.g., db,tx)",
  )
  .option(
    "--out <path>",
    "Output path for generated .grit file (only used with --object-names)",
  )
  .action((options: { config: string; objectNames?: string; out?: string }) => {
    const configPath = resolve(options.config);

    // Determine plugin path
    let pluginPath: string;

    if (options.objectNames) {
      // Generate a custom plugin with object name filtering
      const objectNames = options.objectNames
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      const outputPath = options.out || "./.biome/drizzle.grit";
      const absoluteOutputPath = resolve(outputPath);

      // Ensure output directory exists
      const outputDir = dirname(absoluteOutputPath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Generate and write the plugin
      const content = generatePlugin({ objectNames });
      writeFileSync(absoluteOutputPath, content);
      console.log(`Generated custom plugin at: ${absoluteOutputPath}`);
      console.log(`Object name filter: ${objectNames.join(", ")}`);

      pluginPath = outputPath;
    } else {
      // Use the default plugin from node_modules
      pluginPath = getRelativePluginPath();
      console.log(`Using default plugin from: ${pluginPath}`);
    }

    // Update or create biome.json
    let biomeConfig: Record<string, unknown> = {};

    if (existsSync(configPath)) {
      try {
        biomeConfig = JSON.parse(readFileSync(configPath, "utf-8"));
      } catch {
        console.error(`Error: Could not parse ${configPath}`);
        process.exit(1);
      }
    }

    // Add or update plugins array
    const plugins = (biomeConfig.plugins as string[]) || [];
    if (!plugins.includes(pluginPath)) {
      plugins.push(pluginPath);
    }
    biomeConfig.plugins = plugins;

    writeFileSync(configPath, `${JSON.stringify(biomeConfig, null, 2)}\n`);
    console.log(`Updated ${configPath} with plugin configuration`);
    console.log("\nSetup complete! Run 'biome lint' to check your code.");
  });

program
  .command("generate")
  .description("Generate a customized .grit plugin file")
  .requiredOption(
    "-o, --out <path>",
    "Output path for the generated .grit file",
  )
  .option(
    "--object-names <names>",
    "Comma-separated list of Drizzle object names to match (e.g., db,tx)",
  )
  .option("--no-delete-rule", "Exclude the enforce-delete-with-where rule")
  .option("--no-update-rule", "Exclude the enforce-update-with-where rule")
  .action(
    (options: {
      out: string;
      objectNames?: string;
      deleteRule: boolean;
      updateRule: boolean;
    }) => {
      const outputPath = resolve(options.out);

      // Parse object names if provided
      const objectNames = options.objectNames
        ?.split(",")
        .map((n) => n.trim())
        .filter(Boolean);

      // Generate the plugin content
      const content = generatePlugin({
        objectNames,
        includeDeleteRule: options.deleteRule,
        includeUpdateRule: options.updateRule,
      });

      // Ensure output directory exists
      const outputDir = dirname(outputPath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Write the plugin file
      writeFileSync(outputPath, content);

      console.log(`Generated plugin at: ${outputPath}`);
      if (objectNames?.length) {
        console.log(`Object name filter: ${objectNames.join(", ")}`);
      } else {
        console.log("Object name filter: none (matches all objects)");
      }
      console.log(
        `Delete rule: ${options.deleteRule ? "enabled" : "disabled"}`,
      );
      console.log(
        `Update rule: ${options.updateRule ? "enabled" : "disabled"}`,
      );
      console.log("\nAdd the following to your biome.json:");
      console.log(`  "plugins": ["${options.out}"]`);
    },
  );

program
  .command("print-path")
  .description("Print the path to the installed default plugin")
  .option("--absolute", "Print the absolute path instead of relative")
  .action((options: { absolute: boolean }) => {
    if (options.absolute) {
      console.log(getPluginPath());
    } else {
      console.log(getRelativePluginPath());
    }
  });

program.parse();
