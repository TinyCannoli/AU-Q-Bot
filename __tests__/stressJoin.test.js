const handleInteraction = require("../handlers/interactionHandler");
const queueStore = require("../queueStore");

beforeEach(() => {
  const queue = queueStore.getQueue();
  queue.length = 0;
});

const createMockInteraction = (
  customId,
  userId = "user1",
  displayName = "TestUser"
) => ({
  customId,
  user: { id: userId },
  member: { displayName },
  deferUpdate: jest.fn().mockResolvedValue(),
  reply: jest.fn().mockResolvedValue(),
  channel: {
    send: jest.fn().mockResolvedValue(),
  },
  message: {
    delete: jest.fn().mockResolvedValue(),
  },
  replied: false,
  deferred: false,
});

describe("Stress Test: Concurrent Actions", () => {
  test("100 unique users join at once without duplication", async () => {
    const promises = [];

    for (let i = 0; i < 100; i++) {
      const userId = `user${i}`;
      const displayName = `User ${i}`;
      const interaction = createMockInteraction(
        "join_button",
        userId,
        displayName
      );
      promises.push(handleInteraction(interaction));
    }

    await Promise.all(promises);

    const queue = queueStore.getQueue();
    expect(queue.length).toBe(100);
    const uniqueIds = new Set(queue.map((u) => u.userId));
    expect(uniqueIds.size).toBe(100);
  });

  test("50 users join, then all leave simultaneously", async () => {
    for (let i = 0; i < 50; i++) {
      const userId = `user${i}`;
      const displayName = `User ${i}`;
      await handleInteraction(
        createMockInteraction("join_button", userId, displayName)
      );
    }

    const leavePromises = [];
    for (let i = 0; i < 50; i++) {
      const userId = `user${i}`;
      const displayName = `User ${i}`;
      const interaction = createMockInteraction(
        "leave_button",
        userId,
        displayName
      );
      leavePromises.push(handleInteraction(interaction));
    }

    await Promise.all(leavePromises);
    expect(queueStore.getQueue().length).toBe(0);
  });

  test("25 users join, then use DC simultaneously", async () => {
    for (let i = 0; i < 25; i++) {
      const userId = `user${i}`;
      const displayName = `User ${i}`;
      await handleInteraction(
        createMockInteraction("join_button", userId, displayName)
      );
    }

    const dcPromises = [];
    for (let i = 0; i < 25; i++) {
      const userId = `user${i}`;
      const displayName = `User ${i}`;
      const interaction = createMockInteraction(
        "dc_button",
        userId,
        displayName
      );
      dcPromises.push(handleInteraction(interaction));
    }

    await Promise.all(dcPromises);
    const queue = queueStore.getQueue();

    expect(queue.length).toBe(25);
    const uniqueIds = new Set(queue.map((u) => u.userId));
    expect(uniqueIds.size).toBe(25);

    expect(queue[0].userId).toBe("user24");
  });

  test("Multiple users tag concurrently, only one per user gets tagged", async () => {
    for (let i = 0; i < 10; i++) {
      const userId = `user${i}`;
      const displayName = `User ${i}`;
      await handleInteraction(
        createMockInteraction("join_button", userId, displayName)
      );
    }

    const taggers = [];
    for (let i = 0; i < 10; i++) {
      const userId = `tagger${i}`;
      const displayName = `Tagger ${i}`;
      const interaction = createMockInteraction(
        "tag_button",
        userId,
        displayName
      );
      taggers.push(handleInteraction(interaction));
    }

    await Promise.all(taggers);

    const queue = queueStore.getQueue();

    expect(queue.length).toBe(0);
  });
});
