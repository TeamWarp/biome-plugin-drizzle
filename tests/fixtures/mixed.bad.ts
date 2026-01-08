// BAD: Mixed delete and update operations without .where() clause
// This file contains both types of violations

import { eq } from "drizzle-orm";

declare const db: any;
declare const users: any;
declare const posts: any;
declare const comments: any;

// Delete without where - SHOULD ERROR
db.delete(users);

// Update without where - SHOULD ERROR
db.update(posts).set({ archived: true });

// Another delete without where - SHOULD ERROR
db.delete(comments);

// Another update without where - SHOULD ERROR
db.update(users).set({ notifications: false });

// Safe operations (should NOT error)
db.delete(users).where(eq(users.id, 1));
db.update(posts).set({ title: "New Title" }).where(eq(posts.id, 1));

// More unsafe operations - SHOULD ERROR
db.delete(posts).returning();
db.update(comments).set({ visible: false }).returning();
