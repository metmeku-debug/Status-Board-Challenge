require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
    const firstName = ctx.from.first_name || 'there';
    const button = [Markup.button.url('Open the MIni app', 'https://t.me/status_boardbot/challenge')];
    ctx.reply(`Hello ${firstName}! Welcome to Status Board, Use /latest to see recent statuses.`, Markup.inlineKeyboard(button));
});

bot.command('latest', async (ctx) => {
    try {
        const snapshot = await db
            .collection('statuses')
            .orderBy('timestamp', 'desc')
            .limit(3)
            .get();

        if (snapshot.empty) {
            return ctx.reply('No statuses posted yet.');
        }

        const messages = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            messages.push(`${data.name}: ${data.status}`);
        });

        ctx.reply(`Latest statuses:\n\n${messages.join('\n\n')}`);
    } catch (error) {
        console.error('Error fetching latest statuses:', error);
        ctx.reply('Sorry, something went wrong fetching the latest statuses.');
    }
});

bot.command('mystatus', async (ctx) => {
    try {
        const userId = ctx.from.id;
        const snapshot = await db
            .collection('statuses')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(3)
            .get();

        if (snapshot.empty) {
            return ctx.reply('You have not posted any statuses yet.');
        }

        const messages = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            messages.push(data.status);
        });

        ctx.reply(`Your last statuses:\n\n${messages.join('\n\n')}`);
    } catch (error) {
        console.error('Error fetching user statuses:', error);
        ctx.reply('Sorry, something went wrong fetching your statuses.');
    }
});

bot.launch();
console.log('Bot started with Firebase integration');