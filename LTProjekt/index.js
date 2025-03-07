require('dotenv').config(); // Lädt die .env-Datei
var colors = require('colors');

///////////////MODULES///////////////
const config = require("./config.json");
const { Client, Collection } = require("discord.js");
const Discord = require('discord.js'); 
const fs = require("fs");
const DisTube = require("distube");
const Canvas = require('canvas');

Canvas.registerFont("Genta.ttf", { family: "Genta" }); // Schriftart laden

// Erstelle den Discord-Client
const client = new Client({
    messageCacheLifetime: 60,
    fetchAllMembers: false,
    messageCacheMaxSize: 10,
    shards: "auto",
    shardCount: 5,
    disableEveryone: true,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

client.commands = new Collection();
client.queue = new Map();
client.aliases = new Collection();
const cooldowns = new Collection();

// Audio-Setup mit DisTube
client.distube = new DisTube(client, {
    youtubeCookie: config.cookie,
    searchSongs: false,
    emitNewSongOnly: true,
    highWaterMark: 1024*1024*64,
    leaveOnEmpty: true,
    leaveOnFinish: true,
    leaveOnStop: true,
    youtubeDL: true,
    updateYouTubeDL: false,
    customFilters: config.customs
});

client.setMaxListeners(0);
require('events').defaultMaxListeners = 0;

// Lade externe Handler
client.categories = fs.readdirSync("./commands/");
["command"].forEach(handler => {
    require(`./handlers/${handler}`)(client);
});
require("./handlers/slashcommands")(client);
require("./handlers/setups")(client);

// Lade Module
require("./modules/ranking")(client);
require("./modules/counter")(client);
require("./modules/chatbot")(client);
require("./modules/jointocreate")(client);
require("./modules/simpleticketmodule")(client);
require("./modules/welcomeleavesytem")(client);
require("./modules/membercount")(client);
require("./modules/reactionrole")(client);
require("./modules/apply")(client);
require("./modules/radiomodule")(client, "738019408982573137", "738019409527963682");
require("./modules/logger").all(client);

const functions = require("./functions");

// Setze die Datenbank auf
const Enmap = require("enmap");
client.settings = new Enmap({ name: "settings", dataDir: "./databases/settings" });
client.setups = new Enmap({ name: "setups", dataDir: "./databases/setups" });
client.infos = new Enmap({ name: "infos", dataDir: "./databases/infos" });
client.custom = new Enmap({ name: "custom", dataDir: "./databases/playlist" });
client.custom2 = new Enmap({ name: "custom2", dataDir: "./databases/playlist2" });
client.points = new Enmap({ name: "points", dataDir: "./databases/ranking" });
client.reactionrole = new Enmap({ name: "reactionrole", dataDir: "./databases/reactionrole" });
client.apply = new Enmap({ name: "apply", dataDir: "./databases/apply" });

// Event-Handler für Nachrichten
client.on("message", async message => {
    if (message.author.bot || !message.guild) return;

    // Prefix abrufen
    let prefix = client.settings.get(message.guild.id, `prefix`);
    if (!prefix) prefix = config.prefix;

    // Falls der Bot erwähnt wird
    if (!message.content.startsWith(prefix) && message.content.includes(client.user.id)) {
        message.reply(
            new Discord.MessageEmbed()
                .setColor(config.colors.yes)
                .setAuthor(
                    `${message.author.username}, Mein Prefix ist ${prefix}, um zu starten: ${prefix}help`,
                    message.author.displayAvatarURL({ dynamic: true })
                )
        );
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    if (cmd.length === 0) return;
    let command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));

    if (command) {
        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 2) * 1000;

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(
                    `Bitte warte ${timeLeft.toFixed(1)} Sekunden, bevor du \`${command.name}\` erneut benutzt.`
                );
            }
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        client.infos.set("global", Number(client.infos.get("global", "cmds")) + 1, "cmds");

        try {
            command.run(client, message, args, prefix);
        } catch (error) {
            console.error(error.toString().red);
            functions.embedbuilder(client, 5000, message, "RED", "Fehler: ", `\`\`\`${error.toString().substr(0, 100)}\`\`\`\n\n**Der Fehler wurde an meinen Owner gesendet!**`);
            functions.errorbuilder(error.stack.toString().substr(0, 2000));
        }
    } else {
        return message.reply(`Unbekannter Befehl, versuche: ${prefix}help`);
    }
});

// 🔒 Token jetzt sicher aus `.env` laden!
client.login(process.env.TOKEN);