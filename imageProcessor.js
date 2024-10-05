"use strict";
// 图片处理的主函数
self.onmessage = async (e) => {
    const { images, options } = e.data;
    const compositedImages = await processImages(images, options);
    self.postMessage(compositedImages);
};
async function processImages(images, options) {
    const compositedImageDataURLs = [];
    const totalSteps = Math.floor(images.length / (options.type * options.interval));
    for (let i = 0; i < images.length && compositedImageDataURLs.length < totalSteps; i += options.type * options.interval) {
        const compositeImages = images.slice(i, i + options.type);
        if (compositeImages.length === options.type) {
            const compositedImageDataURL = await createCompositeImage(compositeImages, options);
            compositedImageDataURLs.push(compositedImageDataURL);
        }
        else {
            break;
        }
    }
    return compositedImageDataURLs;
}
async function createCompositeImage(images, options) {
    const canvas = new OffscreenCanvas(options.maxWidth * options.cols + options.gap * (options.cols - 1), options.maxHeight * options.rows + options.gap * (options.rows - 1));
    const ctx = canvas.getContext('2d');
    await Promise.all(images.map(async (imgSrc, index) => {
        const img = await createImageBitmap(await fetch(imgSrc).then(r => r.blob()));
        const col = index % options.cols;
        const row = Math.floor(index / options.cols);
        const x = col * (options.maxWidth + options.gap);
        const y = row * (options.maxHeight + options.gap);
        ctx.drawImage(img, x, y, options.maxWidth, options.maxHeight);
    }));
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}