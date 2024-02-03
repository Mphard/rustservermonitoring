const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const { GameDig } = require('gamedig'); 
const fs = require('fs');

const configdir = './config';
const maxServers = 10;

if (!fs.existsSync(configdir)) {
    fs.mkdirSync(configdir);
}

fs.readdir(configdir, (err, files) => {
    try {
        if (files.length < 1)
        var writeConfig = '{"token":"token","serverIp":"","serverPort":"","updateInterval":"3"}'
        var jsonData = JSON.parse(writeConfig);

        fs.writeFile("config/server1.json", JSON.stringify(jsonData, null, 2), 'utf8', function(err) {
            if (err) {
                console.log("Error");
                return console.log(err);
            }
            console.log("Config Created");
        });
    } catch (error) {

    }
});

fs.readdir(configdir, (err, files) => {
    for (var i = 1; i <= files.length; i++) {
        if (i > maxServers) {
            console.log("Max server count " + maxServers)
            process.exit();
        }

        function updateActivity() {
            if (!serverIp || !serverPort) {
                console.log("serverIp or serverPort missing")
                process.exit()
            } else {
                GameDig.query({
                    type: 'rust',
                    host: serverIp,
                    port: serverPort
                }).then((state) => {
                    const serverName = state.name.split("|")[0];
                    const players = state.numplayers
                    const maxplayers = state.maxplayers
                    client.user.setUsername(serverName);
                    let status = `${players}/${maxplayers}`
                    return client.user.setPresence({activities: [{ name: status, type: ActivityType.Watching }], status: status});
                }).catch((error) => {
                    console.log("Server is offline");
                    return client.user.setPresence({activities: [{ name: "Offline", type: ActivityType.Watching }], status: "Offline"});
                });
            }
        }

        try {
            var config = require("./config/server"+i+".json");
        } catch (error) {

        }
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ]
        });

        const updateInterval = (1000 * 60) * 3 || (1000 * 60) * process.env.updateInterval || (1000 * 60) * config.updateInterval
        const serverIp = process.env.serverIp || config.serverIp
        const serverPort = process.env.serverPort || config.serverPort

        client.on("ready", () => {
            console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds`)
            updateActivity()
            setInterval(function () {
                updateActivity()
            }, updateInterval)
        })

        client.on("guildCreate", guild => {
            console.log(`New guild joined: ${guild.name} (id :${guild.id}). This guild has ${guild.memberCount} members`)
        })

        client.on("guildDelete", guild => {
            console.log(`I have been removed from ${guild.name} (id: ${guild.id})`)
        })

        client.on('error', function (error) {
            console.log(error)
        })

        process.on('unhandledRejection', error => {
            if (error.code == 'TOKEN_INVALID')
                return console.log("Token missing")

            return console.error("Unhandled rejection: ", error);
        })

        client.login(process.env.token || config.token)
    }
});