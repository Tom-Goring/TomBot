const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { clientId, guildId, token } = require('./config.json');

const commands = [
	new SlashCommandBuilder().setName('join').setDescription('Joins voice room'),
	new SlashCommandBuilder().setName('leave').setDescription('Leaves voice room'),
	new SlashCommandBuilder().setName('play').setDescription('Plays song').addStringOption(option =>
		option.setName('url')
            .setDescription('URL of video to play')
            .setRequired(true)),
	new SlashCommandBuilder().setName('pause').setDescription('Pauses song'),
	new SlashCommandBuilder().setName('resume').setDescription('Resumes song'),
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);