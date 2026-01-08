// BAD: Update operations without .where() clause
// These should all trigger the enforce-update-with-where rule

import { eq } from "drizzle-orm";

declare const db: any;
declare const users: any;
declare const posts: any;

// Simple update without where - SHOULD ERROR
db.update(users).set({ name: "John" });

// Update with returning but no where - SHOULD ERROR
db.update(users).set({ status: "active" }).returning();

// Update in an expression - SHOULD ERROR
const result = db.update(posts).set({ views: 0 });

// Update in async function - SHOULD ERROR
async function resetAllUserNames() {
  await db.update(users).set({ name: "Anonymous" });
}

// Update with chained methods but no where - SHOULD ERROR
db.update(users).set({ lastLogin: new Date() }).returning().execute();

// Multiple updates without where - SHOULD ERROR (2 errors)
db.update(users).set({ active: false });
db.update(posts).set({ published: false });
