require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Erstellt einen neuen Discord-Client mit den erforderlichen Berechtigungen
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Event: Bot ist bereit
client.once('ready', () => {
    console.log(`✅ Bot ist online als ${client.user.tag}`);
});

// Event: Bot reagiert auf Nachrichten
client.on('messageCreate', (message) => {
    if (message.author.bot) return; // Ignoriert Nachrichten von Bots

    if (message.content.toLowerCase() === 'hallo bot') {
        message.reply('Hallo! 😊');
    }
});

// Starte den Bot
client.login(process.env.TOKEN);