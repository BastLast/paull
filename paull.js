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

  let args = getArgs(message);
  if (argsIsNotValid(args)) {
    return sendArgsErrorMessage(message)
  }
  if (args[1] == undefined) {
    return sendQuestionErrorMessage(message)
  }
  let question = getQuestion(message, args);
  let msg = await message.channel.send(question);
  if (isANumberPoll(args)) {
    await reactWithNumber(args, msg);
  } else {
    await reactWithYesNo(msg);
  }
  sql.run(`INSERT INTO poll (messageId, time, numberOfOptions, one, two, three, four, five, six, seven, eight, nine, ten) VALUES (${message.id},${message.createdTimestamp},${args[0]},0,0,0,0,0,0,0,0,0,0) `).catch(console.error);
});


client.on("messageReactionAdd", async (reaction) => {

});

/**
 * get the question in a string
 * @param {*} message 
 * @param {*} args 
 */
function getQuestion(message, args) {
  return message.content.slice(prefix.length).trim().slice(args[0].length);
}

/**
 * get an array of the args of the command
 * @param {*} message 
 */
function getArgs(message) {
  return message.content.slice(prefix.length).trim().split(/ +/g);
}

/**
 * display an error
 * @param {*} message 
 */
function sendArgsErrorMessage(message) {
  return message.channel.send(":x: Veuillez choisir un nombre d'options compris entre 2 et 10 : `?s [nombre d'option] Question`");
}

/**
 * display an error
 * @param {*} message 
 */
function sendQuestionErrorMessage(message) {
  return message.channel.send(":x: Veuillez indiquer une question : `?s [nombre d'option] Question`");
}

/**
 * test the validitu of the args
 * @param {*} args 
 */
function argsIsNotValid(args) {
  return args[0] < 2 || args[0] > 10;
}

/**
 * test if the bot has a two choice poll
 * @param {*} message 
 */
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
  return args[0] < 11 && args[0] > 2;
}

/**
  * This function create the database
  * @param sql - a sqlite file.
  */
function createDatabase(sql) {
  //first check if the database is not already there
  sql.get(`SELECT version FROM database`).catch(() => {
    sql.run("CREATE TABLE IF NOT EXISTS poll (messageId INTEGER, time INTEGER, numberOfOptions INTEGER, one INTEGER, two INTEGER, three INTEGER, four INTEGER, five INTEGER, six INTEGER, seven INTEGER, eight INTEGER, nine INTEGER, ten INTEGER)").catch(console.error);
    sql.run("CREATE TABLE IF NOT EXISTS database (version TEXT, lastReset INTEGER)").then(() => {
      sql.run(`INSERT INTO database (version) VALUES (1)`).then(() => {
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

