var fs = require('fs');

try {
	var Discord = require("discord.js");
	var Client = new Discord.Client();
} catch (err) {
	console.log(err.stack);
	console.log(process.version);
	console.log("Please run npm install first!");
	process.exit();
}
console.log("Starting The Milano...\nNode version: " + process.version + "\nDiscord.js version: " + Discord.version);

// Load Config & Permissions
try {
	var Config = require("./config.json");
	var rootCommands = ["eval", "setUsername"];
	for (var i = 0; i < rootCommands.length; i++) {
        	var command = rootCommands[i];
        	if (!Config.Permissions.global.hasOwnProperty(command)) {
               		Config.Permissions.global[command] = false;
        	}
	}
	if (!Config.Settings.hasOwnProperty("prefix")) {
		Config.Settings.prefix = "!";
	}
} catch (err) {
	try {
		if (fs.lstatSync("./config.json").isFile()) {
			console.log("WARNING: config.json found, but the bot couldn't read it!\n" + err.stack);
		}
	} catch (e2) {
		console.log(e2.stack);
	}
	console.log("Create a config.json like the config.json.example.");
}
Config.Permissions.checkPermission = function (user,permission){
try {
        var allowed = true;
        try{
                if(Config.Permissions.global.hasOwnProperty(permission)){
                        allowed = Config.Permissions.global[permission] === true;
                }
        } catch(e){}
        try{
                if(Config.Permissions.users[user.id].hasOwnProperty(permission)){
                        allowed = Config.Permissions.users[user.id][permission] === true;
                }
        } catch(e){}
        return allowed;
} catch(e) {}
        return false;
}

fs.writeFile("./config.json",JSON.stringify(Config,null,2));


// Aliases
var aliases;
try {
	aliases = require("./alias.json");
} catch (err) {
	// No aliases defined
	aliases = {};
}


// Login
if (Config.Authentication.bot_token) {
        console.log("Logging in with Token given...");
        Client.login(Config.Authentication.bot_token);
} else {
        console.log("Logging in with user credential is no longer supported for BOTS!\nYou have to use a token based login");
}

// Bot ON (ready)
Client.on("ready", function() {
	console.log("Logged in!\nUsername: " + Client.user.username + "\nGuilds: " + Client.guilds.array().length + " servers");
	require("./plugins.js").init();
	console.log("Type " + Config.Settings.prefix + "help in Discord for a commands list.");
	Client.user.setGame(Config.Settings.prefix + "help | " + Client.guilds.array().length + " Servers");
});

