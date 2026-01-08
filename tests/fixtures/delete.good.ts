// GOOD: Delete operations with .where() clause
// These should NOT trigger any errors

import { eq, and, gt } from "drizzle-orm";

declare const db: any;
declare const users: any;
declare const posts: any;

// Simple delete with where - OK
db.delete(users).where(eq(users.id, 1));

// Delete with where and returning - OK
db.delete(users).where(eq(users.id, 1)).returning();

// Delete with returning then where - OK
db.delete(users).returning().where(eq(users.id, 1));

// Delete with complex where condition - OK
db.delete(users).where(and(eq(users.status, "inactive"), gt(users.age, 30)));

// Delete in async function with where - OK
async function deleteUser(id: number) {
  await db.delete(users).where(eq(users.id, id));
}

// Delete with where and execute - OK
db.delete(posts).where(eq(posts.authorId, 1)).execute();

// Delete with CTE and where - OK
db.with(someCte).delete(users).where(eq(users.id, 1));

// Multiple safe deletes - OK
db.delete(users).where(eq(users.id, 1));
db.delete(posts).where(eq(posts.id, 2));

declare const someCte: any;
