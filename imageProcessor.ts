// 定义图片处理的接口
interface ImageProcessorOptions {
  type: number;
  gap: number;
  interval: number;
  maxWidth: number;
  maxHeight: number;
  rows: number;
  cols: number;
}

// 图片处理的主函数
self.onmessage = async (e: MessageEvent) => {
  const { images, options } = e.data as { images: string[], options: ImageProcessorOptions };
  const compositedImages = await processImages(images, options);
  self.postMessage(compositedImages);
};

async function processImages(images: string[], options: ImageProcessorOptions): Promise<string[]> {
  const compositedImageDataURLs: string[] = [];
  const totalSteps = Math.floor(images.length / (options.type * options.interval));

  for (let i = 0; i < images.length && compositedImageDataURLs.length < totalSteps; i += options.type * options.interval) {
    const compositeImages = images.slice(i, i + options.type);
    if (compositeImages.length === options.type) {
      const compositedImageDataURL = await createCompositeImage(compositeImages, options);
      compositedImageDataURLs.push(compositedImageDataURL);
    } else {
      break;
    }
  }

  return compositedImageDataURLs;
}

async function createCompositeImage(images: string[], options: ImageProcessorOptions): Promise<string> {
  const canvas = new OffscreenCanvas(
    options.maxWidth * options.cols + options.gap * (options.cols - 1),
    options.maxHeight * options.rows + options.gap * (options.rows - 1)
  );
  const ctx = canvas.getContext('2d')!;

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
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}