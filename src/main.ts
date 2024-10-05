import { ImageProcessorOptions } from './types';

// 将这两行移到文件顶部
let uploadedImages: string[] = [];
let compositedImageDataURLs: string[] = [];

async function uploadImages() {
  console.log('uploadImages called');
  const input = document.getElementById('imageUpload') as HTMLInputElement;
  const files = Array.from(input.files || []);
  
  if (files.length === 0) {
    alert('请选择至少一张图片！');
    return;
  }

  files.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}));
  
  uploadedImages = await Promise.all(files.map(file => readFileAsDataURL(file)));
  showMessage(`成功上传 ${files.length} 张图片！`);
}

async function compositeImages() {
  console.log('compositeImages called');
  const type = parseInt((document.getElementById('compositeType') as HTMLSelectElement).value);
  const gap = parseInt((document.getElementById('imageGap') as HTMLInputElement).value);
  const interval = parseInt((document.getElementById('compositeInterval') as HTMLInputElement).value);
  
  if (uploadedImages.length < type) {
    alert(`图片数量不足，请上传至少 ${type} 张图片！`);
    return;
  }
  
  const { maxWidth, maxHeight } = await getMaxDimensions(uploadedImages);
  const { rows, cols } = getGridDimensions(type);

  const worker = new Worker(new URL('./imageProcessor.ts', import.meta.url), { type: 'module' });
  
  worker.onmessage = (e: MessageEvent) => {
    compositedImageDataURLs = e.data;
    displayPreview(compositedImageDataURLs);
    showMessage('图片合成成功！');
    worker.terminate();
  };

  worker.postMessage({
    images: uploadedImages,
    options: { type, gap, interval, maxWidth, maxHeight, rows, cols }
  } as { images: string[], options: ImageProcessorOptions });
}

// 辅助函数
async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function getMaxDimensions(imageSources: string[]): Promise<{ maxWidth: number, maxHeight: number }> {
  const images = await Promise.all(imageSources.map(loadImage));
  return {
    maxWidth: Math.max(...images.map(img => img.width)),
    maxHeight: Math.max(...images.map(img => img.height))
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getGridDimensions(type: number): { rows: number, cols: number } {
  if (type <= 3) return { rows: 1, cols: type };
  if (type <= 4) return { rows: 2, cols: 2 };
  if (type <= 6) return { rows: 2, cols: 3 };
  if (type <= 9) return { rows: 3, cols: 3 };
  throw new Error('不支持的合成类型');
}

function displayPreview(dataURLs: string[]) {
  const preview = document.getElementById('preview')!;
  preview.innerHTML = dataURLs.map((dataURL, index) => `
    <img src="${dataURL}" alt="合成图片预览 ${index + 1}" title="点击查看原始大小"
         style="max-width: 200px; margin: 5px; cursor: pointer;"
         onclick="window.open('${dataURL}', '_blank')">
  `).join('');
}

function showMessage(message: string) {
  const messageDiv = document.getElementById('message')!;
  messageDiv.textContent = message;
  setTimeout(() => messageDiv.textContent = '', 3000);
}

// 其他函数（如 downloadImage, exportToExcel, exportToPDF, clearCompositedImages）保持不变

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('imageUpload')!.addEventListener('change', uploadImages);
  document.getElementById('uploadButton')!.addEventListener('click', () => {
    (document.getElementById('imageUpload') as HTMLInputElement).click();
  });
  document.getElementById('compositeButton')!.addEventListener('click', compositeImages);
  document.getElementById('downloadButton')!.addEventListener('click', downloadImage);
  document.getElementById('exportExcelButton')!.addEventListener('click', exportToExcel);
  document.getElementById('exportPDFButton')!.addEventListener('click', exportToPDF);
  document.getElementById('clearButton')!.addEventListener('click', clearCompositedImages);
});

// 类型声明
declare const XLSX: any;
declare const JSZip: any;
declare const jspdf: { jsPDF: any };

