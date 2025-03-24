const createQueuePanel = require("../utils/createQueuePanel");

module.exports = async function sendInitialPanel(client) {
  const channelId = process.env.PANEL_CHANNEL_ID;
  const channel = await client.channels.fetch(channelId);

  if (!channel || !channel.isTextBased()) {
    console.error("❌ Panel channel not found or not text-based.");
    return;
  }

  const { embed, row } = createQueuePanel();

  try {
    // Delete old panels
    const messages = await channel.messages.fetch({ limit: 10 });
    const panels = messages.filter(
      (m) => m.embeds[0]?.title === "Queue:" && m.author?.id === client.user.id
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

    console.log("✅ Initial queue panel sent.");
  } catch (err) {
    console.error("❌ Failed to send initial panel:", err);
  }
};
