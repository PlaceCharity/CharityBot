const MongoClient = require('mongodb').MongoClient;

module.exports = {
	async getUserSettings(user) {
		const mongo = new MongoClient(process.env.DB, {
			useUnifiedTopology: true,
		});
		try {
			await mongo.connect();
			const database = mongo.db('charity');
			const userSettings = database.collection('usersettings');

			const result = await userSettings.findOne({
				id: user,
			});

			return result;
		} finally {
			await mongo.close();
		}
	},
	async setUserSettings(user, setting) {
		const mongo = new MongoClient(process.env.DB, {
			useUnifiedTopology: true,
		});
		try {
			await mongo.connect();
			const database = mongo.db('charity');
			const userSettings = database.collection('usersettings');

			const info = {
				id: user,
				...setting,
			};

			const exists = await userSettings.findOne({
				id: user,
			});

			if (exists) {
				const result = await userSettings.updateOne({
					id: user,
				}, {
					$set: info,
				});
				return result;
			} else {
				const result = await userSettings.insertOne(info);
				return result;
			}
		} finally {
			await mongo.close();
		}
	},
	async getTrackedTemplate(id) {
		const mongo = new MongoClient(process.env.DB, {
			useUnifiedTopology: true,
		});
		try {
			await mongo.connect();
			const database = mongo.db('charity');
			const trackedTemplate = database.collection('jsontemplates');

			const result = await trackedTemplate.findOne({
				id: id,
			});

			return result;
		} finally {
			await mongo.close();
		}
	},
	async setTrackedTemplate(id, template) {
		const mongo = new MongoClient(process.env.DB, {
			useUnifiedTopology: true,
		});
		try {
			await mongo.connect();
			const database = mongo.db('charity');
			const trackedTemplate = database.collection('jsontemplates');

			const info = {
				id: id,
				...template,
			};

			const exists = await trackedTemplate.findOne({
				id: id,
			});

			if (exists) {
				const result = await trackedTemplate.updateOne({
					id: id,
				}, {
					$set: info,
				});
				return result;
			} else {
				const result = await trackedTemplate.insertOne(info);
				return result;
			}
		} finally {
			await mongo.close();
		}
	},
	async removeTrackedTemplate(id) {
		const mongo = new MongoClient(process.env.DB, {
			useUnifiedTopology: true,
		});
		try {
			await mongo.connect();
			const database = mongo.db('charity');
			const templates = database.collection('jsontemplates');

			const result = await templates.deleteOne({
				id: id,
			});

			return result;
		} finally {
			await mongo.close();
		}
	},
	async listTrackedTemplates() {
		const mongo = new MongoClient(process.env.DB, {
			useUnifiedTopology: true,
		});
		try {
			await mongo.connect();
			const database = mongo.db('charity');
			const templates = database.collection('jsontemplates');

			const results = [];

			const find = await templates.find();

			await find.forEach(result => {
				results.push(result);
			});

			return results;
		} finally {
			await mongo.close();
		}
	},
	async getPinnedTemplates() {
		const mongo = new MongoClient(process.env.DB, {
			useUnifiedTopology: true,
		});
		try {
			await mongo.connect();
			const database = mongo.db('charity');
			const userSettings = database.collection('jsontemplates');

			const results = [];

			const find = await userSettings.find({
				pinned: true,
			});

			await find.forEach(result => {
				results.push(result);
			});

			return results;
		} finally {
			await mongo.close();
		}
	},
};