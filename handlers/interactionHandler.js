const {
  addToQueue,
  removeFromQueue,
  getQueueList,
  getQueue,
  withLock,
} = require("../queueStore");

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = async function handleInteraction(interaction) {
  const channelId = interaction.channel.id;
  const userId = interaction.user.id;
  const displayName = interaction.member.displayName;

  await withLock(channelId, async () => {
    let queueChanged = false;

    try {
      switch (interaction.customId) {
        case "join_button":
          if (addToQueue(channelId, userId, displayName)) queueChanged = true;
          await interaction.deferUpdate();
          break;

        case "leave_button":
          if (removeFromQueue(channelId, userId)) queueChanged = true;
          await interaction.deferUpdate();
          break;

        case "tag_button": {
          const queue = getQueue(channelId);
          if (queue.length === 0) {
            await interaction.deferUpdate();
            return;
          }
          const { userId: targetUserId } = queue.shift();
          await interaction.reply({
            content: `Hey <@${targetUserId}>, you're up! - ${displayName}`,
            allowedMentions: { users: [targetUserId] },
          });
          queueChanged = true;
          break;
        }

        case "dc_button": {
          const queue = getQueue(channelId);
          const index = queue.findIndex((p) => p.userId === userId);
          if (index !== -1) queue.splice(index, 1);
          queue.unshift({ userId, displayName });
          queueChanged = true;
          await interaction.deferUpdate();
          break;
        }
      }

      if (queueChanged) {
        const queueText = getQueueList(channelId);

        const embed = new EmbedBuilder()
          .setTitle("Queue:")
          .setDescription(queueText)
          .setColor(0x2f3136);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("join_button")
            .setLabel("Join")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("dc_button")
            .setLabel("DC")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("leave_button")
            .setLabel("Leave")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("tag_button")
            .setLabel("Tag")
            .setStyle(ButtonStyle.Success)
        );

        const messages = await interaction.channel.messages.fetch({
          limit: 10,
        });
        const existingPanels = messages.filter(
          (m) =>
            m.embeds[0]?.title === "Queue:" &&
            m.author?.id === interaction.client.user.id
        );

        for (const msg of existingPanels.values()) {
          try {
            await msg.delete();
          } catch {}
        }

        await interaction.channel.send({
          embeds: [embed],
          components: [row],
        });
      }
    } catch (err) {
      console.error("Interaction error:", err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ Something went wrong.",
          flags: 1 << 6,
        });
      }
    }
  });
};
