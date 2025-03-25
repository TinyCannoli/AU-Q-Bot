const createQueuePanel = require("../utils/createQueuePanel");

module.exports = async function sendInitialPanel(client) {
  const channelIds = process.env.PANEL_CHANNEL_IDS?.split(",") || [];

  for (const channelId of channelIds) {
    try {
      const channel = await client.channels.fetch(channelId.trim());

      if (!channel || !channel.isTextBased()) {
        console.error(`❌ Channel ${channelId} not found or not text-based.`);
        continue;
      }

      const { embed, row } = createQueuePanel();

      // Delete old panels
      const messages = await channel.messages.fetch({ limit: 10 });
      const panels = messages.filter(
        (m) =>
          m.embeds?.[0]?.title === "Queue:" && m.author?.id === client.user.id
      );

      for (const msg of panels.values()) {
        try {
          await msg.delete();
        } catch {}
      }

      await channel.send({
        embeds: [embed],
        components: [row],
      });

      console.log(`✅ Sent panel to channel ${channelId}`);
    } catch (err) {
      console.error(`❌ Failed to send panel to ${channelId}:`, err);
    }
  }
};
