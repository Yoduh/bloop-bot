const fs = require('fs');
const { createAudioResource, getVoiceConnection, StreamType } = require('@discordjs/voice');
const { createReadStream } = require('node:fs');
const joinCommand = require("./join");
const Sound = require("../db/Sound");

const command = async (args, isWeb, message, player, queue, subscription) => {
    if (!isWeb && !message.member.voice.channel) {
        message.reply("You must first join a voice channel");
        return;
    }
    if (!args[0]) {
        message.reply("you must specify the name of a sound for me to play");
        return;
    }
    const soundName = args[0].toLowerCase();
    const soundDb = await Sound.findOne({ name: soundName }).exec();
    if (!soundDb || !fs.existsSync(soundDb.file)) {
        if (!isWeb) {
            message.reply("sorry I can't find a sound by that name");
        }
        return;
    }
    if (player.state.status === 'buffering' || player.state.status === 'playing') {
        let queueItem = {
            args: args,
            isWeb: isWeb,
            message: message
        }
        queue.push(queueItem);
        return;
    }

    // make sure to send to send audio to proper server
    conn = getVoiceConnection(message.guildId);
    if (!conn)
    conn = await joinCommand(message);
    subscription = conn.subscribe(player);
    console.log(`playing sound ${isWeb ? 'from web' : ''}`, soundName);
    // eventually alert server who is playing sound from the website
    // if (isWeb) {
    //     getchannel.send("<user> is playing sound via web")
    // }
    const resource = createAudioResource(createReadStream(soundDb.file), {
        inputType: StreamType.OggOpus,
    });
    player.play(resource);
    soundDb.playCount += 1;
    soundDb.save();
    return { conn, subscription };
}

module.exports = command;