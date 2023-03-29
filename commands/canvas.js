const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const axios = require('axios');
const i18n = require('../handlers/i18n');

module.exports = {
	data: new SlashCommandBuilder()
		.setName(i18n.getDefault('command.canvas.name'))
		.setNameLocalizations(i18n.getDiscordLocales('command.canvas.name'))
		.setDescription(i18n.getDefault('command.canvas.description'))
		.setDescriptionLocalizations(i18n.getDiscordLocales('command.canvas.description')),
	cooldown: 3,
	async execute(interaction, locale) {
		i18n.setLocale(locale);
		await interaction.deferReply();
		const canvas = (await axios.get(`${process.env.API}/place`, { responseType: 'arraybuffer' })).data;
		const embed = new EmbedBuilder()
			.setColor(parseInt(process.env.BOT_COLOR))
			.setTitle(i18n.__('command.canvas.response.title'))
			.setImage('attachment://canvas.png')
			.setFooter({ text: i18n.__('embed.footer') });
		await interaction.editReply({
			embeds: [embed],
			files: [{
				attachment: canvas,
				name: 'canvas.png',
			}],
		});
	},
};