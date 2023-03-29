const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const axios = require('axios');
const { matchSorter } = require('match-sorter');
const sharp = require('sharp');
const i18n = require('../handlers/i18n');
const database = require('../handlers/database');
const templateHandler = require('../handlers/template');

function progressBar(value, min, max, width) {
	const BARS = ' ▏▎▍▌▋▊▉█';
	if (value > max) {
		value = max;
	} else if (value < min) {
		value = min;
	}
	if (value == max) {
		return Array(width + 1).join(BARS[8]);
	}
	const chars = width * (value - min) / (max - min);
	const intchars = Math.floor(chars);
	const fracchar = BARS[Math.floor((chars - intchars) * (BARS.length - 1))];
	return Array(intchars + 1).join(BARS[8]) + fracchar + Array(width - intchars - 1 + 1).join(' ');
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(i18n.getDefault('command.pin.name'))
		.setNameLocalizations(i18n.getDiscordLocales('command.pin.name'))
		.setDescription(i18n.getDefault('command.pin.description'))
		.setDescriptionLocalizations(i18n.getDiscordLocales('command.pin.description')),
	cooldown: 3,
	async execute(interaction, locale) {
		i18n.setLocale(locale);
		await interaction.deferReply();
		if (!interaction.inGuild()) {
			const error = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.pin.response.notInGuild.name'))
				.setDescription(i18n.__('command.pin.response.notInGuild.description'));
			return await interaction.reply({ embeds: [error] });
		}
		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && interaction.user.id !== process.env.BOT_OWNER) {
			const embed = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.pin.response.noPermissions.name'))
				.setDescription(i18n.__('command.pin.response.noPermissions.description', { guild: interaction.guild.name }))
				.setFooter({ text: i18n.__('embed.footer') });
			return await interaction.reply({ embeds: [embed] });
		}
		const template = await database.getTrackedTemplate(interaction.guild.id);
		if (template === null || template === undefined || template.json === null || template.json === undefined) {
			const embed = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.pin.response.notTracking.name'))
				.setDescription(i18n.__('command.pin.response.notTracking.description'))
				.setFooter({ text: i18n.__('embed.footer') });
			return await interaction.editReply({ embeds: [embed] });
		}
		const res = await axios.get(template.json, { responseType: 'json' }).catch(async () => {
			const embed = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.pin.response.jsonInvalid.name'))
				.setDescription(i18n.__('command.pin.response.jsonInvalid.description'))
				.setFooter({ text: i18n.__('embed.footer') });
			return await interaction.editReply({ embeds: [embed] });
		});
		const json = res.data;
		if (json === null || json === undefined) return;
		if (json.templates === null || json.templates === undefined || json.templates.length === 0) {
			const embed = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setTitle(i18n.__('command.pin.response.notFound.name'))
				.setDescription(i18n.__('command.pin.response.notFound.description'))
				.setFooter({ text: i18n.__('embed.footer') });
			return await interaction.editReply({ embeds: [embed] });
		}
		const templateInfo = await templateHandler.getTemplate(json);
		const progress = await templateHandler.progress(templateInfo);
		const progressImage = await sharp(progress.image);
		const scaleFactor = (await progressImage.metadata()).width < 500 ? Math.ceil(500 / (await progressImage.metadata()).width) : 1;
		const embed = new EmbedBuilder()
			.setColor(parseInt(process.env.BOT_COLOR))
			.setTitle(i18n.__('command.pin.response.title', { guild: interaction.guild.name }))
			.setDescription(
				`${i18n.__('command.pin.response.description.lastModifiedBy', { username: `<@${template.owner}>` })}\n\n` +
                `${i18n.__('command.pin.response.description.lastUpdated', { timestamp: `<t:${Math.round(Date.now() / 1000)}:f>` })}\n\n` +
                `${templateInfo.animated ? i18n.__('command.pin.response.description.frame', templateInfo) + '\n\n' : ''}` +
                `${i18n.__('command.pin.response.description.correctPixels', progress)}\n` +
                `${i18n.__('command.pin.response.description.incorrectPixels', progress)}\n` +
                `${i18n.__('command.pin.response.description.percentageComplete', { progressBar: `|\`${progressBar(progress.correctPixels, 0, progress.totalPixels, 25)}\`| ${Math.round((progress.correctPixels / progress.totalPixels) * 10000) / 100}%` })}\n`,
			)
			.setImage('attachment://progress.png')
			.setThumbnail('attachment://template.png')
			.setFooter({ text: i18n.__('embed.footer') });
		const message = await interaction.editReply({
			embeds: [embed],
			files: [{
				attachment: await progressImage.resize((await progressImage.metadata()).width * scaleFactor, null, {
					fit: 'outside',
					kernel: 'nearest',
				}).png().toBuffer(),
				name: 'progress.png',
			}, {
				attachment: templateInfo.image,
				name: 'template.png',
			}],
		});
		await database.setTrackedTemplate(interaction.guild.id, {
			...template,
			pinned: true,
			channel: message.channelId,
			message: message.id,
		});
	},
	async autocomplete(interaction, locale, client) {
		const focusedValue = interaction.options.getFocused();
		const templates = (await database.listTrackedTemplates()).map(template => {
			return {
				name: client.guilds.cache.get(template.id) ? client.guilds.cache.get(template.id).name : null,
				value: template.id,
			};
		}).filter(template => template.name !== null);
		const sorted = matchSorter(templates, focusedValue, { keys: ['name'] });
		if (sorted.length > 25) sorted.length = 25;
		interaction.respond(sorted);
	},
};