function sendMessage(client, header, msg, desc, field, col) {
	if (col==null) { col = 3447003; }
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

function checkMessageForCommand(msg, isEdit) {
	if(msg.author.id != Client.user.id && (msg.content.startsWith(Config.Settings.prefix))){
		console.log("Message Content as Command: " + msg.content + "\nFrom: " + msg.author + "\n");
		var cmdTxt = msg.content.split(" ")[0].substring(Config.Settings.prefix.length);
		var suffix = msg.content.substring(cmdTxt.length+Config.Settings.prefix.length+1);//add one for the ! and one for the space
		if(msg.isMentioned(Client.user)){
			try {
				cmdTxt = msg.content.split(" ")[1];
				suffix = msg.content.substring(Client.user.mention().length+cmdTxt.length+Config.Settings.prefix.length+1);
			} catch(e){ //no command
				msg.channel.sendMessage("Hi, you called?");
				return;
			}
		}
		alias = aliases[cmdTxt];
		if(alias){
			console.log(cmdTxt + " is an alias, constructed command is " + alias.join(" ") + " " + suffix);
			cmdTxt = alias[0];
			suffix = alias[1] + " " + suffix;
		}
		var cmd = commands[cmdTxt];
		if(cmdTxt === "help") {
					if(suffix) {
						var cmds = suffix.split(" ").filter(function(cmd){return commands[cmd]});
						var info = "";
						for(var i=0;i<cmds.length;i++) {
							var cmd = cmds[i];
							info += "**"+Config.Settings.prefix + cmd+"**";
							var usage = commands[cmd].usage;
							if(usage){
								info += " " + usage;
							}
							var description = commands[cmd].description;
							if(description instanceof Function){
								description = description();
							}
							if(description){
								info += "\n\t" + description;
							}
							info += "\n"
						}
						sendMessage(Client, "Info", msg, info, null, null);
					} else {
							var batch = "";
							var sortedCommands = Object.keys(commands).sort();
							for(var i in sortedCommands) {
								var cmd = sortedCommands[i];
								var info = "**"+Config.Settings.prefix + cmd+"**";
								var usage = commands[cmd].usage;
								if(usage){
									info += " " + usage;
								}
								var description = commands[cmd].description;
								if(description instanceof Function) {
									description = description();
								}
								if(description){
									info += "\n\t" + description;
								}
								var newBatch = batch + "\n" + info;
								if(newBatch.length > (1024 - 8)) {
									msg.author.sendMessage(batch);
									batch = info;
								} else {
									batch = newBatch
								}
							}
							if(batch.length > 0) {
								sendMessage(Client, "**Available Commands**", msg, batch, null, null)
							}
					}
		}
		else if(cmd) {
			if(Config.Permissions.checkPermission(msg.author,cmdTxt)){
				try {
					cmd.process(Client,msg,suffix,isEdit);
				} catch(e) {
					var msgTxt = "command " + cmdTxt + " failed :(";
					if(Config.Settings.debug){
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
		if(msg.author == Client.user){
			return;
		}
		if (msg.author != Client.user && msg.isMentioned(Client.user)) {
				msg.channel.sendMessage(msg.author + ", you called?");
		} else {}
	}
}

// Messagebox
var messagebox;
try{
	messagebox = require("./messagebox.json");
} catch(e) {
	//no stored messages
	messagebox = {};
}
function updateMessagebox(){
	require("fs").writeFile("./messagebox.json",JSON.stringify(messagebox,null,2), null);
}

// Bot ON (message)
Client.on("message", (msg) => checkMessageForCommand(msg, false));

// Bot ON (messageUpdate)
Client.on("messageUpdate", (oldMessage, newMessage) => {
	checkMessageForCommand(newMessage, true);
});

// Bot ON (presence)
Client.on("presence", function(user,status,gameId) {
	//if(status === "online"){
	//console.log("presence update");
	console.log(user + " went " + status);
	//}
	try{
	if(status != 'offline'){
		if(messagebox.hasOwnProperty(user.id)){
			console.log("found message for " + user.id);
			var message = messagebox[user.id];
			var channel = Client.channels.get("id",message.channel);
			delete messagebox[user.id];
			updateMessagebox();
			Client.sendMessage(channel,message.content);
		}
	}
	}catch(e){}
});


// Bot OFF (disconnected)
Client.on("disconnected", function () {
	console.log("Disconnected!");
	process.exit(1); // Exits node with err
});

// Add Command(s)
var commands = {
	"alias": {
		usage: "<name> <actual command>",
		description: "Creates command aliases. Useful for making simple commands on the fly",
		process: function(Client,msg,suffix) {
			var args = suffix.split(" ");
			var name = args.shift();
			if(!name){
				msg.channel.sendMessage(Config.commandPrefix + "alias " + this.usage + "\n" + this.description);
			} else if(commands[name] || name === "help"){
				msg.channel.sendMessage("overwriting commands with aliases is not allowed!");
			} else {
				var command = args.shift();
				aliases[name] = [command, args.join(" ")];
				//now save the new alias
				require("fs").writeFile("./alias.json",JSON.stringify(aliases,null,2), null);
				msg.channel.sendMessage("created alias " + name);
			}
		}
	},
	"aliases": {
		description: "lists all recorded aliases",
		process: function(Client, msg, suffix) {
			var text = "";
			for(var a in aliases){
				if(typeof a === 'string')
					text += a + "\n";
			}
			sendMessage(Client, "Current Aliases", msg, text, null, null);
		}
	},
	"ping": {
		description: "responds pong, useful for checking if bot is alive",
		process: function(Client, msg, suffix) {
			var message = msg.author + " pong!";
			sendMessage(Client, "Ping-Pong!", msg, message, null, null);
		}
	},
	"invokeint": {
		description: "sets the interval for deletion of invoked messages",
		process: function(Client, msg, suffix) {
			var value;
			value = parseInt(suffix);
			if (isNaN(value)) {
				sendMessage(Client, "Please use numbers!", msg, "Only accepts integer values!", null, 0xFF0000);
				return;
			}
			Config.Settings.delete_interval = value;
			var message = "This command sets the interval in ms how long it takes to delete it's own invoked messages.";
			var fields = [];
			fields.push("Interval Rate (ms)");
			fields.push("**"+value+"**");
			sendMessage(Client, "Set Invoke Interval", msg, message, fields, null);
			fs.writeFile("./config.json",JSON.stringify(Config,null,2));
		}
	},
	"invokedel": {
		description: "deletes invoked messages.",
		process: function(Client, msg, suffix) {
			var message = "This command enables/disables deletion of messages on command invocation.\n"
			if (Config.Settings.delete_invoke) {
				Config.Settings.delete_invoke = false;
				var fields = [];
				fields.push("Status");
				fields.push("**DISABLED**")
				sendMessage(Client, "Delete Invoked Commands", msg, message, fields, 0xFF0000)
			} else {
				Config.Settings.delete_invoke = true;
				var fields = [];
				fields.push("Status");
				fields.push("**ENABLED**")
				sendMessage(Client, "Delete Invoked Commands", msg, message, fields, null)
			}
			fs.writeFile("./config.json",JSON.stringify(Config,null,2));
		}
	},
	"prune": {
		description: "prunes messages.",
		process: function(Client, msg, suffix) {
				var value;
				value = 50;
				value = parseInt(suffix);
				if (isNaN(value)) {
					console.log("Please note that prune without a number will delete up to 50 messages.\nYou can run prune 10 to delete 10 messages.");
				}
				var message = "You or the Bot don't have the permission to execute this command! Check your console! \"" + msg.content+"\"";
				if(!Config.Permissions.checkPermission(msg.author, "prune")) {
						sendMessage(Client, "Permissions", msg, message, null, 0xFF0000);
						console.log("You(user) don't have the permission to execute a prune!");
						return;
				} else if (!Config.Permissions.checkPermission(Client.user, "prune")) {
						sendMessage(Client, "Permissions", msg, message, null, null);
						console.log("Bot does not have the permission to execute a prune!");
						return;
				}

				if (msg.channel.type == 'text') {
						msg.channel.fetchMessages({limit: intSuffix}).then(messages => {
									msg.channel.bulkDelete(messages);
									messagesDeleted = messages.array().length;
									var desc = "Successfully deleted " + messagesDeleted + " messages.";
									sendMessage(Client, "Bulk Deletion", msg, desc);
									console.log("Deletion of messages successful. Total messages deleted: " + messagesDeleted);
							}).catch(err => {
									console.log("Error while doing a bulk delete");
									console.log(err);
							});
				}
        	}
	},
	"idle": {
		usage: "[status]",
		description: "sets bot status to idle",
		process: function(Client,msg,suffix) {
			Client.user.setStatus("idle");
			Client.user.setGame(suffix);
		}
	},
	"online": {
		usage: "[status]",
		description: "sets bot status to online",
		process: function(Client,msg,suffix) {
			Client.user.setStatus("online");
			Client.user.setGame(suffix);
		}
	},
	"say": {
		usage: "<message>",
		description: "bot says message",
		process: function(Client,msg,suffix) {
			msg.channel.sendMessage(suffix);
		}
	},
	"announce": {
		usage: "<message>",
		description: "bot says message with text to speech",
		process: function(Client,msg,suffix) {
			msg.channel.sendMessage(suffix,{tts:true});
		}
	},
	"msg": {
		usage: "<user> <message to leave user>",
		description: "leaves a message for a user the next time they come online",
		process: function(Client,msg,suffix) {
			var args = suffix.split(' ');
			var user = args.shift();
			var message = args.join(' ');
			if(user.startsWith('<@')){
				user = user.substr(2,user.length-3);
			}
			var target = msg.channel.guild.fetchMember(user, true);
			messagebox[target.id] = {
				channel: msg.channel.id,
				content: target + ", " + msg.author + " said: " + message
			};
			updateMessagebox();
			msg.channel.sendMessage("message saved.")
		}
	},
	"eval": {
		usage: "<command>",
		description: 'Executes arbitrary javascript in the bot process. User must have "eval" permission',
		process: function(Client,msg,suffix) {
			if(Config.Permissions.checkPermission(msg.author, "eval")){
				msg.channel.sendMessage( eval(suffix,Client));
			} else {
				msg.channel.sendMessage( msg.author + " doesn't have permission to execute eval!");
			}
		}
	}
};
exports.addCommand = function(commandName, commandObject){
    try {
        commands[commandName] = commandObject;
    } catch(err){
        console.log(err);
    }
}
exports.commandCount = function() {
	return Object.keys(commands).length;
}