// 将函数赋值给 window 对象
(window as any).uploadImages = uploadImages;
(window as any).compositeImages = compositeImages;
(window as any).downloadImage = downloadImage;
(window as any).exportToExcel = exportToExcel;
(window as any).exportToPDF = exportToPDF;
(window as any).clearCompositedImages = clearCompositedImages;

async function downloadImage() {
  if (!compositedImageDataURLs.length) {
    alert('请先合成图片！');
    return;
  }

  const downloadProgress = document.getElementById('downloadProgress') as HTMLDivElement;
  const progressBar = document.getElementById('progressBar') as HTMLProgressElement;
  const progressText = document.getElementById('progressText') as HTMLSpanElement;

  downloadProgress.style.display = 'block';
  updateProgress(progressBar, progressText, 0);

  const zip = new JSZip();
  const totalSteps = compositedImageDataURLs.length;
  const progressIncrement = 100 / totalSteps;

  compositedImageDataURLs.forEach((dataURL, index) => {
    const fileName = `composited_image_${index + 1}.jpg`;
    zip.file(fileName, dataURL.split(',')[1], {base64: true});
    updateProgress(progressBar, progressText, (index + 1) * progressIncrement);
  });

  const content = await zip.generateAsync({type:"blob"}, 
    (metadata: { percent: number }) => {
      const finalProgress = ((totalSteps - 1) + metadata.percent / 100) * progressIncrement;
      updateProgress(progressBar, progressText, finalProgress);
    }
  );

  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = 'composited_images.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  updateProgress(progressBar, progressText, 100);

  setTimeout(() => {
    downloadProgress.style.display = 'none';
  }, 1000);
}

function updateProgress(progressBar: HTMLProgressElement, progressText: HTMLSpanElement, value: number) {
  progressBar.value = value;
  progressText.textContent = `${Math.round(value)}%`;
}

function exportToExcel() {
  if (!compositedImageDataURLs.length) {
    alert('请先合成图片！');
    return;
  }

  const workbook = XLSX.utils.book_new();

  compositedImageDataURLs.forEach((dataURL, index) => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      [`合成图片 ${index + 1}`],
      [''],
      [dataURL]
    ]);
    
    worksheet['!cols'] = [{ wch: 100 }];
    worksheet['!rows'] = { '0': { hpt: 30 }, '1': { hpt: 30 }, '2': { hpt: 100 } };

    XLSX.utils.book_append_sheet(workbook, worksheet, `合成图片 ${index + 1}`);
  });

  XLSX.writeFile(workbook, 'composited_images.xlsx');
}

function exportToPDF() {
  if (!compositedImageDataURLs.length) {
    alert('请先合成图片！');
    return;
  }

  // 修改这一行
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  compositedImageDataURLs.forEach((dataURL, index) => {
    if (index > 0) doc.addPage();
    const img = new Image();
    img.src = dataURL;
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const ratio = Math.min(pdfWidth / img.width, pdfHeight / img.height);
    const width = img.width * ratio;
    const height = img.height * ratio;
    const x = (pdfWidth - width) / 2;
    const y = (pdfHeight - height) / 2;
    doc.addImage(dataURL, 'PNG', x, y, width, height);
  });

  doc.save('composited_images.pdf');
}

function clearCompositedImages() {
  compositedImageDataURLs = [];
  uploadedImages = [];
  (document.getElementById('preview') as HTMLDivElement).innerHTML = '';
  (document.getElementById('imageUpload') as HTMLInputElement).value = '';
  showMessage('已清除所有图片和合成结果！');
}

// 将函数赋值给 window 对象
(window as any).uploadImages = uploadImages;
(window as any).compositeImages = compositeImages;
(window as any).downloadImage = downloadImage;
(window as any).exportToExcel = exportToExcel;
(window as any).exportToPDF = exportToPDF;
(window as any).clearCompositedImages = clearCompositedImages;