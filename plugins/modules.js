// Load Config
try {
    var Config = require("../config.json");
    var Milano = require("../milano.js");
} catch (err) { }

// Aliases
var aliases;
try {
    aliases = require("./alias.json");
} catch (err) {
    // No aliases defined
    aliases = {};
}

exports.sendMessage = function (client, header, msg, desc, field, col) {
    if (col == null) { col = 3447003; }
    if (Config.Settings.delete_invoke) {
        if (field == null) {
            msg.channel.sendMessage({
                "embed": {
                    color: col,
                    author: {
                        name: client.user.username,
                        icon_url: client.user.avatarURL
                    },
                    title: header,
                    description: desc,
                    timestamp: new Date(),
                    footer: {
                        icon_url: client.user.avatarURL,
                        text: "© Milano"
                    }
                }
            }).then((msg => msg.delete(Config.Settings.delete_interval)));
        } else {
            msg.channel.sendMessage({
                "embed": {
                    color: col,
                    author: {
                        name: client.user.username,
                        icon_url: client.user.avatarURL
                    },
                    fields: [{
                        name: field[0],
                        value: field[1]
                    }],
                    title: header,
                    description: desc,
                    timestamp: new Date(),
                    footer: {
                        icon_url: client.user.avatarURL,
                        text: "© Milano"
                    }
                }
            }).then((msg => msg.delete(Config.Settings.delete_interval)));
        }
    } else {
        if (field == null) {
            msg.channel.sendMessage({
                "embed": {
                    color: col,
                    author: {
                        name: client.user.username,
                        icon_url: client.user.avatarURL
                    },
                    title: header,
                    description: desc,
                    timestamp: new Date(),
                    footer: {
                        icon_url: client.user.avatarURL,
                        text: "© Milano"
                    }
                }
            });
        } else {
            msg.channel.sendMessage({
                "embed": {
                    color: col,
                    author: {
                        name: client.user.username,
                        icon_url: client.user.avatarURL
                    },
                    fields: [{
                        name: field[0],
                        value: field[1]
                    }],
                    title: header,
                    description: desc,
                    timestamp: new Date(),
                    footer: {
                        icon_url: client.user.avatarURL,
                        text: "© Milano"
                    }
                }
            });
        }
    }
}


exports.checkMessageForCommand = function(Client, msg, isEdit) {
    if (msg.author.id != Client.user.id && (msg.content.startsWith(Config.Settings.prefix))) {
        console.log("Message Content as Command: " + msg.content + "\nFrom: " + msg.author + "\n");
        var cmdTxt = msg.content.split(" ")[0].substring(Config.Settings.prefix.length);
        var suffix = msg.content.substring(cmdTxt.length + Config.Settings.prefix.length + 1);//add one for the ! and one for the space
        if (msg.isMentioned(Client.user)) {
            try {
                cmdTxt = msg.content.split(" ")[1];
                suffix = msg.content.substring(Client.user.mention().length + cmdTxt.length + Config.Settings.prefix.length + 1);
            } catch (e) { //no command
                msg.channel.sendMessage("Hi, you called?");
                return;
            }
        }
        alias = aliases[cmdTxt];
        if (alias) {
            console.log(cmdTxt + " is an alias, constructed command is " + alias.join(" ") + " " + suffix);
            cmdTxt = alias[0];
            suffix = alias[1] + " " + suffix;
        }
        var cmd = commands[cmdTxt];
        if (cmdTxt === "help") {
            if (suffix) {
                var cmds = suffix.split(" ").filter(function (cmd) { return commands[cmd] });
                var info = "";
                for (var i = 0; i < cmds.length; i++) {
                    var cmd = cmds[i];
                    info += "**" + Config.Settings.prefix + cmd + "**";
                    var usage = commands[cmd].usage;
                    if (usage) {
                        info += " " + usage;
                    }
                    var description = commands[cmd].description;
                    if (description instanceof Function) {
                        description = description();
                    }
                    if (description) {
                        info += "\n\t" + description;
                    }
                    info += "\n"
                }
                sendMessage(Client, "Command Help", msg, info, null, null);
            } else {
                var batch = "";
                var sortedCommands = Object.keys(commands).sort();
                for (var i in sortedCommands) {
                    var cmd = sortedCommands[i];
                    var info = "**" + Config.Settings.prefix + cmd + "**";
                    var usage = commands[cmd].usage;
                    if (usage) {
                        info += " " + usage;
                    }
                    var description = commands[cmd].description;
                    if (description instanceof Function) {
                        description = description();
                    }
                    if (description) {
                        info += "\n\t" + description;
                    }
                    var newBatch = batch + "\n" + info;
                    if (newBatch.length > (1024 - 8)) {
                        msg.author.sendMessage(batch);
                        batch = info;
                    } else {
                        batch = newBatch
                    }
                }
                if (batch.length > 0) {
                    sendMessage(Client, "**Available Commands**", msg, batch, null, null)
                }
            }
        }
        else if (cmd) {
            if (Config.Permissions.checkPermission(msg.author, cmdTxt)) {
                try {
                    cmd.process(Client, msg, suffix, isEdit);
                } catch (e) {
                    var msgTxt = "command " + cmdTxt + " failed :(";
                    if (Config.Settings.debug) {
                        msgTxt += "\n" + e.stack;
                    }
                    msg.channel.sendMessage(msgTxt);
                }
            } else {
                msg.channel.sendMessage("You are not allowed to run " + cmdTxt + "!");
            }
        } else {
            msg.channel.sendMessage(cmdTxt + " not recognized as a command!").then((message => message.delete(Config.Settings.delete_interval)))
        }
    } else {
        if (msg.author == Client.user) {
            return;
        }
        if (msg.author != Client.user && msg.isMentioned(Client.user)) {
            msg.channel.sendMessage(msg.author + ", you called?");
        } else { }
    }
}


// Add Command(s)
var commands = {};
exports.addCommand = function (commandName, commandObject) {
    try {
        commands[commandName] = commandObject;
    } catch (err) {
        console.log(err);
    }
}
exports.commandCount = function () {
    return Object.keys(commands).length;
}