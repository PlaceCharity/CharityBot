const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const i18n = require('../handlers/i18n');

module.exports = {
	data: new SlashCommandBuilder()
		.setName(i18n.getDefault('command.ping.name'))
		.setNameLocalizations(i18n.getDiscordLocales('command.ping.name'))
		.setDescription(i18n.getDefault('command.ping.description'))
		.setDescriptionLocalizations(i18n.getDiscordLocales('command.ping.description')),
	cooldown: 1,
	async execute(interaction, locale, client) {
		i18n.setLocale(locale);
		const embed = new EmbedBuilder()
			.setColor(parseInt(process.env.BOT_COLOR))
			.setTitle(i18n.__('command.ping.response.title'))
			.setDescription(i18n.__('command.ping.response.description', { discord: client.ws.ping }))
			.setFooter({ text: i18n.__('embed.footer') });
		await interaction.reply({ embeds: [embed] });
	},
};