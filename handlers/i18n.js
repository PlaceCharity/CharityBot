const { I18n } = require('i18n');
const path = require('path');

const i18n = new I18n({
	locales: ['en-US', 'tok'],
	fallbacks: { 'en-GB': 'en-US' },
	defaultLocale: 'en-US',
	directory: path.join('./', 'locales'),
});

const acceptedLocales = ['da', 'de', 'en-GB', 'en-US', 'es-ES', 'fr', 'hr', 'it', 'lt', 'hu', 'nl', 'no', 'pl', 'pt-BR', 'ro', 'fi', 'sv-SE', 'vi', 'tr', 'cs', 'el', 'bg', 'ru', 'uk', 'hi', 'th', 'zh-CN', 'ja', 'zh-TW', 'ko'];

const localeOptions = {
	da: 'Dansk',
	de: 'Deutsch',
	'en-GB': 'English',
	'en-US': 'English',
	'es-ES': 'Español',
	fr: 'Français',
	hr: 'Hrvatski',
	it: 'Italiano',
	lt: 'Lietuviškai',
	hu: 'Magyar',
	nl: 'Nederlands',
	no: 'Norsk',
	pl: 'Polski',
	'pt-BR': 'Português do Brasil',
	ro: 'Română',
	fi: 'Suomi',
	'sv-SE': 'Svenska',
	vi: 'Tiếng Việt',
	tr: 'Türkçe',
	cs: 'Čeština',
	el: 'Ελληνικά',
	bg: 'български',
	ru: 'Pусский',
	uk: 'Українська',
	hi: 'हिन्दी',
	th: 'ไทย',
	'zh-CN': '中文',
	ja: '日本語',
	'zh-TW': '繁體中文',
	ko: '한국어',
	tok: 'toki pona',
};

i18n.getLocaleOptions = () => {
	return Object.fromEntries(Object.entries(localeOptions).filter(([key]) => i18n.getLocales().includes(key)));
};

i18n.getDiscordLocales = string => {
	return i18n.__h(string).filter(l => acceptedLocales.includes(Object.keys(l)[0])).reduce((obj, item) => Object.assign(obj, { [Object.keys(item)[0]]: Object.values(item)[0] }), {});
};
i18n.getDefault = string => {
	return i18n.__h(string).find(l => Object.keys(l)[0] === 'en-US')['en-US'];
};

module.exports = i18n;