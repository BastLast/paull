const Discord = require("discord.js");
const client = new Discord.Client();
const Config = require('./config');

/**
 * Will be executed whenever the bot has started
 */
client.on("ready", () => {
  console.log("Bot démarré :)")
});


const prefix = "?s";

client.on("message", (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
    message.react("✅").then(()=>{
      message.react("❌");
    });
    
});


client.on("messageReactionAdd", async (reaction) => {
  
});

client.login(Config.DISCORD_CLIENT_TOKEN);
