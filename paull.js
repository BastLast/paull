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

client.on("message", async (message) => {

  if (isNotACommand(message)) return;

  let args = message.content.slice(prefix.length).trim().split(/ +/g);
  if (isANumberPoll(args)) {
    await reactWithNumber(args, message);
  } else {
    await message.react("✅"),
      message.react("❌");
  }
});


client.on("messageReactionAdd", async (reaction) => {

});

/**
 * React with numbers to the message
 * @param {*} args 
 * @param {*} message 
 */
async function reactWithNumber(args, message) {
  let = array = {
    "0": "1️⃣",
    "1": "2️⃣",
    "2": "3️⃣",
    "3": "4️⃣",
    "4": "5️⃣",
    "5": "6️⃣",
    "6": "7️⃣",
    "7": "8️⃣",
    "8": "9️⃣",
    "9": "🔟"
  };
  for (let i = 0; i < args[0]; i++) {
    await message.react(array[i]);
  }
}

/**
 * test if a poll is a number poll
 * @param {*} args 
 */
function isANumberPoll(args) {
  return args[0] < 11;
}

/**
 * Test if a message is a command for the bot
 * @param {*} message 
 */
function isNotACommand(message) {
  return !message.content.startsWith(prefix) || message.author.bot;
}

client.login(Config.DISCORD_CLIENT_TOKEN);

