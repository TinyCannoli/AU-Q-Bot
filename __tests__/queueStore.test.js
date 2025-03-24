const {
  addToQueue,
  removeFromQueue,
  getQueue,
  getQueueList,
} = require("../queueStore");

describe("Queue Store", () => {
  beforeEach(() => {
    getQueue().length = 0; // Reset queue
  });

  test("adds a user to the queue", () => {
    const added = addToQueue("u1", "UserOne");
    expect(added).toBe(true);
    expect(getQueue()).toHaveLength(1);
  });

  test("does not add the same user twice", () => {
    addToQueue("u1", "UserOne");
    const addedAgain = addToQueue("u1", "UserOne");
    expect(addedAgain).toBe(false);
    expect(getQueue()).toHaveLength(1);
  });

  test("removes a user from the queue", () => {
    addToQueue("u1", "UserOne");
    const removed = removeFromQueue("u1");
    expect(removed).toBe(true);
    expect(getQueue()).toHaveLength(0);
  });

  test("fails to remove a non-existent user", () => {
    const removed = removeFromQueue("u1");
    expect(removed).toBe(false);
  });

  test("returns correct queue list", () => {
    addToQueue("u1", "UserOne");
    addToQueue("u2", "UserTwo");
    const list = getQueueList();
    expect(list).toContain("1. UserOne");
    expect(list).toContain("2. UserTwo");
  });

  test("returns 'no one in queue' if empty", () => {
    expect(getQueueList()).toBe("\nNo one in the queue.");
  });
});
