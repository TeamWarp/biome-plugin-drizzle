# drizzle/enforce-delete-with-where

Ensures all Drizzle ORM `.delete()` operations include a `.where()` clause to prevent accidental deletion of entire tables.

## Rule Details

This rule prevents dangerous delete operations that would affect all rows in a table. In Drizzle ORM, calling `.delete()` without `.where()` will delete every row in the specified table - often not the intended behavior.

### Why This Rule Exists

```typescript
// This deletes ALL users - probably not what you wanted!
db.delete(users);

// This is what you likely meant
db.delete(users).where(eq(users.id, userId));
```

Forgetting a `.where()` clause can result in catastrophic data loss. This rule catches such mistakes at lint time.

## Examples

### Failing Code

```typescript
import { users, posts } from "./schema";

// Simple delete without where
db.delete(users);

// Delete with returning but no where
db.delete(users).returning();

// Delete in expression
const result = db.delete(posts);

// Async delete without where
async function deleteAllUsers() {
  await db.delete(users);
}

// Chained methods but no where
db.delete(users).returning().execute();
```

### Passing Code

```typescript
import { users, posts } from "./schema";
import { eq, and, gt } from "drizzle-orm";

// Simple delete with where
db.delete(users).where(eq(users.id, 1));

// Delete with where and returning
db.delete(users).where(eq(users.id, 1)).returning();

// Where can come after returning
db.delete(users).returning().where(eq(users.id, 1));

// Complex where conditions
db.delete(users).where(
  and(
    eq(users.status, "inactive"),
    gt(users.lastLogin, thirtyDaysAgo)
  )
);

// With CTEs
db.with(archivedUsers).delete(users).where(eq(users.archived, true));

// Async with where
async function deleteUser(id: number) {
  await db.delete(users).where(eq(users.id, id));
}
```

## Configuration

### Default (Broad Matching)

By default, the rule matches any `.delete()` call on any object:

```json
{
  "plugins": ["./node_modules/biome-plugin-drizzle/dist/drizzle.grit"]
}
```

### Object Name Filtering

To reduce false positives (e.g., if you have other classes with `.delete()` methods), generate a plugin with object name filtering:

```bash
npx biome-plugin-drizzle generate --out ./.biome/drizzle.grit --object-names db,tx
```

This will only trigger on `db.delete()` and `tx.delete()`, not on `myArray.delete()` or `myCustomClass.delete()`.

## When Not To Use This Rule

- If you intentionally want to delete all rows and understand the implications
- If you have a separate validation layer that ensures `.where()` is always called
- If you're using a different ORM or query builder that happens to have similar method names (use object name filtering instead)

## Related Rules

- [enforce-update-with-where](./enforce-update-with-where.md) - Similar rule for update operations

## Further Reading

- [Drizzle ORM Delete Documentation](https://orm.drizzle.team/docs/delete)
- [ESLint Plugin Drizzle](https://github.com/drizzle-team/drizzle-orm/tree/main/eslint-plugin-drizzle)
