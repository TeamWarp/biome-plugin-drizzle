# drizzle/enforce-update-with-where

Ensures all Drizzle ORM `.update().set()` operations include a `.where()` clause to prevent accidental updates to entire tables.

## Rule Details

This rule prevents dangerous update operations that would affect all rows in a table. In Drizzle ORM, calling `.update().set()` without `.where()` will update every row in the specified table - often not the intended behavior.

### Why This Rule Exists

```typescript
// This updates ALL users - probably not what you wanted!
db.update(users).set({ role: "admin" });

// This is what you likely meant
db.update(users).set({ role: "admin" }).where(eq(users.id, userId));
```

Forgetting a `.where()` clause can result in mass data corruption. This rule catches such mistakes at lint time.

## Examples

### Failing Code

```typescript
import { users, posts } from "./schema";

// Simple update without where
db.update(users).set({ name: "John" });

// Update with returning but no where
db.update(users).set({ status: "active" }).returning();

// Update in expression
const result = db.update(posts).set({ views: 0 });

// Async update without where
async function resetAllUserNames() {
  await db.update(users).set({ name: "Anonymous" });
}

// Chained methods but no where
db.update(users).set({ lastLogin: new Date() }).returning().execute();
```

### Passing Code

```typescript
import { users, posts } from "./schema";
import { eq, and, gt, sql } from "drizzle-orm";

// Simple update with where
db.update(users).set({ name: "John" }).where(eq(users.id, 1));

// Update with where and returning
db.update(users)
  .set({ status: "active" })
  .where(eq(users.id, 1))
  .returning();

// Where can come after returning
db.update(users)
  .set({ email: "new@email.com" })
  .returning()
  .where(eq(users.id, 1));

// Complex where conditions
db.update(users)
  .set({ verified: true })
  .where(
    and(
      eq(users.status, "pending"),
      gt(users.createdAt, thirtyDaysAgo)
    )
  );

// Using SQL expressions
db.update(posts)
  .set({ views: sql`views + 1` })
  .where(eq(posts.id, postId));

// With CTEs
db.with(activeUsers)
  .update(users)
  .set({ tier: "premium" })
  .where(eq(users.active, true));

// Async with where
async function updateUser(id: number, data: UserUpdate) {
  await db.update(users).set(data).where(eq(users.id, id));
}
```

## Configuration

### Default (Broad Matching)

By default, the rule matches any `.update().set()` call on any object:

```json
{
  "plugins": ["./node_modules/biome-plugin-drizzle/dist/drizzle.grit"]
}
```

### Object Name Filtering

To reduce false positives (e.g., if you have other classes with `.update()` methods), generate a plugin with object name filtering:

```bash
npx biome-plugin-drizzle generate --out ./.biome/drizzle.grit --object-names db,tx
```

This will only trigger on `db.update().set()` and `tx.update().set()`, not on other objects.

## When Not To Use This Rule

- If you intentionally want to update all rows and understand the implications
- If you have a separate validation layer that ensures `.where()` is always called
- If you're using a different ORM or query builder that happens to have similar method names (use object name filtering instead)

## Related Rules

- [enforce-delete-with-where](./enforce-delete-with-where.md) - Similar rule for delete operations

## Further Reading

- [Drizzle ORM Update Documentation](https://orm.drizzle.team/docs/update)
- [ESLint Plugin Drizzle](https://github.com/drizzle-team/drizzle-orm/tree/main/eslint-plugin-drizzle)
