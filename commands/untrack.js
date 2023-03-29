const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const i18n = require('../handlers/i18n');
const database = require('../handlers/database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName(i18n.getDefault('command.untrack.name'))
		.setNameLocalizations(i18n.getDiscordLocales('command.untrack.name'))
		.setDescription(i18n.getDefault('command.untrack.description'))
		.setDescriptionLocalizations(i18n.getDiscordLocales('command.untrack.description')),
	cooldown: 1,
	async execute(interaction, locale) {
		i18n.setLocale(locale);

		if (!interaction.inGuild()) {
			const error = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.untrack.response.notInGuild.name'))
				.setDescription(i18n.__('command.untrack.response.notInGuild.description'));
			return await interaction.reply({ embeds: [error] });
		}

		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && interaction.user.id !== process.env.BOT_OWNER) {
			const embed = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.untrack.response.noPermissions.name'))
				.setDescription(i18n.__('command.untrack.response.noPermissions.description', { guild: interaction.guild.name }))
				.setFooter({ text: i18n.__('embed.footer') });
			return await interaction.reply({ embeds: [embed] });
		}

		const removed = await database.removeTrackedTemplate(interaction.guild.id);
		if (removed.acknowledged && removed.deletedCount > 0) {
			const embed = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.untrack.response.title'))
				.setDescription(i18n.__('command.untrack.response.description', { guild: interaction.guild.name }))
				.setFooter({ text: i18n.__('embed.footer') });
			await interaction.reply({ embeds: [embed] });
		} else {
			const embed = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.untrack.response.notFound.title'))
				.setDescription(i18n.__('command.untrack.response.notFound.description', { guild: interaction.guild.name }))
				.setFooter({ text: i18n.__('embed.footer') });
			await interaction.reply({ embeds: [embed] });
		}
	},
};