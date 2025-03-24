require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const handleInteraction = require("./handlers/interactionHandler");
const sendInitialPanel = require("./panels/sendPanel");
const autoRefreshPanel = require("./utils/autoRefreshPanel");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await sendInitialPanel(client);
});

client.on("interactionCreate", (interaction) => {
  if (interaction.isButton()) {
    handleInteraction(interaction);
  }
});

client.on("messageCreate", (message) => {
  autoRefreshPanel(message);
});

client.login(process.env.DISCORD_TOKEN);
