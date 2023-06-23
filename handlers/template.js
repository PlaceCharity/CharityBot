const axios = require('axios');
const FileType = require('file-type');
const sharp = require('sharp');

async function extractFrame(image, frameWidth, frameHeight, frameIndex) {
	const gridWidth = Math.round((await image.metadata()).width / frameWidth);
	const gridX = frameIndex % gridWidth;
	const gridY = Math.floor(frameIndex / gridWidth);
	return image.extract({ left: gridX * frameWidth, top: gridY * frameHeight, width: frameWidth, height: frameHeight });
}

const getTrimAlphaInfo = async (pipeline, width, height) =>
	pipeline
		.ensureAlpha()
		.extractChannel(3)
		.toColourspace('b-w')
		.raw()
		.toBuffer()
		.then((data) => {
			let topTrim = 0;
			let bottomTrim = 0;
			let leftTrim = 0;
			let rightTrim = 0;
			let topStatus = true;
			let bottomStatus = true;
			let leftStatus = true;
			let rightStatus = true;

			let h = Math.ceil(height);
			const w = Math.ceil(width);

			for (let i = 0; i < h; i++) {
				for (let j = 0; j < width; j++) {
					if (topStatus && data[i * width + j] > 0) {
						topStatus = false;
					}
					if (bottomStatus && data[(height - i - 1) * width + j] > 0) {
						bottomStatus = false;
					}
					if (!topStatus && !bottomStatus) {
						break;
					}
				}
				if (!topStatus && !bottomStatus) {
					break;
				}
				if (topStatus) {
					topTrim += 1;
				}
				if (bottomStatus) {
					bottomTrim += 1;
				}
			}

			if (topTrim + bottomTrim >= height) {
				// console.log("Is empty image.");
				return {
					trimOffsetLeft: width * -1,
					trimOffsetTop: height * -1,
					width: 0,
					height: 0,
				};
			}

			h = height - bottomTrim;

			for (let i = 0; i < w; i++) {
				for (let j = topTrim; j < h; j++) {
					if (leftStatus && data[width * j + i] > 0) {
						leftStatus = false;
					}
					if (rightStatus && data[width * j + width - i - 1] > 0) {
						rightStatus = false;
					}
					if (!leftStatus && !rightStatus) {
						break;
					}
				}
				if (!leftStatus && !rightStatus) {
					break;
				}
				if (leftStatus) {
					leftTrim += 1;
				}
				if (rightStatus) {
					rightTrim += 1;
				}
			}

			return {
				trimOffsetLeft: leftTrim * -1,
				trimOffsetTop: topTrim * -1,
				width: width - leftTrim - rightTrim,
				height: height - topTrim - bottomTrim,
			};
		});

function getCurrentFrameIndex(template, responseDate) {
	const responseDiffs = [];
	if (responseDate) {
		const responseTime = Date.parse(responseDate);
		responseDiffs.push(responseTime - Date.now());
	}
	const averageDiff = responseDiffs.reduce((a, b) => a + b, 0) / (responseDiffs.length);
	const currentSeconds = (Date.now() + averageDiff) / 1000;

	if (!template.looping && template.startTime + template.frameCount * template.frameSpeed < currentSeconds) {
		return template.frameCount - 1;
	}
	const a = Math.floor((currentSeconds - template.startTime) / template.frameSpeed);
	const b = template.frameCount;
	return (a % b + b) % b;
}

