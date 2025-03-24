const handleInteraction = require("../handlers/interactionHandler");
const queueStore = require("../queueStore");
const { Collection } = require("discord.js");

jest.mock("../queueStore", () => {
  const actual = jest.requireActual("../queueStore");
  return {
    ...actual,
    addToQueue: jest.fn(actual.addToQueue),
    removeFromQueue: jest.fn(actual.removeFromQueue),
    getQueue: jest.fn(actual.getQueue),
    getQueueList: jest.fn(actual.getQueueList),
  };
});

beforeEach(() => {
  // Clear queue before each test
  const queue = queueStore.getQueue();
  queue.length = 0;
});

const createMockInteraction = (customId, userId, displayName = userId) => {
  const botUserId = "bot123";

  return {
    customId,
    user: { id: userId },
    member: { displayName },
    deferUpdate: jest.fn().mockResolvedValue(),
    reply: jest.fn().mockResolvedValue(),
    client: {
      user: { id: botUserId },
    },
    channel: {
      messages: {
        fetch: jest.fn().mockResolvedValue(
          new Collection() // no panels to delete
        ),
      },
      send: jest.fn().mockResolvedValue(),
    },
    replied: false,
    deferred: false,
  };
};

describe("Stress Test: Concurrent Actions", () => {
  test("100 users join concurrently", async () => {
    const promises = [];
    for (let i = 0; i < 100; i++) {
      const id = `user${i}`;
      const interaction = createMockInteraction("join_button", id);
      promises.push(handleInteraction(interaction));
    }

    await Promise.all(promises);

    const queue = queueStore.getQueue();
    const uniqueIds = new Set(queue.map((u) => u.userId));

    expect(queue.length).toBe(100);
    expect(uniqueIds.size).toBe(100);
  });

  test("50 users join then all leave concurrently", async () => {
    // Join first
    for (let i = 0; i < 50; i++) {
      const id = `user${i}`;
      await handleInteraction(createMockInteraction("join_button", id));
    }

    // Leave all at once
    const leavePromises = [];
    for (let i = 0; i < 50; i++) {
      const id = `user${i}`;
      leavePromises.push(
        handleInteraction(createMockInteraction("leave_button", id))
      );
    }

    await Promise.all(leavePromises);
    const queue = queueStore.getQueue();

    expect(queue.length).toBe(0);
  });

  test("25 users click DC simultaneously", async () => {
    // Join users first
    for (let i = 0; i < 25; i++) {
      await handleInteraction(createMockInteraction("join_button", `user${i}`));
    }

    // Simultaneous DC
    const dcPromises = [];
    for (let i = 0; i < 25; i++) {
      dcPromises.push(
        handleInteraction(createMockInteraction("dc_button", `user${i}`))
      );
    }

    await Promise.all(dcPromises);
    const queue = queueStore.getQueue();

    // Same users, but order should reflect DC'ing to top
    expect(queue.length).toBe(25);
    const unique = new Set(queue.map((p) => p.userId));
    expect(unique.size).toBe(25);
  });

  test("Multiple tag_button clicks only dequeue once per user", async () => {
    queueStore.getQueue().push({ userId: "u1", displayName: "User1" });

    const interaction1 = createMockInteraction("tag_button", "mod1");
    const interaction2 = createMockInteraction("tag_button", "mod2");
    const interaction3 = createMockInteraction("tag_button", "mod3");

    await Promise.all([
      handleInteraction(interaction1),
      handleInteraction(interaction2),
      handleInteraction(interaction3),
    ]);

    const queue = queueStore.getQueue();
    expect(queue.length).toBe(0); // user was only tagged once
  });
});
