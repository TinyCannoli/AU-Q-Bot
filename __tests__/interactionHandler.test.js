const handleInteraction = require("../handlers/interactionHandler");
const queueStore = require("../queueStore");
const { Collection } = require("discord.js");
jest.mock("../queueStore", () => ({
  addToQueue: jest.fn(),
  removeFromQueue: jest.fn(),
  getQueue: jest.fn(),
  getQueueList: jest.fn(),
  withLock: (fn) => fn(),
}));

// Helper to simulate Discord message object
const createFakePanelMessage = (id = "msg123") => ({
  embeds: [{ title: "Queue:" }],
  author: { id: "bot123" },
  delete: jest.fn().mockResolvedValue(),
});

const createMockInteraction = (
  customId,
  userId = "user1",
  displayName = "TestUser"
) => {
  const panelMsg1 = {
    embeds: [{ title: "Queue:" }],
    author: { id: "bot123" },
    delete: jest.fn().mockResolvedValue(),
  };

  const messagesCollection = new Collection();
  messagesCollection.set("msg1", panelMsg1);

  return {
    customId,
    user: { id: userId },
    member: { displayName },
    deferUpdate: jest.fn().mockResolvedValue(),
    reply: jest.fn().mockResolvedValue(),
    channel: {
      messages: {
        fetch: jest.fn().mockResolvedValue(messagesCollection), // <- FIXED
      },
      send: jest.fn().mockResolvedValue(),
    },
    client: {
      user: { id: "bot123" },
    },
    replied: false,
    deferred: false,
  };
};

describe("interactionHandler", () => {
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

  test("handles leave_button", async () => {
    queueStore.removeFromQueue.mockReturnValue(true);
    queueStore.getQueueList.mockReturnValue("No one in the queue.");

    const interaction = createMockInteraction("leave_button");
    await handleInteraction(interaction);

    expect(queueStore.removeFromQueue).toHaveBeenCalledWith("user1");
    expect(interaction.deferUpdate).toHaveBeenCalled();
    expect(interaction.channel.send).toHaveBeenCalled();
  });

  test("handles tag_button with a user in queue", async () => {
    queueStore.getQueue.mockReturnValue([
      { userId: "userX", displayName: "Tester" },
    ]);
    queueStore.getQueueList.mockReturnValue("1. Tester");

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
});