module.exports = {
	async getTemplate(json) {
		let templateImage = await sharp({
			create: {
				width: 2000,
				height: 2000,
				channels: 4,
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			},
		}).png().toBuffer();

		let animatedTemplates = 0;
		let currentFrame = 1;
		let totalFrames = 1;

		for (let i = 0; i < json.templates.length; i++) {
			const template = json.templates[i];

			if (!Array.isArray(template.sources)) return;
			if (!Number.isInteger(template.x)) return;
			if (!Number.isInteger(template.y)) return;

			template.frameCount = template.frameCount || 1;
			template.frameSpeed = template.frameRate || template.frameSpeed || Infinity;
			template.startTime = template.startTime || 0;
			template.looping = template.looping || template.frameCount > 1;

			let image = null;
			let date = null;
			for (let j = 0; j < template.sources.length; j++) {
				if (image === null || image === undefined) {
					try {
						const res = await axios.get(template.sources[j], { responseType: 'arraybuffer' });
						const type = await FileType.fromBuffer(res.data);
						if (type.mime && ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/tiff'].includes(type.mime)) {
							image = await sharp(res.data);
							date = res.headers.date;
						}
					} catch (e) {
						return;
					}
				}
			}

			if (image === null || image === undefined) return;

			const frameIndex = getCurrentFrameIndex(template, date);
			const frameWidth = template.frameWidth ? template.frameWidth : (await image.metadata()).width;
			const frameHeight = template.frameHeight ? template.frameHeight : (await image.metadata()).height;

			if (template.frameCount !== 1) animatedTemplates++;
			currentFrame = frameIndex;
			totalFrames = template.frameCount;

			const frame = await extractFrame(image, frameWidth, frameHeight, frameIndex);
			templateImage = await sharp(templateImage).composite([{ input: await frame.png().toBuffer(), left: template.x, top: template.y }]).png().toBuffer();
		}

		const untrimmedImage = await sharp(templateImage);
		const untrimmedMetadata = await untrimmedImage.metadata();
		const untrimmedWidth = untrimmedMetadata.width;
		const untrimmedHeight = untrimmedMetadata.height;
		const trimAlphaInfo = await getTrimAlphaInfo(untrimmedImage, untrimmedWidth, untrimmedHeight);

		const image = await sharp(templateImage).extract({
			left: trimAlphaInfo.trimOffsetLeft * -1,
			top: trimAlphaInfo.trimOffsetTop * -1,
			width: trimAlphaInfo.width,
			height: trimAlphaInfo.height,
		}).png().toBuffer();

		return {
			x: trimAlphaInfo.trimOffsetLeft * -1,
			y: trimAlphaInfo.trimOffsetTop * -1,
			width: trimAlphaInfo.width,
			height: trimAlphaInfo.height,
			image: image,
			animated: animatedTemplates === 1,
			currentFrame: animatedTemplates === 1 ? currentFrame : null,
			totalFrames: animatedTemplates === 1 ? totalFrames : null,
		};
	},
	async progress(template) {
		const canvas = (await axios.get(`${process.env.API}/place`, { responseType: 'arraybuffer' })).data;

		const rawTemplate = await sharp(template.image).ensureAlpha().raw().toBuffer();
		const rawCanvas = await sharp(canvas).ensureAlpha().extract({ left: template.x, top: template.y, width: template.width, height: template.height }).raw().toBuffer();

		const progressBuffer = new Buffer.alloc(rawTemplate.length, 0);

		const progress = {
			totalPixels: 0,
			correctPixels: 0,
			incorrectPixels: 0,
		};

		for (let i = 0; i < rawTemplate.length; i = i + 4) {
			const templatePixel = { r: rawTemplate[i], g: rawTemplate[i + 1], b: rawTemplate[i + 2], a: rawTemplate[i + 3] };
			const canvasPixel = { r: rawCanvas[i], g: rawCanvas[i + 1], b: rawCanvas[i + 2], a: rawCanvas[i + 3] };

			if (templatePixel.a === 0) {
				progressBuffer[i + 3] = 128;
				continue;
			}
			progress.totalPixels++;
			if (templatePixel.r === canvasPixel.r && templatePixel.g === canvasPixel.g && templatePixel.b === canvasPixel.b) {
				progressBuffer[i + 1] = 255;
				progressBuffer[i + 3] = 128;
				progress.correctPixels++;
			} else {
				progressBuffer[i] = 255;
				progressBuffer[i + 3] = 128;
				progress.incorrectPixels++;
			}
		}
		const extendLeft = template.x - 5 < 0 ? Math.abs(template.x - 5) : 0;
		const extendTop = template.y - 5 < 0 ? Math.abs(template.y - 5) : 0;
		const extendRight = template.x + template.width + 5 > 2000 ? template.x + template.width + 5 - 2000 : 0;
		const extendBottom = template.y + template.height + 5 > 2000 ? template.y + template.height + 5 - 2000 : 0;
		const background = await sharp(canvas).extract({
			left: template.x - 5 + extendLeft,
			top: template.y - 5 + extendTop,
			width: template.width + 10 - extendLeft - extendRight,
			height: template.height + 10 - extendTop - extendBottom,
		}).extend({
			left: extendLeft,
			top: extendTop,
			right: extendRight,
			bottom: extendBottom,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		});
		const image = await background.composite([
			{
				input: await sharp(progressBuffer, {
					raw: {
						width: template.width,
						height: template.height,
						channels: 4,
					},
				}).extend({
					left: 5 - extendLeft,
					top: 5 - extendTop,
					right: 5 - extendRight,
					bottom: 5 - extendBottom,
					background: { r: 0, g: 0, b: 0, alpha: 0.5 },
				}).png().toBuffer(),
				left: extendLeft,
				top: extendTop,
			},
		]).png().toBuffer();
		return {
			image: image,
			...progress,
		};
	},
};