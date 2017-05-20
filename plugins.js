var fs = require('fs');
var path = require('path');
function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

var plugin_folders;
var plugin_directory;
var exec_dir;

try {
    plugin_directory = "./plugins/";
    plugin_folders = getDirectories(plugin_directory);
} catch(e){
    exec_dir = path.dirname(process.execPath) + "/resources/default_app/";
    plugin_directory = path.dirname(process.execPath) + "/resources/default_app/plugins/";
    plugin_folders = getDirectories(plugin_directory);
}



exports.init = function() {
	preload_plugins();
};

function createNpmDependenciesArray (packageFilePath) {
    var p = require(packageFilePath);
    if (!p.dependencies) return [];
    var deps = [];
    for (var mod in p.dependencies) {
        deps.push(mod + "@" + p.dependencies[mod]);
    }

    return deps;
}

function preload_plugins(){
    var deps = [];
    var npm = require("npm");
    for (var i = 0; i < plugin_folders.length; i++) {
        try{
            require(plugin_directory + plugin_folders[i]);
        } catch(e) {
            deps = deps.concat(createNpmDependenciesArray(plugin_directory + plugin_folders[i] + "/package.json"));
        }
    }
    if(deps.length > 0) {
        npm.load({
            loaded: false
        }, function (err) {
            // catch errors
            if (plugin_directory != "./plugins/"){ //install plugin modules for Electrify builds
                npm.prefix = exec_dir;
                console.log(npm.prefix);
            }
            npm.commands.install(deps, function (er, data) {
                if(er){
                    console.log(er);
                }
                console.log("Plugin preload complete");
                load_plugins()
            });

            if (err) {
                console.log("preload_plugins: " + err);
            }
        });
    } else {
        load_plugins()
    }
}

function load_plugins(){
    var bot = require("./milano.js");
    var commandCount = 0;
    for (var i = 0; i < plugin_folders.length; i++) {
        var plugin;
        try{
            plugin = require(plugin_directory + plugin_folders[i])
        } catch (err){
            console.log("Improper setup of the '" + plugin_folders[i] +"' plugin. : " + err);
        }
        if (plugin){
            if("commands" in plugin){
                for (var j = 0; j < plugin.commands.length; j++) {
                    if (plugin.commands[j] in plugin){
                        bot.addCommand(plugin.commands[j], plugin[plugin.commands[j]])
                        commandCount++;
                    }
                }
            }
        }
    }
    console.log("Loaded " + bot.commandCount() + " chat commands");
}
