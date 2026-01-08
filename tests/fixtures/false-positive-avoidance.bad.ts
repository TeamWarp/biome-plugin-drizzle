// FALSE POSITIVE AVOIDANCE TEST
// These should STILL ERROR because the .where() is on a different object/chain
// This tests the critical requirement that .where() must be on the SAME chain

import { eq } from "drizzle-orm";

declare const db: any;
declare const otherDb: any;
declare const users: any;
declare const posts: any;

// Case 1: where() on a different object in the same expression
// The delete doesn't have where, but other object does
// SHOULD ERROR on the db.delete(users)
someFn(db.delete(users), otherDb.where(eq(users.id, 1)));

// Case 2: where() called on a sibling expression
// SHOULD ERROR on the db.delete(posts)
const deleteResult = db.delete(posts);
const whereClause = otherDb.where(eq(posts.id, 1));

// Case 3: where() in callback doesn't satisfy outer delete
// SHOULD ERROR on the db.delete(users)
processQuery(db.delete(users), (q: any) => q.where(eq(users.id, 1)));

// Case 4: where() on unrelated method chain
// SHOULD ERROR on both operations
db.delete(users);
someArray.filter((x: any) => x.where(true));

// Case 5: update without where, but where appears elsewhere
// SHOULD ERROR on the db.update(posts).set(...)
handleUpdate(db.update(posts).set({ status: "draft" }), config.where);

// Case 6: Nested in object, where on different property
// SHOULD ERROR on the db.delete(users)
const queries = {
  delete: db.delete(users),
  condition: db.where(eq(users.id, 1)),
};

// Case 7: Array with mixed operations
// SHOULD ERROR on the delete (first element)
const operations = [db.delete(users), db.select().where(eq(users.id, 1))];

declare function someFn(...args: any[]): void;
declare function processQuery(query: any, processor: (q: any) => any): void;
declare function handleUpdate(query: any, config: any): void;
declare const someArray: any[];
declare const config: any;
