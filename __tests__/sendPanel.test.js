const { Collection } = require("discord.js");
const createQueuePanel = require("../utils/createQueuePanel");
const sendInitialPanel = require("../panels/sendPanel");

jest.mock("../utils/createQueuePanel", () => jest.fn());

describe("sendInitialPanel", () => {
  const mockEmbed = { data: { title: "Queue:" } }; // minimal embed stub
  const mockRow = { components: [] };

  beforeEach(() => {
    jest.clearAllMocks();
    // Make createQueuePanel return our stubbed embed and row.
    createQueuePanel.mockReturnValue({ embed: mockEmbed, row: mockRow });
  });

  // We'll create a mock message that simulates a panel message
  const createMockPanelMessage = (title = "Queue:") => ({
    embeds: [{ title }],
    author: { id: "bot123" },
    delete: jest.fn().mockResolvedValue(),
  });

  const mockChannel = {
    isTextBased: () => true,
    messages: {
      fetch: jest.fn().mockResolvedValue(
        // Use Discord.js Collection for proper filter() support.
        new Collection([
          ["1", createMockPanelMessage("Queue:")],
          ["2", createMockPanelMessage("Queue:")],
        ])
      ),
    },
    send: jest.fn().mockResolvedValue(),
  };

  const mockClient = {
    user: { id: "bot123" },
    channels: {
      fetch: jest.fn().mockResolvedValue(mockChannel),
    },
  };

  test("sends a new panel and deletes old ones", async () => {
    process.env.PANEL_CHANNEL_ID = "testChannel";

    await sendInitialPanel(mockClient);

    // Check that messages.fetch was called with { limit: 10 }
    expect(mockChannel.messages.fetch).toHaveBeenCalledWith({ limit: 10 });

    // The old panel messages should have been deleted.
    const fetchedPanels = await mockChannel.messages.fetch({ limit: 10 });
    fetchedPanels.forEach((msg) => {
      expect(msg.delete).toHaveBeenCalled();
    });

    // Check that channel.send was called with the new embed and row
    expect(mockChannel.send).toHaveBeenCalledWith({
      embeds: [mockEmbed],
      components: [mockRow],
    });
  });

  test("logs error if channel is invalid", async () => {
    // Simulate fetch returning a non-text channel
    mockClient.channels.fetch.mockResolvedValue(null);

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await sendInitialPanel(mockClient);
    expect(consoleSpy).toHaveBeenCalledWith(
      "❌ Panel channel not found or not text-based."
    );
    consoleSpy.mockRestore();
  });
});
