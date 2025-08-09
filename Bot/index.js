require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);
const API_BASE = 'https://arrogant-chloe-metmeku-dab124e3.koyeb.app';

bot.start((ctx) => {
    const firstName = ctx.from.first_name || 'there';
    const button = [Markup.button.url("What's on your mind today ?", 'https://t.me/status_boardbot/challenge')];
    ctx.reply(`Hello ${firstName}! Welcome to Status Board, Use /latest to see recent statuses.`, Markup.inlineKeyboard(button));
});

bot.command('latest', async (ctx) => {
    console.log('latest command fire.')
    try {
        console.log('about to send fetch');
        const res = await fetch(`${API_BASE}/latest`);

        if (!res.ok) throw new Error('Failed to fetch latest statuses');

        const data = await res.json();

        const messages = [];
        console.log('data is', data);
        data.forEach((post) => {
            messages.push(`${post.name || 'anonymous'}: ${post.status}`);
        });

        ctx.reply(`📢 Latest statuses:\n\n${messages.join('\n\n')}`);
    } catch (error) {
        console.error('Error fetching latest statuses:', error);
        ctx.reply('Sorry, something went wrong fetching the latest statuses.');
    }
});

bot.command('mystatus', async (ctx) => {
    try {
        const userId = ctx.from.id;
        if (!userId) return ctx.reply('User ID not found.');

        const res = await fetch(`${API_BASE}/mystatus`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });

        if (!res.ok) throw new Error('Failed to fetch your statuses.');

        const data = await res.json();

        const button = [Markup.button.url("What's on your mind today ?", 'https://t.me/status_boardbot/challenge')];

        if (!data.length) return ctx.reply('You have not posted any statuses yet.', Markup.inlineKeyboard(button));

        const messages = data.map(post => post.status);

        ctx.reply(`📢 Your last statuses:\n\n${messages.join('\n\n')}`);
    } catch (error) {
        console.error('Error fetching user statuses:', error);
        ctx.reply('Sorry, something went wrong fetching your statuses.');
    }
});

bot.telegram.setMyCommands([
    { command: 'start', description: 'Start the bot and see welcome message' },
    { command: 'latest', description: 'View the 3 most recent statuses' },
    { command: 'mystatus', description: 'View your last 3 statuses' },
]);


bot.launch();
console.log('Bot started with Firebase integration');