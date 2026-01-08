# biome-plugin-drizzle

Biome linter plugin for Drizzle ORM safety rules. Enforces `.where()` clauses on delete and update operations to prevent accidental data loss.

This plugin is a port of [eslint-plugin-drizzle](https://github.com/drizzle-team/drizzle-orm/tree/main/eslint-plugin-drizzle) for the [Biome](https://biomejs.dev/) toolchain.

## Features

- **enforce-delete-with-where**: Catches `.delete()` calls without `.where()` that would delete all rows
- **enforce-update-with-where**: Catches `.update().set()` calls without `.where()` that would update all rows
- **Object name filtering**: Optionally restrict rules to specific Drizzle object names (e.g., `db`, `tx`)
- **CLI generator**: Generate customized plugin configurations

## Installation

```bash
npm install -D biome-plugin-drizzle @biomejs/biome
```

## Quick Setup

### Option 1: Using the CLI (Recommended)

```bash
# Initialize with default settings (broad matching)
npx biome-plugin-drizzle init

# Or initialize with object name filtering (reduces false positives)
npx biome-plugin-drizzle init --object-names db,tx
```

### Option 2: Manual Configuration

Add the plugin to your `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "plugins": ["./node_modules/biome-plugin-drizzle/dist/drizzle.grit"],
  "linter": {
    "enabled": true
  }
}
```

> **Note:** This plugin requires Biome 2.0.0 or later, which introduced support for GritQL plugins.

Then run Biome:

```bash
npx biome lint .
```

## Configuration

### Default Plugin (Broad Matching)

The default plugin matches any `.delete()` or `.update().set()` call, which may cause false positives if you have other classes with similar method names.

```json
{
  "plugins": ["./node_modules/biome-plugin-drizzle/dist/drizzle.grit"]
}
```

### Generated Plugin (Object Name Filtering)

To reduce false positives, generate a customized plugin that only matches specific object names:

```bash
# Generate a plugin that only matches 'db' and 'tx' objects
npx biome-plugin-drizzle generate --out ./.biome/drizzle.grit --object-names db,tx
```

Then update your `biome.json`:

```json
{
  "plugins": ["./.biome/drizzle.grit"]
}
```

This is equivalent to the ESLint plugin's `drizzleObjectName` option:

```javascript
// ESLint equivalent
{
  "drizzle/enforce-delete-with-where": ["error", { "drizzleObjectName": ["db", "tx"] }]
}
```

## Rules

### drizzle/enforce-delete-with-where

Ensures all `.delete()` operations include a `.where()` clause to prevent accidental deletion of entire tables.

#### Failing Examples

```typescript
// Will delete ALL rows in the users table!
db.delete(users);

// Still deletes all rows (returning doesn't add safety)
db.delete(users).returning();

// Async operations without where
await db.delete(posts);
```

#### Passing Examples

```typescript
// Safe: has where clause
db.delete(users).where(eq(users.id, 1));

// Safe: where can be anywhere in the chain
db.delete(users).returning().where(eq(users.id, 1));

// Safe: with CTEs
db.with(someCte).delete(users).where(eq(users.id, 1));
```

### drizzle/enforce-update-with-where

Ensures all `.update().set()` operations include a `.where()` clause to prevent accidental updates to entire tables.

#### Failing Examples

```typescript
// Will update ALL rows in the users table!
db.update(users).set({ name: "John" });

// Still updates all rows
db.update(users).set({ status: "active" }).returning();

// Async operations without where
await db.update(posts).set({ views: 0 });
```

#### Passing Examples

```typescript
// Safe: has where clause
db.update(users).set({ name: "John" }).where(eq(users.id, 1));

// Safe: where can be anywhere in the chain
db.update(users).set({ email: "new@email.com" }).returning().where(eq(users.id, 1));

// Safe: complex conditions
db.update(users)
  .set({ verified: true })
  .where(and(eq(users.status, "pending"), gt(users.age, 18)));
```

## CLI Reference

### `init`

Initialize biome-plugin-drizzle in your project.

```bash
npx biome-plugin-drizzle init [options]
```

Options:
- `-c, --config <path>`: Path to biome.json (default: `./biome.json`)
- `--object-names <names>`: Comma-separated list of Drizzle object names
- `--out <path>`: Output path for generated .grit file (default: `./.biome/drizzle.grit`)

### `generate`

Generate a customized .grit plugin file.

```bash
npx biome-plugin-drizzle generate --out <path> [options]
```

Options:
- `-o, --out <path>`: Output path for the generated .grit file (required)
- `--object-names <names>`: Comma-separated list of Drizzle object names
- `--no-delete-rule`: Exclude the enforce-delete-with-where rule
- `--no-update-rule`: Exclude the enforce-update-with-where rule

### `print-path`

Print the path to the installed default plugin.

```bash
npx biome-plugin-drizzle print-path [--absolute]
```

Options:
- `--absolute`: Print the absolute path instead of relative

## Limitations

### Biome Plugin System

- Biome linter plugins are currently GritQL-based and can only report diagnostics
- Unlike ESLint, Biome plugins cannot accept configuration options in `biome.json`
- Workaround: Use the CLI generator to create customized plugins with object name filtering

### Pattern Matching

- The plugin uses structural pattern matching, which may not catch all edge cases
- Complex dynamic code patterns may not be detected
- When in doubt, add explicit `.where()` clauses to your queries

## How to Release

1. Update version in `package.json`
2. Update CHANGELOG if you have one
3. Build and test:
   ```bash
   npm run build
   npm test
   ```
4. Publish to npm:
   ```bash
   npm publish
   ```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT

---

Inspired by [eslint-plugin-drizzle](https://github.com/drizzle-team/drizzle-orm/tree/main/eslint-plugin-drizzle) from the Drizzle Team.
