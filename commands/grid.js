const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandAttachmentOption, SlashCommandNumberOption, SlashCommandSubcommandGroupBuilder } = require('@discordjs/builders');

const axios = require('axios');
const FormData = require('form-data');
const i18n = require('../handlers/i18n');
const { matchSorter } = require('match-sorter');
const { getTemplate } = require('../handlers/template');
const database = require('../handlers/database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName(i18n.getDefault('command.grid.name'))
		.setNameLocalizations(i18n.getDiscordLocales('command.grid.name'))
		.setDescription(i18n.getDefault('command.grid.description'))
		.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.description'))
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName(i18n.getDefault('command.grid.subcommand.json.name'))
				.setNameLocalizations(i18n.getDiscordLocales('command.grid.subcommand.json.name'))
				.setDescription(i18n.getDefault('command.grid.subcommand.json.description'))
				.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.subcommand.json.description'))
				.addStringOption(
					new SlashCommandStringOption()
						.setName(i18n.getDefault('command.grid.subcommand.json.option.template.name'))
						.setNameLocalizations(i18n.getDiscordLocales('command.grid.subcommand.json.option.template.name'))
						.setDescription(i18n.getDefault('command.grid.subcommand.json.option.template.description'))
						.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.subcommand.json.option.template.description'))
						.setRequired(true),
				),
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName(i18n.getDefault('command.grid.subcommand.tracked.name'))
				.setNameLocalizations(i18n.getDiscordLocales('command.grid.subcommand.tracked.name'))
				.setDescription(i18n.getDefault('command.grid.subcommand.tracked.description'))
				.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.subcommand.tracked.description'))
				.addStringOption(
					new SlashCommandStringOption()
						.setName(i18n.getDefault('command.grid.subcommand.tracked.option.template.name'))
						.setNameLocalizations(i18n.getDiscordLocales('command.grid.subcommand.tracked.option.template.name'))
						.setDescription(i18n.getDefault('command.grid.subcommand.tracked.option.template.description'))
						.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.subcommand.tracked.option.template.description'))
						.setRequired(false)
						.setAutocomplete(true),
				),
		)
		.addSubcommandGroup(
			new SlashCommandSubcommandGroupBuilder()
				.setName(i18n.getDefault('command.grid.subcommand.image.name'))
				.setNameLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.name'))
				.setDescription(i18n.getDefault('command.grid.subcommand.image.description'))
				.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.description'))
				.addSubcommand(
					new SlashCommandSubcommandBuilder()
						.setName(i18n.getDefault('command.grid.subcommand.image.subcommand.attachment.name'))
						.setNameLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.attachment.name'))
						.setDescription(i18n.getDefault('command.grid.subcommand.image.subcommand.attachment.description'))
						.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.attachment.description'))
						.addAttachmentOption(
							new SlashCommandAttachmentOption()
								.setName(i18n.getDefault('command.grid.subcommand.image.subcommand.attachment.option.attachment.name'))
								.setNameLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.attachment.option.attachment.name'))
								.setDescription(i18n.getDefault('command.grid.subcommand.image.subcommand.attachment.option.attachment.description'))
								.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.attachment.option.attachment.description'))
								.setRequired(true),
						)
						.addNumberOption(
							new SlashCommandNumberOption()
								.setName(i18n.getDefault('command.grid.subcommand.image.subcommand.attachment.option.x.name'))
								.setNameLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.attachment.option.x.name'))
								.setDescription(i18n.getDefault('command.grid.subcommand.image.subcommand.attachment.option.x.description'))
								.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.attachment.option.x.description'))
								.setMinValue(0)
								.setMaxValue(parseInt(process.env.CANVAS_WIDTH))
								.setRequired(true),
						)
						.addNumberOption(
							new SlashCommandNumberOption()
								.setName(i18n.getDefault('command.grid.subcommand.image.subcommand.attachment.option.y.name'))
								.setNameLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.attachment.option.y.name'))
								.setDescription(i18n.getDefault('command.grid.subcommand.image.subcommand.attachment.option.y.description'))
								.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.attachment.option.y.description'))
								.setMinValue(0)
								.setMaxValue(parseInt(process.env.CANVAS_HEIGHT))
								.setRequired(true),
						),
				)
				.addSubcommand(
					new SlashCommandSubcommandBuilder()
						.setName(i18n.getDefault('command.grid.subcommand.image.subcommand.link.name'))
						.setNameLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.link.name'))
						.setDescription(i18n.getDefault('command.grid.subcommand.image.subcommand.link.description'))
						.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.link.description'))
						.addStringOption(
							new SlashCommandStringOption()
								.setName(i18n.getDefault('command.grid.subcommand.image.subcommand.link.option.link.name'))
								.setNameLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.link.option.link.name'))
								.setDescription(i18n.getDefault('command.grid.subcommand.image.subcommand.link.option.link.description'))
								.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.link.option.link.description'))
								.setRequired(true),
						)
						.addNumberOption(
							new SlashCommandNumberOption()
								.setName(i18n.getDefault('command.grid.subcommand.image.subcommand.link.option.x.name'))
								.setNameLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.link.option.x.name'))
								.setDescription(i18n.getDefault('command.grid.subcommand.image.subcommand.link.option.x.description'))
								.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.link.option.x.description'))
								.setMinValue(0)
								.setMaxValue(parseInt(process.env.CANVAS_WIDTH))
								.setRequired(true),
						)
						.addNumberOption(
							new SlashCommandNumberOption()
								.setName(i18n.getDefault('command.grid.subcommand.image.subcommand.link.option.y.name'))
								.setNameLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.link.option.y.name'))
								.setDescription(i18n.getDefault('command.grid.subcommand.image.subcommand.link.option.y.description'))
								.setDescriptionLocalizations(i18n.getDiscordLocales('command.grid.subcommand.image.subcommand.link.option.y.description'))
								.setMinValue(0)
								.setMaxValue(parseInt(process.env.CANVAS_HEIGHT))
								.setRequired(true),
						),
				),
		),
	cooldown: 10,
	async execute(interaction, locale, client) {
		i18n.setLocale(locale);
		await interaction.deferReply();

		let image;
		let x;
		let y;

		if (interaction.options.getSubcommand() === i18n.getDefault('command.grid.subcommand.json.name')) {
			const template = interaction.options.getString(i18n.getDefault('command.grid.subcommand.json.option.template.name'));
			const res = await axios.get(template, { responseType: 'json' }).catch(async () => {
				const embed = new EmbedBuilder()
					.setColor(parseInt(process.env.BOT_COLOR))
					.setTitle(i18n.__('command.grid.subcommand.json.response.jsonInvalid.name'))
					.setDescription(i18n.__('command.grid.subcommand.json.response.jsonInvalid.description'))
					.setFooter({ text: i18n.__('embed.footer') });
				return await interaction.editReply({ embeds: [embed] });
			});
			const json = res.data;
			if (json === null || json === undefined) return;
			if (json.templates === null || json.templates === undefined || json.templates.length === 0) {
				const embed = new EmbedBuilder()
					.setColor(parseInt(process.env.BOT_COLOR))
					.setTitle(i18n.__('command.grid.subcommand.json.response.notFound.name'))
					.setDescription(i18n.__('command.grid.subcommand.json.response.notFound.description'))
					.setFooter({ text: i18n.__('embed.footer') });
				return await interaction.editReply({ embeds: [embed] });
			}
			const templateInfo = await getTemplate(json);
			image = templateInfo.image;
			x = templateInfo.x;
			y = templateInfo.y;
		} else if (interaction.options.getSubcommand() === i18n.getDefault('command.grid.subcommand.tracked.name')) {
			if (!interaction.inGuild() && (interaction.options.getString(i18n.getDefault('command.grid.subcommand.tracked.option.template.name')) === null || interaction.options.getString(i18n.getDefault('command.grid.subcommand.tracked.option.template.name')) === undefined)) {
				const error = new EmbedBuilder()
					.setColor(parseInt(process.env.BOT_COLOR))
					.setTitle(i18n.__('command.grid.subcommand.tracked.response.notInGuild.name'))
					.setDescription(i18n.__('command.grid.subcommand.tracked.response.notInGuild.description'));
				return await interaction.reply({ embeds: [error] });
			}
			const guild = interaction.options.getString(i18n.getDefault('command.grid.subcommand.tracked.option.template.name')) ? interaction.options.getString(i18n.getDefault('command.grid.subcommand.tracked.option.template.name')) : interaction.guild.id;
			if (client.guilds.cache.get(guild) === null || client.guilds.cache.get(guild) === undefined) {
				const embed = new EmbedBuilder()
					.setColor(parseInt(process.env.BOT_COLOR))
					.setTitle(i18n.__('command.grid.subcommand.tracked.response.notGuild.name'))
					.setDescription(i18n.__('command.grid.subcommand.tracked.response.notGuild.description'))
					.setFooter({ text: i18n.__('embed.footer') });
				return await interaction.editReply({ embeds: [embed] });
			}
			const template = await database.getTrackedTemplate(guild);
			if (template === null || template === undefined || template.json === null || template.json === undefined) {
				const embed = new EmbedBuilder()
					.setColor(parseInt(process.env.BOT_COLOR))
					.setTitle(i18n.__('command.grid.subcommand.tracked.response.notTracking.name'))
					.setDescription(i18n.__('command.grid.subcommand.tracked.response.notTracking.description'))
					.setFooter({ text: i18n.__('embed.footer') });
				return await interaction.editReply({ embeds: [embed] });
			}
			const res = await axios.get(template.json, { responseType: 'json' }).catch(async () => {
				const embed = new EmbedBuilder()
					.setColor(parseInt(process.env.BOT_COLOR))
					.setTitle(i18n.__('command.grid.subcommand.tracked.response.jsonInvalid.name'))
					.setDescription(i18n.__('command.grid.subcommand.tracked.response.jsonInvalid.description'))
					.setFooter({ text: i18n.__('embed.footer') });
				return await interaction.editReply({ embeds: [embed] });
			});
			const json = res.data;
			if (json === null || json === undefined) return;
			if (json.templates === null || json.templates === undefined || json.templates.length === 0) {
				const embed = new EmbedBuilder()
					.setColor(parseInt(process.env.BOT_COLOR))
					.setTitle(i18n.__('command.grid.subcommand.tracked.response.notFound.name'))
					.setDescription(i18n.__('command.grid.subcommand.tracked.response.notFound.description', { guild: client.guilds.cache.get(guild).name }))
					.setFooter({ text: i18n.__('embed.footer') });
				return await interaction.editReply({ embeds: [embed] });
			}
			const templateInfo = await getTemplate(json);
			image = templateInfo.image;
			x = templateInfo.x;
			y = templateInfo.y;
		} else if (interaction.options.getSubcommand() === i18n.getDefault('command.grid.subcommand.image.subcommand.attachment.name')) {
			x = interaction.options.getNumber(i18n.getDefault('command.grid.subcommand.image.subcommand.attachment.option.x.name'));
			y = interaction.options.getNumber(i18n.getDefault('command.grid.subcommand.image.subcommand.attachment.option.y.name'));

			const link = interaction.options.getAttachment(i18n.getDefault('command.grid.subcommand.image.subcommand.attachment.option.attachment.name'));
			if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/tiff'].includes(link.contentType)) {
				const embed = new EmbedBuilder()
					.setColor(parseInt(process.env.BOT_COLOR))
					.setTitle(i18n.__('command.grid.subcommand.image.subcommand.attachment.response.notImage.name'))
					.setDescription(i18n.__('command.grid.subcommand.image.subcommand.attachment.response.notImage.description'))
					.setFooter({ text: i18n.__('embed.footer') });
				return await interaction.editReply({ embeds: [embed] });
			}
			image = (await axios.get(link.url, { responseType: 'arraybuffer' })).data;
		} else if (interaction.options.getSubcommand() === i18n.getDefault('command.grid.subcommand.image.subcommand.link.name')) {
			x = interaction.options.getNumber(i18n.getDefault('command.grid.subcommand.image.subcommand.link.option.x.name'));
			y = interaction.options.getNumber(i18n.getDefault('command.grid.subcommand.image.subcommand.link.option.y.name'));

			const link = interaction.options.getString(i18n.getDefault('command.grid.subcommand.image.subcommand.link.option.link.name'));
			const res = await axios.get(link, { responseType: 'arraybuffer' }).catch(async () => {
				const embed = new EmbedBuilder()
					.setColor(parseInt(process.env.BOT_COLOR))
					.setTitle(i18n.__('command.grid.subcommand.image.subcommand.link.response.notFound.name'))
					.setDescription(i18n.__('command.grid.subcommand.image.subcommand.link.response.notFound.description'))
					.setFooter({ text: i18n.__('embed.footer') });
				return await interaction.editReply({ embeds: [embed] });
			});
			image = res.data;
			if (image === null || image === undefined) return;
		}

		const form = new FormData();

		form.append('x', x);
		form.append('y', y);
		form.append('image', image, 'image.png');

		const grid = await axios.postForm(`${process.env.API}/grid`, form, {
			headers: {
				...form.getHeaders(),
			},
			responseType: 'arraybuffer',
		});

		const embed = new EmbedBuilder()
			.setColor(parseInt(process.env.BOT_COLOR))
			.setTitle(i18n.__('command.grid.response.name'))
			.setImage('attachment://grid.png')
			.setFooter({ text: i18n.__('embed.footer') });
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setURL(grid.headers.sheet)
					.setLabel(i18n.__('command.grid.response.button.spreadsheet'))
					.setStyle(ButtonStyle.Link),
			);
		await interaction.editReply({
			embeds: [embed],
			components: [row],
			files: [{
				attachment: grid.data,
				name: 'grid.png',
			}],
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