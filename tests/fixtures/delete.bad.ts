// BAD: Delete operations without .where() clause
// These should all trigger the enforce-delete-with-where rule

import { eq } from "drizzle-orm";

declare const db: any;
declare const users: any;
declare const posts: any;

// Simple delete without where - SHOULD ERROR
db.delete(users);

// Delete with returning but no where - SHOULD ERROR
db.delete(users).returning();

// Delete in an expression - SHOULD ERROR
const result = db.delete(posts);

// Delete in async function - SHOULD ERROR
async function deleteAllUsers() {
  await db.delete(users);
}

// Delete with chained methods but no where - SHOULD ERROR
db.delete(users).returning().execute();

// Multiple deletes without where - SHOULD ERROR (2 errors)
db.delete(users);
db.delete(posts);
