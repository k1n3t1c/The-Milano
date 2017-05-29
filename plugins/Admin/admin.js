// Load
try {
    var Config = require("../../config.json");
    var Module = require("../modules.js");
    var fs = require('fs');
} catch (err) { }

exports.commands = [
    "setUsername",
    "alias",
    "aliases",
    "ping",
    "invokeint",
    "invokedel",
    "prune",
    "idle",
    "online",
    "say",
    "announce",
    "msg",
    "eval"
]

var startTime = Date.now();

exports.setUsername = {
	description: "sets the username of the bot.",
	process: function(bot,msg,suffix) {
		bot.user.setUsername(suffix);
	}
}
exports.alias = {
    usage: "<name> <actual command>",
        description: "Creates command aliases. Useful for making simple commands on the fly",
        process: function (bot, msg, suffix) {
                var args = suffix.split(" ");
                var name = args.shift();
                if (!name) {
                    msg.channel.sendMessage(Config.commandPrefix + "alias " + this.usage + "\n" + this.description);
                } else if (commands[name] || name === "help") {
                    msg.channel.sendMessage("overwriting commands with aliases is not allowed!");
                } else {
                    var command = args.shift();
                    aliases[name] = [command, args.join(" ")];
                    //now save the new alias
                    require("fs").writeFile("./alias.json", JSON.stringify(aliases, null, 2), null);
                    msg.channel.sendMessage("created alias " + name);
                }
            }
}
exports.aliases = {
    description: "lists all recorded aliases",
        process: function (bot, msg, suffix) {
            var text = "";
            for (var a in aliases) {
                if (typeof a === 'string')
                    text += a + "\n";
            }
            Module.sendMessage(bot, "Current Aliases", msg, text, null, null);
        }
}
exports.ping = {
    description: "responds pong, useful for checking if bot is alive",
        process: function (bot, msg, suffix) {
            var message = msg.author + " pong!";
            Module.sendMessage(bot, "Ping-Pong!", msg, message, null, null);
        }
}
exports.invokeint = {
    description: "sets the interval for deletion of invoked messages",
        process: function (bot, msg, suffix) {
            var value;
            value = parseInt(suffix);
            if (isNaN(value)) {
                Module.sendMessage(bot, "Please use numbers!", msg, "Only accepts integer values!", null, 0xFF0000);
                return;
            }
            Config.Settings.delete_interval = value;
            var message = "This command sets the interval in ms how long it takes to delete it's own invoked messages.";
            var fields = [];
            fields.push("Interval Rate (ms)");
            fields.push("**" + value + "**");
            Module.sendMessage(bot, "Set Invoke Interval", msg, message, fields, null);
            fs.writeFile("../../config.json", JSON.stringify(Config, null, 2));
        }
}
exports.invokedel = {
    description: "deletes invoked messages.",
        process: function (bot, msg, suffix) {
            var message = "This command enables/disables deletion of messages on command invocation.\n"
            if (Config.Settings.delete_invoke) {
                Config.Settings.delete_invoke = false;
                var fields = [];
                fields.push("Status");
                fields.push("**DISABLED**")
                Module.sendMessage(bot, "Delete Invoked Commands", msg, message, fields, 0xFF0000)
            } else {
                Config.Settings.delete_invoke = true;
                var fields = [];
                fields.push("Status");
                fields.push("**ENABLED**")
                Module.sendMessage(bot, "Delete Invoked Commands", msg, message, fields, null)
            }
            fs.writeFile("../../config.json", JSON.stringify(Config, null, 2));
        }
}
exports.prune = {
    description: "prunes messages.",
        process: function(bot, msg, suffix) {
            var value;
            value = 50;
            value = parseInt(suffix);
            if (isNaN(value)) {
                console.log("Please note that prune without a number will delete up to 50 messages.\nYou can run prune 10 to delete 10 messages.");
            }
            var message = "You or the Bot don't have the permission to execute this command! Check your console! \"" + msg.content + "\"";
            if (!Config.Permissions.checkPermission(msg.author, "prune")) {
                Module.sendMessage(bot, "Permissions", msg, message, null, 0xFF0000);
                console.log("You(user) don't have the permission to execute a prune!");
                return;
            } else if (!Config.Permissions.checkPermission(bot.user, "MANAGE_MESSAGES")) {
                Module.sendMessage(bot, "Permissions", msg, message, null, null);
                console.log("Bot does not have the permission to execute a prune!");
                return;
            }

            if (msg.channel.type == 'text') {
                msg.channel.fetchMessages({ limit: value }).then(messages => {
                    msg.channel.bulkDelete(messages);
                    messagesDeleted = messages.array().length;
                    var desc = "Successfully deleted " + messagesDeleted + " messages.";
                    Module.sendMessage(bot, "Bulk Deletion", msg, desc);
                    console.log("Deletion of messages successful. Total messages deleted: " + messagesDeleted);
                }).catch(err => {
                    console.log("Error while doing a bulk delete");
                    console.log(err);
                });
            }
        }
}
exports.idle = {
    usage: "[status]",
        description: "sets bot status to idle",
            process: function(bot, msg, suffix) {
                Client.user.setStatus("idle");
                Client.user.setGame(suffix);
            }
}
exports.online = {
    usage: "[status]",
        description: "sets bot status to online",
            process: function(bot, msg, suffix) {
                Client.user.setStatus("online");
                Client.user.setGame(suffix);
            }
}
exports.say = {
    usage: "<message>",
        description: "bot says message",
            process: function(bot, msg, suffix) {
                msg.channel.sendMessage(suffix);
            }
}
exports.announce = {
    usage: "<message>",
        description: "bot says message with text to speech",
            process: function(bot, msg, suffix) {
                msg.channel.sendMessage(suffix, { tts: true });
            }
}
exports.msg = {
    usage: "<user> <message to leave user>",
        description: "leaves a message for a user the next time they come online",
            process: function(bot, msg, suffix) {
                var args = suffix.split(' ');
                var user = args.shift();
                var message = args.join(' ');
                if (user.startsWith('<@')) {
                    user = user.substr(2, user.length - 3);
                }
                var target = msg.channel.guild.fetchMember(user, true);
                messagebox[target.id] = {
                    channel: msg.channel.id,
                    content: target + ", " + msg.author + " said: " + message
                };
                updateMessagebox();
                msg.channel.sendMessage("message saved.")
            }
}
exports.eval = {
    usage: "<command>",
        description: 'Executes arbitrary javascript in the bot process. User must have "eval" permission',
            process: function(bot, msg, suffix) {
                if (Config.Permissions.checkPermission(msg.author, "eval")) {
                    msg.channel.sendMessage(eval(suffix, bot));
                } else {
                    msg.channel.sendMessage(msg.author + " doesn't have permission to execute eval!");
                }
            }
}