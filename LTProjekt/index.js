require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates // WICHTIG für DisTube!
    ],
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
client.cooldowns = new Collection();

// Audio-Setup mit DisTube
const { DisTube } = require("distube"); // Richtig für DisTube v4

client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    leaveOnFinish: true,
    leaveOnStop: true
});
console.log("TOKEN:", process.env.TOKEN ? "✅ Token gefunden" : "❌ Kein Token gefunden!");
client.login(process.env.TOKEN);