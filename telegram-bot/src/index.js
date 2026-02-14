const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const apiUrl = process.env.API_URL || "http://backend:8000";
const webAppUrl = process.env.WEB_APP_URL || "https://your-growthkit-domain.com";

if (!token) {
  console.error("BOT_TOKEN is required");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "GrowthKit — ваш стратег роста в Telegram.", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Открыть GrowthKit",
            web_app: { url: webAppUrl },
          },
        ],
      ],
    },
  });
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith("/")) return;
  bot.sendMessage(chatId, "Используйте кнопку выше для входа в приложение.");
});
