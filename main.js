const { Client, Intents  } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus, PlayerSubscription }= require('@discordjs/voice');
const { token } = require('./config.json');
const ytdl = require('ytdl-core');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });
const player = createAudioPlayer();

let setup = false;
let queue = [];

client.once('ready', () => {
	console.log('Ready');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	if (interaction.commandName === 'join') {
		let channel = interaction.member.voice.channel;
        joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });
		await interaction.reply({ content: 'Joining', ephemeral: true });
	}
	else if (interaction.commandName === 'leave') {
        const connection = getVoiceConnection(interaction.guildId);
        if (!connection) {
			await interaction.reply({ content: 'Not in room', ephemeral: true });
			return;
		} else {
			queue = [];
			connection.destroy();
			await interaction.reply({ content: 'Leaving', ephemeral: true })
		}
	}
	else if (interaction.commandName === 'play') {
        const connection = getVoiceConnection(interaction.guildId);
        if (!connection) {
			await interaction.reply('Not in room');
			return;
		} else {
			await interaction.deferReply();
            connection.subscribe(player);

			if (!setup) {
				player.on('stateChange', async (oldState, newState) => {
					console.log(`State changed from ${oldState.status} to ${newState.status}`);
					if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
							if (queue.length > 0) {
								const url = queue.shift();
								let stream = ytdl(url, { filter: 'audioonly', type: 'opus', highWaterMark: 1<<25 });
								let resource = createAudioResource(stream, { seek: 0, volume: 0.25 });
								player.play(resource);
								await interaction.followUp({ content: `Now playing: ${url}`});
							} else {
								await interaction.followUp({ content: `Queue is now empty.`});
							}
					}
				});
				setup = true;
			}

			let url = interaction.options.getString('url');
			if (player.state.status === AudioPlayerStatus.Playing) {
				queue.push(url);
				await interaction.followUp({ content: `Added to queue: ${url}`});
			} else {
				let stream = ytdl(url, { filter: 'audioonly', type: 'opus'});
				player.play(createAudioResource(stream, { seek: 0, volume: 0.25}));
				await interaction.followUp({ content: `Now playing: ${url}`});
			}
		}
	}
	else if (interaction.commandName === 'pause') {
        const connection = getVoiceConnection(interaction.guildId);
        if (!connection) {
			await interaction.reply({content: 'Not in room', ephemeral: true });
			return;
		} else {
			player.pause();
            await interaction.reply({ content: 'Pausing', ephemeral: true });
		}
	}
	else if (interaction.commandName === 'resume') {
        const connection = getVoiceConnection(interaction.guildId);
        if (!connection) {
			await interaction.reply({ content: 'Not in room', ephemeral: true });
			return;
		} else {
			player.unpause();
            await interaction.reply({ content: 'Resuming', ephemeral: true });
		}
	}
});

client.login(token);