var telebot = require('node-telegram-bot');
var cleverbot = require('cleverbot.io');
// Configure your tokens in config.json
var config = require('./config.json');

// Basic session data store
var sessions = {};

var CLEVER_USER = config.CLEVERBOT_USER,
    CLEVER_KEY = config.CLEVERBOT_KEY;

var telegram_bot = new telebot({
    token: config.TELEGRAM_TOKEN
})
.enableAnalytics(config.BOTANIO_TOKEN)
.on('message', function (message) {
    if (message.text == "/help")
    {
        telegram_bot.sendMessage({
            chat_id: message.chat.id,
            text: 'This is a simple Telegram bot that asks your questions to Cleverbot ' +
                    'and sends you back the response. The original TeleCleverBot is created by ' +
                    '@wsloth and open source on Github: https://github.com/wsloth/telegram-cleverbot ' +
                    '\n Thank you for using this bot!'
        });
        return;
    }
    
    // Register user in current session with Cleverbot
    if (!(message.from.id in sessions))
    {
        sessions[message.from.id] = new cleverbot(CLEVER_USER, CLEVER_KEY);
        sessions[message.from.id].setNick("telegram_clever_bot." + message.from.id + "");
        sessions[message.from.id].create(function (err, session) {
            if (err)
            {
                telegram_bot.sendMessage({
                    chat_id: message.chat.id,
                    text: 'Something went wrong! Please try again later, or contact the developer ' + config.DEV_NAME
                });
                return;
            }
            console.log("New session created. Currently there's " + Object.keys(sessions).length + " active session(s).");
            console.log("Session nickname: \"" + session + "\"");
        });
    }

    // "Typing..." indication while Cleverbot thinks
    telegram_bot.sendChatAction({
        chat_id: message.chat.id,
        action: 'typing'
    });
    
    // Ask the question to Cleverbot.io
    sessions[message.from.id].ask(message.text, function (err, response) {
        if (err)
        {
            telegram_bot.sendMessage({
                chat_id: message.chat.id,
                text: 'Something went wrong! Please try again later, or contact the developer ' + config.DEV_NAME
            });
            return;
        }
        
        // Return the response
        telegram_bot.sendMessage({
            chat_id: message.chat.id,
            text: response
        });
    });
})
.start();