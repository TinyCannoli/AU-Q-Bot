// __tests__/createQueuePanel.test.js
const createQueuePanel = require("../utils/createQueuePanel");
const queueStore = require("../queueStore");

jest.mock("../queueStore", () => ({
  getQueueList: jest.fn(),
}));

describe("createQueuePanel", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("returns panel with 'No one in the queue' when queue is empty", () => {
    queueStore.getQueueList.mockReturnValue("");

    const { embed, row } = createQueuePanel();

    expect(embed.data.title).toBe("Queue:");
    expect(embed.data.description).toBe("No one in the queue.");
    expect(row.components).toHaveLength(4);

    const labels = row.components.map((btn) => btn.data.label);
    expect(labels).toEqual(["Join", "DC", "Leave", "Tag"]);
  });

  test("includes custom queue text when queue is populated", () => {
    queueStore.getQueueList.mockReturnValue("1. UserA\n2. UserB");

    const { embed } = createQueuePanel();

    expect(embed.data.description).toContain("1. UserA");
    expect(embed.data.description).toContain("2. UserB");
  });
});
