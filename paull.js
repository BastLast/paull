/* jshint esversion: 10 */

const Discord = require("discord.js");
const client = new Discord.Client({ restTimeOffset: 0 });
const Config = require('./config');
const sql = require("sqlite");
const embed = new Discord.MessageEmbed();
const fs = require("fs")
const prefix = "?s";
const { CanvasRenderService } = require('chartjs-node-canvas');
sql.open("./database.sqlite");

/**
 * Will be executed whenever the bot has started
 */
client.on("ready", () => {
    console.log("Bot démarré :) " + client.guilds.cache.size + " serveurs !");
    createDatabase(sql);
    client.user
        .setActivity("?s 2 Vous allez bien ?")
        .catch(console.error);
});

/**
 * Will be executed each time the bot see a message
 */
client.on("message", async(message) => {

    if (message.mentions.users.last() && message.mentions.users.last().id == client.user.id) {
        let embed = new Discord.MessageEmbed();
        embed.setTitle(":information_source: Mon préfix est \"?s\"");
        embed.setDescription("Si vous avez besoin de plus d'assistance, rejoignez le discord d'aide : https://discord.gg/GWTFMQv");
        message.channel.send(embed);
    }

    if (isNotACommand(message)) return;

    let args = getArgs(message);
    if (argsIsNotValid(args)) {
        return sendArgsErrorMessage(message);
    }
    if (args[1] == undefined) {
        return sendQuestionErrorMessage(message);
    }
    let msg = await repostTheQuestion(message, args);
    await addReactions(args, msg);
    saveNewPoll(message, msg, args);
});

/**
 * Will be executed each time the bot see a new reaction
 */
client.on("messageReactionAdd", async(reaction) => {
    if (reactionIsOnApoll(reaction)) {
        let pollexist = await sql.get(`SELECT count(*) as number from poll where messageId = ${reaction.message.id}`);
        if (pollexist.number != 1) {
            embed.setTitle(":x: Erreur !");
            embed.setColor("#D92D43");
            embed.setDescription("Ce sondage est terminé !");
            return reaction.users.cache.last().send(embed);
        }
        deleteLastReaction(reaction);
        if (reaction.me) { // test if the reaction is part of the poll
            //if so, add it to the database
            if (reaction.emoji.name == "📜") {
                let pollauthorid = await sql.get(`select authorId as id from poll where messageId = ${reaction.message.id}`);
                if (reaction.users.cache.last().id == pollauthorid.id) {
                    sendingResults(reaction);

                } else {
                    errorStopingPoll(reaction);
                }
                return;
            }
            let numberOfVoteByThisUserOnThisPoll = await getNumberOfVote(reaction);
            if (numberOfVoteByThisUserOnThisPoll == 0) {
                saveVote(reaction);
                confirmVote(reaction);
            } else {
                updateVote(reaction);
                confirmChangeVote(reaction);
            }
            await updatePollMessage(reaction);
        }
    }
});

/**
 * used ot get the amount of vote ona poll and edit the message
 * @param {*} reaction 
 */
async function updatePollMessage(reaction) {
    let embedToEdit = reaction.message.embeds[0];
    let number = await sql.get(`select count(*) as number from vote where pollId = ${reaction.message.id}`).catch(console.error);
    number = number.number;
    embedToEdit.setDescription("Utilisez les réactions ci-dessous pour répondre à la question. Utilisez la réaction 📜 pour visionner les résultats si vous êtes l'initiateur du sondage\n\n" + number + " vote(s) reçu(s).");
    reaction.message.edit(embedToEdit);
}

/**
 * Send a dm to notify an error
 * 
 * @param {*} reaction 
 */
