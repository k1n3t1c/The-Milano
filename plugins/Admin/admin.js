exports.commands = [
	"setUsername"
]

var startTime = Date.now();

exports.setUsername = {
	description: "sets the username of the bot.",
	process: function(bot,msg,suffix) {
		bot.user.setUsername(suffix);
	}
}
