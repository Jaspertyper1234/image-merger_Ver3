// 将函数赋值给 window 对象
window.uploadImages = uploadImages;
window.compositeImages = compositeImages;
window.downloadImage = downloadImage;
window.exportToExcel = exportToExcel;
window.exportToPDF = exportToPDF;
window.clearCompositedImages = clearCompositedImages;

let uploadedImages: string[] = [];
let compositedImageDataURLs: string[] = [];

function uploadImages() {
  console.log('uploadImages called');
  const input = document.getElementById('imageUpload') as HTMLInputElement;
  const files = Array.from(input.files || []);
  
  if (files.length === 0) {
    alert('请选择至少一张图片！');
    return;
  }

  files.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}));
  
  uploadedImages = [];
  
  let loadedCount = 0;
  const totalFiles = files.length;
  
  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedImages[index] = e.target?.result as string;
      loadedCount++;
      if (loadedCount === totalFiles) {
        showMessage(`成功上传 ${totalFiles} 张图片！`);
      }
    }
    reader.readAsDataURL(file);
  });
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

  // 修改这里
  const worker = new Worker(new URL('./imageProcessor.ts', import.meta.url), { type: 'module' });
  
  worker.onmessage = (e: MessageEvent) => {
    compositedImageDataURLs = e.data;
    displayPreview(compositedImageDataURLs);
    showMessage('图片合成成功！');
  };

  worker.postMessage({
    images: uploadedImages,
    options: { type, gap, interval, maxWidth, maxHeight, rows, cols }
  });
}

async function getMaxDimensions(imageSources: string[]): Promise<{ maxWidth: number, maxHeight: number }> {
  const images = await Promise.all(imageSources.map(src => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }));

  const maxWidth = Math.max(...images.map(img => img.width));
  const maxHeight = Math.max(...images.map(img => img.height));
  return { maxWidth, maxHeight };
}

function getGridDimensions(type: number): { rows: number, cols: number } {
  let rows: number, cols: number;
  if (type <= 3) {
    rows = 1;
    cols = type;
  } else if (type <= 4) {
    rows = 2;
    cols = 2;
  } else if (type <= 6) {
    rows = 2;
    cols = 3;
  } else if (type <= 9) {
    rows = 3;
    cols = 3;
  } else {
    throw new Error('不支持的合成类型');
  }
  return { rows, cols };
}

function displayPreview(compositedImageDataURLs: string[]) {
  const preview = document.getElementById('preview')!;
  preview.innerHTML = '';

  compositedImageDataURLs.forEach((dataURL, index) => {
    const img = document.createElement('img');
    img.src = dataURL;
    img.alt = `合成图片预览 ${index + 1}`;
    img.title = "点击查看原始大小";
    img.style.maxWidth = '200px';
    img.style.margin = '5px';
    img.addEventListener('click', function() {
      window.open(dataURL, '_blank');
    });
    preview.appendChild(img);
  });
}

function showMessage(message: string) {
  const messageDiv = document.getElementById('message')!;
  messageDiv.textContent = message;
  setTimeout(() => {
    messageDiv.textContent = '';
  }, 3000);
}

// 添加 exportToExcel 函数
function exportToExcel() {
  if (!compositedImageDataURLs.length) {
    alert('请先合成图片！');
    return;
  }

  // 创建一个新的工作簿
  const workbook = XLSX.utils.book_new();
  
  compositedImageDataURLs.forEach((dataURL, index) => {
    // 为每张图片创建一个新的工作表
    const worksheet = XLSX.utils.aoa_to_sheet([
      [`合成图片 ${index + 1}`],
      ['图片链接（请复制此链接到浏览器中查看）'],
      [dataURL]
    ]);
    
    // 设置单元格的宽度和高度
    const col_width = [{ wch: 100 }]; // 设置列宽
    const row_height = { '0': 30, '1': 30, '2': 100 }; // 设置行高
    worksheet['!cols'] = col_width;
    worksheet['!rows'] = row_height;

    // 设置单元格样式
    worksheet['A1'] = { t: 's', v: `合成图片 ${index + 1}`, s: { font: { bold: true, sz: 14 } } };
    worksheet['A2'] = { t: 's', v: '图片链接（请复制此链接到浏览器中查看）', s: { font: { italic: true } } };
    worksheet['A3'] = { t: 's', v: dataURL, s: { alignment: { wrapText: true } } };

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, `合成图片 ${index + 1}`);
  });

  // 生成Excel文件并下载
  XLSX.writeFile(workbook, "composited_images.xlsx");
}

// 添加 downloadImage 函数
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

// 添加 exportToPDF 函数
function exportToPDF() {
  if (!compositedImageDataURLs.length) {
    alert('请先合成图片！');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let currentPage = 0;

  function addImageToPDF() {
    if (currentPage >= compositedImageDataURLs.length) {
      // 所有图片都已添加，保存PDF
      doc.save('composited_images.pdf');
      return;
    }

    const img = new Image();
    img.src = compositedImageDataURLs[currentPage];
    img.onload = function() {
      // 计算图片在PDF中的尺寸和位置
      const imgWidth = img.width;
      const imgHeight = img.height;
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const width = imgWidth * ratio;
      const height = imgHeight * ratio;
      const x = (pdfWidth - width) / 2;
      const y = (pdfHeight - height) / 2;

      // 如果不是第一页，添加新页
      if (currentPage > 0) {
        doc.addPage();
      }

      // 将图片添加到PDF
      doc.addImage(compositedImageDataURLs[currentPage], 'PNG', x, y, width, height);

      currentPage++;
      addImageToPDF(); // 递归调用以添加下一张图片
    };
  }

  addImageToPDF();
}

// 添加 clearCompositedImages 函数
function clearCompositedImages() {
  compositedImageDataURLs = []; // 清空合成图片数组
  uploadedImages = []; // 清空上传的原始图片数组
  const preview = document.getElementById('preview')!;
  preview.innerHTML = ''; // 清空预览区域
  
  // 重置文件输入框
  const imageUpload = document.getElementById('imageUpload') as HTMLInputElement;
  imageUpload.value = '';
  
  // 清空进度条
  const progressBar = document.getElementById('progressBar') as HTMLProgressElement;
  const progressText = document.getElementById('progressText') as HTMLSpanElement;
  progressBar.value = 0;
  progressText.textContent = '0%';
  
  // 隐藏下载进度
  const downloadProgress = document.getElementById('downloadProgress') as HTMLDivElement;
  downloadProgress.style.display = 'none';
  
  showMessage('已清除所有图片和合成结果！');
}

// 添加类型声明
declare const XLSX: any;
declare const JSZip: any;
declare const jspdf: { jsPDF: any };

// 修改事件监听器
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

// 删除之前直接添加事件监听器的代码