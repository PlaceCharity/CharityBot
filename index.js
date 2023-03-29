require('dotenv').config();

const fs = require('fs');
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActivityType } = require('discord.js');
const i18n = require('./handlers/i18n');
const database = require('./handlers/database');
const progress = require('./handlers/progress');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.commands = new Collection();
client.cooldowns = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity('r/place...', { type: ActivityType.Watching });
	progress.init(client);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	const { cooldowns } = client;

	if (!cooldowns.has(command.data.name)) {
		cooldowns.set(command.data.name, new Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.data.name);
	const cooldownAmount = (command.cooldown || 1) * 1000;

	if (timestamps.has(interaction.user.id)) {
		const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			const userSettings = await database.getUserSettings(interaction.user.id);
			const locale = userSettings && userSettings.locale ? userSettings.locale : interaction.locale;
			i18n.setLocale(locale);
			const embed = new EmbedBuilder()
				.setColor(parseInt(process.env.BOT_COLOR))
				.setDescription(i18n.__('cooldown.wait', { seconds: timeLeft.toFixed(1), command: command.data.name }))
				.setFooter({ text: i18n.__('embed.footer') });
			return await interaction.reply({ embeds: [embed] });
		}
	}

	timestamps.set(interaction.user.id, now);
	setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

	try {
		const userSettings = await database.getUserSettings(interaction.user.id);
		const locale = userSettings && userSettings.locale ? userSettings.locale : interaction.locale;
		await command.execute(interaction, locale, client);
	} catch (error) {
		console.error(error);
		const userSettings = await database.getUserSettings(interaction.user.id);
		const locale = userSettings && userSettings.locale ? userSettings.locale : interaction.locale;
		i18n.setLocale(locale);
		const embed = new EmbedBuilder()
			.setColor(parseInt(process.env.BOT_COLOR))
			.setTitle(i18n.__('error.title'))
			.setDescription(i18n.__('error.description'))
			.setFooter({ text: i18n.__('embed.footer') });
		if (interaction.replied || interaction.deferred) {
			await interaction.editReply({ embeds: [embed], ephemeral: true });
		} else {
			await interaction.reply({ embeds: [embed], ephemeral: true });
		}
	}
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isAutocomplete()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		const userSettings = await database.getUserSettings(interaction.user.id);
		const locale = userSettings && userSettings.locale ? userSettings.locale : interaction.locale;
		await command.autocomplete(interaction, locale, client);
	} catch (error) {
		console.error(error);
	}
});

client.login(process.env.TOKEN);