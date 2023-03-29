const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');

const axios = require('axios');
const sharp = require('sharp');
const i18n = require('../handlers/i18n');
const database = require('../handlers/database');
const { getTemplate } = require('../handlers/template');

module.exports = {
	data: new SlashCommandBuilder()
		.setName(i18n.getDefault('command.track.name'))
		.setNameLocalizations(i18n.getDiscordLocales('command.track.name'))
		.setDescription(i18n.getDefault('command.track.description'))
		.setDescriptionLocalizations(i18n.getDiscordLocales('command.track.description'))
		.addStringOption(
			new SlashCommandStringOption()
				.setName(i18n.getDefault('command.track.option.template.name'))
				.setNameLocalizations(i18n.getDiscordLocales('command.track.option.template.name'))
				.setDescription(i18n.getDefault('command.track.option.template.description'))
				.setDescriptionLocalizations(i18n.getDiscordLocales('command.track.option.template.description'))
				.setRequired(true),
		),
	cooldown: 10,
	async execute(interaction, locale) {
		i18n.setLocale(locale);
		if (!interaction.inGuild()) {
			const error = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.track.response.notInGuild.name'))
				.setDescription(i18n.__('command.track.response.notInGuild.description'));
			return await interaction.reply({ embeds: [error] });
		}

		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && interaction.user.id !== process.env.BOT_OWNER) {
			const embed = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.track.response.noPermissions.name'))
				.setDescription(i18n.__('command.track.response.noPermissions.description', { guild: interaction.guild.name }))
				.setFooter({ text: i18n.__('embed.footer') });
			return await interaction.reply({ embeds: [embed] });
		}
		if (interaction.guild.memberCount < 50) {
			const embed = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.track.response.minimumMembers.name', { guild: interaction.guild.name }))
				.setDescription(i18n.__('command.track.response.minimumMembers.description'))
				.setFooter({ text: i18n.__('embed.footer') });
			return await interaction.reply({ embeds: [embed] });
		}
		await interaction.deferReply();
		const template = interaction.options.getString(i18n.getDefault('command.track.option.template.name'));
		const res = await axios.get(template, { responseType: 'json' }).catch(async () => {
			const embed = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.track.response.jsonInvalid.name', { guild: interaction.guild.name }))
				.setDescription(i18n.__('command.track.response.jsonInvalid.description'))
				.setFooter({ text: i18n.__('embed.footer') });
			return await interaction.editReply({ embeds: [embed] });
		});

		const json = res.data;
		if (json === null || json === undefined) return;
		if (json.templates === null || json.templates === undefined || json.templates.length === 0) {
			const embed = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.track.response.notFound.name'))
				.setDescription(i18n.__('command.track.response.notFound.description'))
				.setFooter({ text: i18n.__('embed.footer') });
			return await interaction.editReply({ embeds: [embed] });
		}

		await database.setTrackedTemplate(interaction.guild.id, {
			json: template,
			owner: interaction.user.id,
		});

		const templateInfo = await getTemplate(json);
		if (templateInfo === null || templateInfo === undefined || templateInfo.image === null || templateInfo.image === undefined) {
			const embed = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.track.response.jsonInvalid.name', { guild: interaction.guild.name }))
				.setDescription(i18n.__('command.track.response.jsonInvalid.description'))
				.setFooter({ text: i18n.__('embed.footer') });
			return await interaction.editReply({ embeds: [embed] });
		}
		const templateImage = await sharp(templateInfo.image);
		const scaleFactor = (await templateImage.metadata()).width < 500 ? Math.ceil(500 / (await templateImage.metadata()).width) : 1;
		const embed = new EmbedBuilder()
			.setColor(parseInt(process.env.BOT_COLOR))
			.setTitle(i18n.__('command.track.response.name'))
			.setDescription(i18n.__('command.track.response.description', { guild: interaction.guild.name, link: `<${template}>`, username: `<@${interaction.user.id}>` }))
			.setImage('attachment://frame.png')
			.setFooter({ text: i18n.__('embed.footer') });
		await interaction.editReply({
			embeds: [embed],
			files: [{
				attachment: await templateImage.resize((await templateImage.metadata()).width * scaleFactor, null, {
					fit: 'outside',
					kernel: 'nearest',
				}).png().toBuffer(),
				name: 'frame.png',
			}],
		});
	},
};