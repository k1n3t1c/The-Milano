var fs = require('fs');

try {
    var Discord = require("discord.js");
    var Module = require("./plugins/modules.js");
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
        try {
                if(Config.Permissions.global.hasOwnProperty(permission)){
                        allowed = Config.Permissions.global[permission] === true;
                }
        } catch(e){}
        try {
                if(Config.Permissions.users[user.id].hasOwnProperty(permission)){
                        allowed = Config.Permissions.users[user.id][permission] === true;
                }
        } catch (e) { }
        try {
            if (Config.Permissions.admin.hasOwnProperty(user.id)) {
                allowed = Config.Permissions.admin[user.id] === true;
            }
        } catch (e) { }
        return allowed;
} catch(e) {}
        return false;
}

fs.writeFile("./config.json",JSON.stringify(Config,null,2));


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
Client.on("message", (msg) => Module.checkMessageForCommand(Client, msg, false));

// Bot ON (messageUpdate)
Client.on("messageUpdate", (oldMessage, newMessage) => {
    Module.checkMessageForCommand(Client, newMessage, true);
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