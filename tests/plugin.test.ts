/**
 * Tests for biome-plugin-drizzle
 *
 * These tests verify that the GritQL rules correctly detect Drizzle ORM
 * delete and update operations without .where() clauses.
 */

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const fixturesDir = join(__dirname, "fixtures");
const distDir = join(rootDir, "dist");

interface BiomeMessageElement {
  content: string;
  elements?: unknown[];
}

interface BiomeDiagnostic {
  category: string;
  severity: string;
  description: string;
  message: BiomeMessageElement[];
  location: {
    path: {
      file: string;
    };
    span?: [number, number];
  };
}

interface BiomeOutput {
  diagnostics: BiomeDiagnostic[];
  summary: {
    errors: number;
    warnings: number;
  };
}

// Create a unique temp directory for each test run
const testTempDir = join(tmpdir(), `biome-plugin-drizzle-test-${Date.now()}`);

/**
 * Get the message content from a diagnostic
 */
function getDiagnosticMessage(diagnostic: BiomeDiagnostic): string {
  // Try description first, then message content
  if (diagnostic.description) {
    return diagnostic.description;
  }
  if (diagnostic.message && diagnostic.message.length > 0) {
    return diagnostic.message.map((m) => m.content).join("");
  }
  return "";
}

/**
 * Run Biome lint on a file with the plugin enabled and return diagnostics.
 * Uses a temp directory outside the project to avoid config conflicts.
 */
function runBiomeLint(
  fixtureFile: string,
  pluginPath: string,
): BiomeDiagnostic[] {
  // Copy the fixture file to the temp directory
  const fileName = fixtureFile.split("/").pop() || "test.ts";
  const tempFilePath = join(testTempDir, fileName);
  copyFileSync(fixtureFile, tempFilePath);

  // Copy the plugin to the temp directory
  const pluginFileName = pluginPath.split("/").pop() || "drizzle.grit";
  const tempPluginPath = join(testTempDir, pluginFileName);
  copyFileSync(pluginPath, tempPluginPath);

  // Create biome.json in the temp directory
  const config = {
    $schema: "https://biomejs.dev/schemas/2.0.0/schema.json",
    plugins: [`./${pluginFileName}`],
    linter: {
      enabled: true,
      rules: {
        suspicious: {
          noExplicitAny: "off",
        },
      },
    },
  };

  writeFileSync(
    join(testTempDir, "biome.json"),
    JSON.stringify(config, null, 2),
  );

  const result = spawnSync(
    "npx",
    ["@biomejs/biome", "lint", "--reporter", "json", fileName],
    {
      cwd: testTempDir,
      encoding: "utf-8",
      timeout: 30000,
    },
  );

  // Biome outputs JSON to stdout (with a warning to stderr)
  const output = result.stdout || "{}";

  try {
    const parsed = JSON.parse(output) as BiomeOutput;
    return parsed.diagnostics || [];
  } catch {
    // If JSON parsing fails, log and return empty
    console.error("Failed to parse Biome output:", output);
    console.error("stderr:", result.stderr);
    return [];
  }
}

/**
 * Check if Biome is available and supports plugins.
 */
function checkBiomeAvailable(): boolean {
  try {
    const result = spawnSync("npx", ["@biomejs/biome", "--version"], {
      encoding: "utf-8",
      timeout: 10000,
    });
    const version = result.stdout?.trim() || "";
    // Check if version is 2.0.0 or higher (plugins support)
    const match = version.match(/Version:\s*(\d+)/);
    const majorVersion = match ? parseInt(match[1], 10) : 0;
    return result.status === 0 && majorVersion >= 2;
  } catch {
    return false;
  }
}

