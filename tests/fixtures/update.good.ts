// GOOD: Update operations with .where() clause
// These should NOT trigger any errors

import { eq, and, gt, sql } from "drizzle-orm";

declare const db: any;
declare const users: any;
declare const posts: any;

// Simple update with where - OK
db.update(users).set({ name: "John" }).where(eq(users.id, 1));

// Update with where and returning - OK
db.update(users).set({ status: "active" }).where(eq(users.id, 1)).returning();

// Update with returning then where - OK
db.update(users).set({ email: "new@email.com" }).returning().where(eq(users.id, 1));

// Update with complex where condition - OK
db.update(users)
  .set({ verified: true })
  .where(and(eq(users.status, "pending"), gt(users.createdAt, new Date())));

// Update in async function with where - OK
async function updateUser(id: number, name: string) {
  await db.update(users).set({ name }).where(eq(users.id, id));
}

// Update with where and execute - OK
db.update(posts).set({ views: sql`views + 1` }).where(eq(posts.id, 1)).execute();

// Update with CTE and where - OK
db.with(someCte).update(users).set({ role: "admin" }).where(eq(users.id, 1));

// Multiple safe updates - OK
db.update(users).set({ active: true }).where(eq(users.id, 1));
db.update(posts).set({ published: true }).where(eq(posts.id, 2));

declare const someCte: any;