async function sendingResults(reaction) {
    let results = await getPoll(reaction);
    let resultsEmbed = generateEmbedBegining(reaction);
    const width = 400; //px
    const height = 200; //px
    const canvasRenderService = new CanvasRenderService(width, height, (Chart) => {
        Chart.plugins.register({
            beforeDraw: function(chartInstance) {
                var ctx = chartInstance.chart.ctx;
                ctx.fillStyle = "rgb(32, 34, 37)";
                ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
            }
        });
        Chart.defaults.global.defaultFontColor = 'white';
        Chart.defaults.global.defaultFontSize = 10;
        Chart.defaults.global.defaultFontFamily = 'Montserrat';
    });

    (async() => {
        let = possibleChoices = {
            "1": "1️⃣",
            "2": "2️⃣",
            "3": "3️⃣",
            "4": "4️⃣",
            "5": "5️⃣",
            "6": "6️⃣",
            "7": "7️⃣",
            "8": "8️⃣",
            "9": "9️⃣",
            "10": "🔟"
        };
        let choices = [],
            data = [];
        for (let i = 0; i + 1 <= results.numberOfOptions; i++) {
            choices.push(i + 1);
            let votes = await sql.get(`select count(*) as r from vote where pollId = ${reaction.message.id} and vote = "${array[i]}"`);
            data.push(votes.r);
        }
        const configuration = {
            type: 'bar',
            data: {
                labels: choices,
                datasets: [{
                    label: 'Nombre de Votes',
                    data: data,
                    backgroundColor: random_palette(),
                    borderWidth: 0
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        };

        const dataUrl = await canvasRenderService.renderToDataURL(configuration);
        let base64Image = dataUrl.split(';base64,').pop();
        fs.writeFile('chart.png', base64Image, { encoding: 'base64' }, function(err) {
            if (err)
                console.log(err);
        });

        resultsEmbed.attachFiles(['./chart.png'])
            .setImage("attachment://chart.png")
        reaction.message.channel.send(resultsEmbed);

        await sql.get(`delete from poll where messageId = ${reaction.message.id}`);
        await sql.get(`delete from vote where pollId = ${reaction.message.id}`);
    })();

}

/**
 * Returns a random color palette for the chart
 */
function random_palette() {
    const colors = {
        1: ["#f08080", "#f4978e", "#f8ad9d", "#fbc4ab", "#ffdab9", "#50514f", "#59ffa0", "#ffed65", "#93b7be", "#f1fffa"],
        2: ["#8a2100", "#621708", "#941b0c", "#bc3908", "#f6aa1c", "#ffe2d1", "#e1f0c4", "#6bab90", "#55917f", "#fefffe"],
        3: ["#efd9ce", "#dec0f1", "#b79ced", "#957fef", "#7161ef", "#26547c", "#ef476f", "#06d6a0", "#169873", "#190e4f"]
    };
    return colors[Math.floor(Math.random() * (3 - 1 + 1)) + 1];
}


/**
 * get the poll infos
 * @param {*} reaction 
 */
async function getPoll(reaction) {
    return await sql.get(`select * from poll where messageId = ${reaction.message.id}`);
}

/**
 * generate the start of the result embed
 * @param {*} reaction 
 */
function generateEmbedBegining(reaction) {
    let resultsEmbed = new Discord.MessageEmbed();
    resultsEmbed.setTitle(":scroll: Resultat du sondage : ");
    resultsEmbed.setColor("#FFD983");
    resultsEmbed.setDescription(`Cliquez **[ici](${reaction.message.url})** pour retrouver le sondage.\n`);
    return resultsEmbed;
}

/**
 * Send a dm to notify an error
 * 
 * @param {*} reaction 
 */
function errorStopingPoll(reaction) {
    embed.setTitle(":x: Vous ne pouvez pas terminer ce sondage.");
    embed.setColor("#D92D43");
    embed.setDescription("Veuillez contacter la personne l'ayant lancé");
    reaction.users.cache.last().send(embed);
}

/**
 * Send a dm to confirm the vote was changed
 * @param {*} reaction 
 */
function confirmChangeVote(reaction) {
    embed.setTitle(":information_source: Votre vote a été modifié !");
    embed.setColor("#3B88C3");
    embed.setDescription("Vous votez désormais pour l'option " + reaction.emoji.name + ". Pour modifier (encore ?!) votre vote, cliquez sur un autre choix.");
    reaction.users.cache.last().send(embed);
}

/**
 * Send a dm to confirm the vote was saved
 * @param {*} reaction 
 */
function confirmVote(reaction) {
    embed.setTitle(":white_check_mark: Votre vote a été enregistré !");
    embed.setColor("#77B255");
    embed.setDescription("Vous avez voté pour l'option " + reaction.emoji.name + ". Pour modifier votre vote, cliquez sur un autre choix.");
    reaction.users.cache.last().send(embed);
}

async function getNumberOfVote(reaction) {
    let numberOfVoteByThisUserOnThisPoll = await sql.get(`select count(*) as number from vote where	authorId = ${reaction.users.cache.last().id} and pollId = ${reaction.message.id}`).catch(console.error);
    numberOfVoteByThisUserOnThisPoll = numberOfVoteByThisUserOnThisPoll.number;
    return numberOfVoteByThisUserOnThisPoll;
}

/**
 * check if the reaction has to be considered
 * @param {*} reaction 
 */
function reactionIsOnApoll(reaction) {
    return !reaction.users.cache.last().bot && reaction.message.author.id == client.user.id;
}

/**
 * delete the last reaction that was added
 * @param {*} reaction 
 */
function deleteLastReaction(reaction) {
    reaction.users.remove(reaction.users.cache.last());
}

/**
 * Save the vote to the database
 * @param {*} reaction 
 */
function saveVote(reaction) {
    sql.run(`INSERT INTO vote (pollId, authorId, vote) VALUES (${reaction.message.id},${reaction.users.cache.last().id},"${reaction.emoji.name}")`).catch(console.error);
}

/**
 * update the vote to the database
 * @param {*} reaction 
 */
function updateVote(reaction) {
    sql.run(`UPDATE vote set vote = "${reaction.emoji.name}" WHERE authorId = ${reaction.users.cache.last().id} and pollId = ${reaction.message.id}`).catch(console.error);
}

/**
 * Create the poll message
 * @param {*} message 
 * @param {*} args 
 */
async function repostTheQuestion(message, args) {
    let question = getQuestion(message, args);
    embed.setTitle(question);
    embed.setColor("#006D68");
    embed.setDescription("Utilisez les réactions ci-dessous pour répondre à la question. Utilisez la réaction 📜 pour visionner les résultats si vous êtes l'initiateur du sondage.");
    let msg;
    try {
        msg = await message.channel.send(embed);
    } catch {
        embed.setTitle(":x: Erreur !");
        embed.setColor("#D92D43");
        embed.setDescription("La taille limite d'une question est de 256 caractères.");
        msg = await message.channel.send(embed);
    }
    message.delete();
    return msg;
}

/**
 * add the reactions under the message
 * @param {*} args 
 * @param {*} msg 
 */
async function addReactions(args, msg) {
    await reactWithNumber(args, msg);
    msg.react("📜");
}

/**
 * Save a new poll in the database
 * @param {*} message 
 * @param {*} msg
 * @param {*} args 
 */
function saveNewPoll(message, msg, args) {
    sql.run(`INSERT INTO poll (messageId, time, numberOfOptions,authorId) VALUES (${msg.id},${message.createdTimestamp},${args[0]},${message.author.id}) `).catch(console.error);
}

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
async function sendArgsErrorMessage(message) {
    embed.setTitle(":x: Erreur !");
    embed.setColor("#D92D43");
    embed.setDescription("Veuillez choisir un nombre d'options compris entre 2 et 10 : `?s [nombre d'option] Question`");
    return message.channel.send(embed);
}

/**
 * display an error
 * @param {*} message 
 */
async function sendQuestionErrorMessage(message) {
    embed.setTitle(":x: Erreur !");
    embed.setColor("#D92D43");
    embed.setDescription("Veuillez indiquer une question : `?s [nombre d'option] Question`");
    return message.channel.send(embed);
}

/**
 * test the validitu of the args
 * @param {*} args 
 */
function argsIsNotValid(args) {
    return parseInt(args[0]) < 2 || parseInt(args[0]) > 10 || isNaN(parseInt(args[0]));
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
 * This function create the database
 * @param sql - a sqlite file.
 */
function createDatabase(sql) {
    //first check if the database is not already there
    sql.get(`SELECT version FROM database`).catch(() => {
        sql.run("CREATE TABLE IF NOT EXISTS vote (pollId INTEGER, authorId INTEGER, vote TEXT)").catch(console.error);
        sql.run("CREATE TABLE IF NOT EXISTS poll (messageId INTEGER, time INTEGER, numberOfOptions INTEGER, authorId INTEGER)").catch(console.error);
        sql.run("CREATE TABLE IF NOT EXISTS database (version TEXT)").then(() => {
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