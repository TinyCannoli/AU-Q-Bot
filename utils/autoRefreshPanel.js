// utils/autoRefreshPanel.js

const createQueuePanel = require("./createQueuePanel");

const THRESHOLD = 10;
const messageCounts = new Map();
const ALLOWED_CHANNELS = process.env.PANEL_CHANNEL_IDS?.split(",") || [];

async function autoRefreshPanel(message) {
  // Ignore bots, non-text channels, or unapproved channels
  if (
    message.author.bot ||
    !message.channel.isTextBased() ||
    !ALLOWED_CHANNELS.includes(message.channel.id)
  ) {
    return;
  }

  const currentCount = messageCounts.get(message.channel.id) || 0;
  const newCount = currentCount + 1;

  if (newCount < THRESHOLD) {
    messageCounts.set(message.channel.id, newCount);
    return;
  }

  messageCounts.set(message.channel.id, 0); // Reset count

  const { embed, row } = createQueuePanel(message.channel.id);

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

    console.log(`🔄 Auto-refreshed panel in #${message.channel.id}`);
  } catch (err) {
    console.error("❌ Failed to auto-refresh panel:", err);
  }
}

module.exports = autoRefreshPanel;
