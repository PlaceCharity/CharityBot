const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');
const sharp = require('sharp');

const i18n = require('../handlers/i18n');
const database = require('./database');
const templateHandler = require('./template');

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
	async init(client) {
		cron.schedule('*/5 * * * *', async () => {
			i18n.setLocale('en-US');
			const pinnedTemplates = await database.getPinnedTemplates();
			for (const template of pinnedTemplates) {
				try {
					if (template === null || template === undefined || template.json === null || template.json === undefined) continue;
					if (template.locale !== null && template.locale !== undefined) i18n.setLocale(template.locale);
					const res = await axios.get(template.json, { responseType: 'json' });
					const json = res.data;
					if (json === null || json === undefined) continue;
					if (json.templates === null || json.templates === undefined || json.templates.length === 0) continue;
					const templateInfo = await templateHandler.getTemplate(json);
					const progress = await templateHandler.progress(templateInfo);
					const progressImage = await sharp(progress.image);
					const scaleFactor = (await progressImage.metadata()).width < 500 ? Math.ceil(500 / (await progressImage.metadata()).width) : 1;
					const embed = new EmbedBuilder()
						.setColor(parseInt(process.env.BOT_COLOR))
						.setTitle(i18n.__('command.pin.response.title', { guild: client.guilds.cache.get(template.id).name }))
						.setDescription(
							`${i18n.__('command.pin.response.description.lastModifiedBy', { username: `<@${template.owner}>` })}\n` +
                    `${i18n.__('command.pin.response.description.lastUpdated', { timestamp: `<t:${Math.round(Date.now() / 1000)}:f>` })}\n\n` +
                    `${templateInfo.animated ? i18n.__('command.pin.response.description.frame', templateInfo) + '\n\n' : ''}` +
                    `${i18n.__('command.pin.response.description.correctPixels', progress)}\n` +
                    `${i18n.__('command.pin.response.description.incorrectPixels', progress)}\n` +
                    `${i18n.__('command.pin.response.description.percentageComplete', { progressBar: `|\`${progressBar(progress.correctPixels, 0, progress.totalPixels, 25)}\`| ${Math.round((progress.correctPixels / progress.totalPixels) * 10000) / 100}%` })}\n`,
						)
						.setImage('attachment://progress.png')
						.setThumbnail('attachment://template.png')
						.setFooter({ text: i18n.__('embed.footer') });
					const message = await client.channels.cache.get(template.channel).messages.fetch(template.message);
					message.edit({
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
				} catch (e) {
					continue;
				}
			}
		});
	},
};