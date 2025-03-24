// __tests__/interactionHandler.test.js
const handleInteraction = require("../handlers/interactionHandler");
const queueStore = require("../queueStore");

jest.mock("../queueStore", () => ({
  addToQueue: jest.fn(),
  removeFromQueue: jest.fn(),
  getQueueList: jest.fn(),
  getQueue: jest.fn(),
}));

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

describe("Interaction Handler - Core & Edge Cases", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("handles join_button", async () => {
    queueStore.addToQueue.mockReturnValue(true);
    queueStore.getQueueList.mockReturnValue("1. TestUser");

    const interaction = createMockInteraction("join_button");
    await handleInteraction(interaction);

    expect(queueStore.addToQueue).toHaveBeenCalledWith("user1", "TestUser");
    expect(interaction.deferUpdate).toHaveBeenCalled();
    expect(interaction.channel.send).toHaveBeenCalled();
  });

  test("prevents duplicate join", async () => {
    queueStore.addToQueue.mockReturnValue(false);

    const interaction = createMockInteraction("join_button");
    await handleInteraction(interaction);

    expect(queueStore.addToQueue).toHaveBeenCalled();
    expect(interaction.deferUpdate).toHaveBeenCalled();
    expect(interaction.channel.send).not.toHaveBeenCalled();
  });

  test("handles leave_button", async () => {
    queueStore.removeFromQueue.mockReturnValue(true);
    queueStore.getQueueList.mockReturnValue("");

    const interaction = createMockInteraction("leave_button");
    await handleInteraction(interaction);

    expect(queueStore.removeFromQueue).toHaveBeenCalledWith("user1");
    expect(interaction.deferUpdate).toHaveBeenCalled();
    expect(interaction.channel.send).toHaveBeenCalled();
  });

  test("prevents leave when not in queue", async () => {
    queueStore.removeFromQueue.mockReturnValue(false);

    const interaction = createMockInteraction("leave_button");
    await handleInteraction(interaction);

    expect(queueStore.removeFromQueue).toHaveBeenCalled();
    expect(interaction.deferUpdate).toHaveBeenCalled();
    expect(interaction.channel.send).not.toHaveBeenCalled();
  });

  test("handles dc_button", async () => {
    queueStore.getQueue.mockReturnValue([
      { userId: "user1", displayName: "TestUser" },
    ]);
    queueStore.getQueueList.mockReturnValue("1. TestUser");

    const interaction = createMockInteraction("dc_button");
    await handleInteraction(interaction);

    expect(interaction.deferUpdate).toHaveBeenCalled();
    expect(interaction.channel.send).toHaveBeenCalled();
  });

  test("dc_button still updates panel if user not in queue", async () => {
    queueStore.getQueue.mockReturnValue([
      { userId: "someone-else", displayName: "AnotherUser" },
    ]);
    queueStore.getQueueList.mockReturnValue("1. TestUser, 2. AnotherUser");

    const interaction = createMockInteraction("dc_button");
    await handleInteraction(interaction);

    expect(interaction.deferUpdate).toHaveBeenCalled();
    expect(interaction.channel.send).toHaveBeenCalled();
  });

  test("handles tag_button with user in queue", async () => {
    queueStore.getQueue.mockReturnValue([
      { userId: "userX", displayName: "Player1" },
    ]);
    queueStore.getQueueList.mockReturnValue("1. Player1");

    const interaction = createMockInteraction("tag_button");
    await handleInteraction(interaction);

    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining("<@userX>"),
      allowedMentions: { users: ["userX"] },
    });
  });

  test("handles tag_button with empty queue", async () => {
    queueStore.getQueue.mockReturnValue([]);

    const interaction = createMockInteraction("tag_button");
    await handleInteraction(interaction);

    expect(interaction.deferUpdate).toHaveBeenCalled();
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  test("handles tag_button when only self is in queue", async () => {
    queueStore.getQueue.mockReturnValue([
      { userId: "user1", displayName: "TestUser" },
    ]);
    queueStore.getQueueList.mockReturnValue("1. TestUser");

    const interaction = createMockInteraction(
      "tag_button",
      "user1",
      "TestUser"
    );
    await handleInteraction(interaction);

    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining("<@user1>"),
      allowedMentions: { users: ["user1"] },
    });
  });
});