describe("biome-plugin-drizzle", () => {
  const pluginPath = join(distDir, "drizzle.grit");
  let biomeAvailable = false;

  beforeAll(() => {
    // Create temp directory
    if (!existsSync(testTempDir)) {
      mkdirSync(testTempDir, { recursive: true });
    }

    // Check if the plugin file exists (should be built before tests)
    if (!existsSync(pluginPath)) {
      console.warn(
        "Plugin not built. Run 'npm run build' before running tests.",
      );
    }

    biomeAvailable = checkBiomeAvailable();
    if (!biomeAvailable) {
      console.warn(
        "Biome CLI not available or version < 2.0.0. Integration tests will be skipped.",
      );
    }
  });

  afterAll(() => {
    // Clean up temp directory
    if (existsSync(testTempDir)) {
      rmSync(testTempDir, { recursive: true, force: true });
    }
  });

  describe("enforce-delete-with-where", () => {
    it("should detect delete operations without where clause", async () => {
      if (!biomeAvailable || !existsSync(pluginPath)) {
        console.log("Skipping: Biome not available or plugin not built");
        return;
      }

      const diagnostics = runBiomeLint(
        join(fixturesDir, "delete.bad.ts"),
        pluginPath,
      );

      // Filter to only our rule's diagnostics
      const deleteErrors = diagnostics.filter((d) =>
        getDiagnosticMessage(d).includes("enforce-delete-with-where"),
      );

      expect(deleteErrors.length).toBeGreaterThan(0);
      expect(getDiagnosticMessage(deleteErrors[0])).toContain(
        "Missing .where() clause",
      );
    });

    it("should not error on delete operations with where clause", async () => {
      if (!biomeAvailable || !existsSync(pluginPath)) {
        console.log("Skipping: Biome not available or plugin not built");
        return;
      }

      const diagnostics = runBiomeLint(
        join(fixturesDir, "delete.good.ts"),
        pluginPath,
      );

      // Filter to only our rule's diagnostics
      const deleteErrors = diagnostics.filter((d) =>
        getDiagnosticMessage(d).includes("enforce-delete-with-where"),
      );

      expect(deleteErrors.length).toBe(0);
    });
  });

  describe("enforce-update-with-where", () => {
    it("should detect update operations without where clause", async () => {
      if (!biomeAvailable || !existsSync(pluginPath)) {
        console.log("Skipping: Biome not available or plugin not built");
        return;
      }

      const diagnostics = runBiomeLint(
        join(fixturesDir, "update.bad.ts"),
        pluginPath,
      );

      // Filter to only our rule's diagnostics
      const updateErrors = diagnostics.filter((d) =>
        getDiagnosticMessage(d).includes("enforce-update-with-where"),
      );

      expect(updateErrors.length).toBeGreaterThan(0);
      expect(getDiagnosticMessage(updateErrors[0])).toContain(
        "Missing .where() clause",
      );
    });

    it("should not error on update operations with where clause", async () => {
      if (!biomeAvailable || !existsSync(pluginPath)) {
        console.log("Skipping: Biome not available or plugin not built");
        return;
      }

      const diagnostics = runBiomeLint(
        join(fixturesDir, "update.good.ts"),
        pluginPath,
      );

      // Filter to only our rule's diagnostics
      const updateErrors = diagnostics.filter((d) =>
        getDiagnosticMessage(d).includes("enforce-update-with-where"),
      );

      expect(updateErrors.length).toBe(0);
    });
  });

  describe("mixed operations", () => {
    it("should detect both delete and update violations in mixed file", async () => {
      if (!biomeAvailable || !existsSync(pluginPath)) {
        console.log("Skipping: Biome not available or plugin not built");
        return;
      }

      const diagnostics = runBiomeLint(
        join(fixturesDir, "mixed.bad.ts"),
        pluginPath,
      );

      const deleteErrors = diagnostics.filter((d) =>
        getDiagnosticMessage(d).includes("enforce-delete-with-where"),
      );
      const updateErrors = diagnostics.filter((d) =>
        getDiagnosticMessage(d).includes("enforce-update-with-where"),
      );

      expect(deleteErrors.length).toBeGreaterThan(0);
      expect(updateErrors.length).toBeGreaterThan(0);
    });
  });

  describe("false positive avoidance", () => {
    it("should still error when where is on a different chain", async () => {
      if (!biomeAvailable || !existsSync(pluginPath)) {
        console.log("Skipping: Biome not available or plugin not built");
        return;
      }

      const diagnostics = runBiomeLint(
        join(fixturesDir, "false-positive-avoidance.bad.ts"),
        pluginPath,
      );

      // Filter to only our rule's diagnostics
      const errors = diagnostics.filter(
        (d) =>
          getDiagnosticMessage(d).includes("enforce-delete-with-where") ||
          getDiagnosticMessage(d).includes("enforce-update-with-where"),
      );

      // Should have multiple errors because the where() calls are on different objects
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe("generator", () => {
  it("should generate plugin content without object names", async () => {
    const { generatePlugin } = await import("../src/generator.js");

    const content = generatePlugin({});

    expect(content).toContain("engine biome(1.0)");
    expect(content).toContain("language js");
    expect(content).toContain("enforce-delete-with-where");
    expect(content).toContain("enforce-update-with-where");
    expect(content).toContain("register_diagnostic");
    expect(content).toContain("or {");
  });

  it("should generate plugin content with object names", async () => {
    const { generatePlugin } = await import("../src/generator.js");

    const content = generatePlugin({ objectNames: ["db", "tx"] });

    expect(content).toContain("engine biome(1.0)");
    expect(content).toContain("or { `db`, `tx` }");
    expect(content).toContain("$obj <:");
  });

  it("should generate plugin content with single object name", async () => {
    const { generatePlugin } = await import("../src/generator.js");

    const content = generatePlugin({ objectNames: ["db"] });

    expect(content).toContain("`db`");
    expect(content).toContain("$obj <: `db`");
  });

  it("should allow excluding rules", async () => {
    const { generatePlugin } = await import("../src/generator.js");

    const deleteOnly = generatePlugin({ includeUpdateRule: false });
    expect(deleteOnly).toContain("enforce-delete-with-where");
    expect(deleteOnly).not.toContain("enforce-update-with-where");
    expect(deleteOnly).not.toContain("or {");

    const updateOnly = generatePlugin({ includeDeleteRule: false });
    expect(updateOnly).not.toContain("enforce-delete-with-where");
    expect(updateOnly).toContain("enforce-update-with-where");
    expect(updateOnly).not.toContain("or {");
  });
});

describe("utils", () => {
  it("should return plugin path", async () => {
    const { getPluginPath, getRelativePluginPath } = await import(
      "../src/utils.js"
    );

    const absolutePath = getPluginPath();
    expect(absolutePath).toContain("drizzle.grit");
    expect(absolutePath).toMatch(/^[/\\]/); // Should be absolute

    const relativePath = getRelativePluginPath();
    expect(relativePath).toContain("node_modules");
    expect(relativePath).toContain("drizzle.grit");
  });
});
