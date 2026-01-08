// OBJECT NAMES TEST
// When configured with objectNames: ["db"], only db.delete() should error,
// NOT myClassObj.delete() or other objects

import { eq } from "drizzle-orm";

declare const db: any;
declare const tx: any;
declare const myClassObj: any;
declare const users: any;

// These should ERROR when objectNames includes "db":
db.delete(users);
db.update(users).set({ name: "John" });

// These should ERROR when objectNames includes "tx":
tx.delete(users);
tx.update(users).set({ name: "Jane" });

// These should NOT ERROR because "myClassObj" is not in objectNames:
// (myClassObj might be a different class with its own .delete() method)
myClassObj.delete(users);
myClassObj.update(users).set({ active: false });

// Safe operations (should never error):
db.delete(users).where(eq(users.id, 1));
db.update(users).set({ name: "John" }).where(eq(users.id, 1));
tx.delete(users).where(eq(users.id, 1));
tx.update(users).set({ name: "Jane" }).where(eq(users.id, 1));
