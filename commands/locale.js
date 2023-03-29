const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');

const i18n = require('../handlers/i18n');
const database = require('../handlers/database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName(i18n.getDefault('command.locale.name'))
		.setNameLocalizations(i18n.getDiscordLocales('command.locale.name'))
		.setDescription(i18n.getDefault('command.locale.description'))
		.setDescriptionLocalizations(i18n.getDiscordLocales('command.locale.description'))
		.addStringOption(
			new SlashCommandStringOption()
				.setName(i18n.getDefault('command.locale.option.locale.name'))
				.setNameLocalizations(i18n.getDiscordLocales('command.locale.option.locale.name'))
				.setDescription(i18n.getDefault('command.locale.option.locale.description'))
				.setDescriptionLocalizations(i18n.getDiscordLocales('command.locale.option.locale.description'))
				.setRequired(true)
				.setChoices(
					{ name:'None', value:'none' },
					...Object.entries(i18n.getLocaleOptions()).map(c => {
						return { name: c[1], value: c[0] };
					}),
				),
		),
	cooldown: 1,
	async execute(interaction) {
		let locale = interaction.options.getString(i18n.getDefault('command.locale.option.locale.name'));
		if (locale === 'none') {
			locale = (Object.keys(i18n.getLocaleOptions()).includes(interaction.locale)) ? interaction.locale : 'en-US';
			await database.setUserSettings(interaction.user.id, { locale: null });
		} else {
			await database.setUserSettings(interaction.user.id, { locale: locale });
		}
		i18n.setLocale(locale);
		const embed = new EmbedBuilder()
			.setColor(parseInt(process.env.BOT_COLOR))
			.setTitle(i18n.__('command.locale.response.title'))
			.setDescription(i18n.__('command.locale.response.description', { locale: i18n.getLocaleOptions()[locale] }))
			.setFooter({ text: i18n.__('embed.footer') });
		await interaction.reply({ embeds: [embed] });
	},
};