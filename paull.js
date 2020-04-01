const Discord = require("discord.js");
const client = new Discord.Client();
const Config = require('./config');
const sql = require("sqlite");
sql.open("./database.sqlite");

/**
 * Will be executed whenever the bot has started
 */
client.on("ready", () => {
  console.log("Bot démarré :)")
  createDatabase(sql);
});


const prefix = "?s";

client.on("message", async (message) => {

  if (isNotACommand(message)) return;

  let args = message.content.slice(prefix.length).trim().split(/ +/g);
  if (isANumberPoll(args)) {
    await reactWithNumber(args, message);
  } else {
    await reactWithYesNo(message);
  }
});


client.on("messageReactionAdd", async (reaction) => {

});

async function reactWithYesNo(message) {
  await message.react("✅"),
    message.react("❌");
}

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
  * This function create the database
  * @param sql - a sqlite file.
  */
function createDatabase(sql) {
  //first check if the database is not already there
  sql.get(`SELECT version FROM database`).catch(() => {
    sql.run("CREATE TABLE IF NOT EXISTS poll (messageId TEXT, time INTEGER, numberOfOptions INTEGER, one INTEGER, two INTEGER, three INTEGER, four INTEGER, five INTEGER, six INTEGER, seven INTEGER, eight INTEGER, nine INTEGER, ten INTEGER)").catch(console.error);
    sql.run("CREATE TABLE IF NOT EXISTS database (version TEXT, lastReset INTEGER)").then(() => {
      sql.run(`INSERT INTO database (version, lastReset) VALUES (\"${Config.version}\",0)`).then(() => {
        console.log("... Generation Complete !");
      });
    });
  }).then(() => {
    //the database is ok
    console.log('... Database is valid !');
  });

}


/**
 * Test if a message is a command for the bot
 * @param {*} message 
 */
function isNotACommand(message) {
  return !message.content.startsWith(prefix) || message.author.bot;
}

client.login(Config.DISCORD_CLIENT_TOKEN);

