// utils/createQueuePanel.js

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

const { getQueueList } = require("../queueStore");

function createQueuePanel() {
  const queueText = getQueueList() || "No one in the queue.";

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

  return { embed, row };
}

module.exports = createQueuePanel;
