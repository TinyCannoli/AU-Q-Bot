// utils/autoRefreshPanel.js

const createQueuePanel = require("./createQueuePanel");

let messageCount = 0;
const THRESHOLD = 10;

async function autoRefreshPanel(message) {
  // Ignore bots or non-text channels
  if (message.author.bot || !message.channel.isTextBased()) return;

  messageCount++;

  if (messageCount < THRESHOLD) return;

  messageCount = 0;

  const { embed, row } = createQueuePanel();

  try {
    const messages = await message.channel.messages.fetch({ limit: 20 });

    const panels = messages.filter(
      (m) =>
        m.embeds[0]?.title === "Queue:" &&
        m.author?.id === message.client.user.id
    );

    for (const msg of panels.values()) {
      try {
        await msg.delete();
      } catch {}
    }

    await message.channel.send({
      embeds: [embed],
      components: [row],
    });

    console.log("🔄 Auto-refreshed panel after 10 messages");
  } catch (err) {
    console.error("❌ Failed to auto-refresh panel:", err);
  }
}

module.exports = autoRefreshPanel;
