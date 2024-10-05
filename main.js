"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// 将函数赋值给 window 对象
window.uploadImages = uploadImages;
window.compositeImages = compositeImages;
window.downloadImage = downloadImage;
window.exportToExcel = exportToExcel;
window.exportToPDF = exportToPDF;
window.clearCompositedImages = clearCompositedImages;
var uploadedImages = [];
var compositedImageDataURLs = [];
function uploadImages() {
    console.log('uploadImages called');
    var input = document.getElementById('imageUpload');
    var files = Array.from(input.files || []);
    if (files.length === 0) {
        alert('请选择至少一张图片！');
        return;
    }
    files.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }); });
    uploadedImages = [];
    var loadedCount = 0;
    var totalFiles = files.length;
    files.forEach(function (file, index) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var _a;
            uploadedImages[index] = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
            loadedCount++;
            if (loadedCount === totalFiles) {
                showMessage("\u6210\u529F\u4E0A\u4F20 ".concat(totalFiles, " \u5F20\u56FE\u7247\uFF01"));
            }
        };
        reader.readAsDataURL(file);
    });
}
function compositeImages() {
    return __awaiter(this, void 0, void 0, function () {
        var type, gap, interval, _a, maxWidth, maxHeight, _b, rows, cols, worker;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('compositeImages called');
                    type = parseInt(document.getElementById('compositeType').value);
                    gap = parseInt(document.getElementById('imageGap').value);
                    interval = parseInt(document.getElementById('compositeInterval').value);
                    if (uploadedImages.length < type) {
                        alert("\u56FE\u7247\u6570\u91CF\u4E0D\u8DB3\uFF0C\u8BF7\u4E0A\u4F20\u81F3\u5C11 ".concat(type, " \u5F20\u56FE\u7247\uFF01"));
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, getMaxDimensions(uploadedImages)];
                case 1:
                    _a = _c.sent(), maxWidth = _a.maxWidth, maxHeight = _a.maxHeight;
                    _b = getGridDimensions(type), rows = _b.rows, cols = _b.cols;
                    worker = new Worker(new URL('./imageProcessor.js', import.meta.url));
                    worker.onmessage = function (e) {
                        compositedImageDataURLs = e.data;
                        displayPreview(compositedImageDataURLs);
                        showMessage('图片合成成功！');
                    };
                    worker.postMessage({
                        images: uploadedImages,
                        options: { type: type, gap: gap, interval: interval, maxWidth: maxWidth, maxHeight: maxHeight, rows: rows, cols: cols }
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function getMaxDimensions(imageSources) {
    return __awaiter(this, void 0, void 0, function () {
        var images, maxWidth, maxHeight;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all(imageSources.map(function (src) {
                        return new Promise(function (resolve, reject) {
                            var img = new Image();
                            img.onload = function () { return resolve(img); };
                            img.onerror = reject;
                            img.src = src;
                        });
                    }))];
                case 1:
                    images = _a.sent();
                    maxWidth = Math.max.apply(Math, images.map(function (img) { return img.width; }));
                    maxHeight = Math.max.apply(Math, images.map(function (img) { return img.height; }));
                    return [2 /*return*/, { maxWidth: maxWidth, maxHeight: maxHeight }];
            }
        });
    });
}
function getGridDimensions(type) {
    var rows, cols;
    if (type <= 3) {
        rows = 1;
        cols = type;
    }
    else if (type <= 4) {
        rows = 2;
        cols = 2;
    }
    else if (type <= 6) {
        rows = 2;
        cols = 3;
    }
    else if (type <= 9) {
        rows = 3;
        cols = 3;
    }
    else {
        throw new Error('不支持的合成类型');
    }
    return { rows: rows, cols: cols };
}
function displayPreview(compositedImageDataURLs) {
    var preview = document.getElementById('preview');
    preview.innerHTML = '';
    compositedImageDataURLs.forEach(function (dataURL, index) {
        var img = document.createElement('img');
        img.src = dataURL;
        img.alt = "\u5408\u6210\u56FE\u7247\u9884\u89C8 ".concat(index + 1);
        img.title = "点击查看原始大小";
        img.style.maxWidth = '200px';
        img.style.margin = '5px';
        img.addEventListener('click', function () {
            window.open(dataURL, '_blank');
        });
        preview.appendChild(img);
    });
}
function showMessage(message) {
    var messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    setTimeout(function () {
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
    var workbook = XLSX.utils.book_new();
    compositedImageDataURLs.forEach(function (dataURL, index) {
        // 为每张图片创建一个新的工作表
        var worksheet = XLSX.utils.aoa_to_sheet([
            ["\u5408\u6210\u56FE\u7247 ".concat(index + 1)],
            ['图片链接（请复制此链接到浏览器中查看）'],
            [dataURL]
        ]);
        // 设置单元格的宽度和高度
        var col_width = [{ wch: 100 }]; // 设置列宽
        var row_height = { '0': 30, '1': 30, '2': 100 }; // 设置行高
        worksheet['!cols'] = col_width;
        worksheet['!rows'] = row_height;
        // 设置单元格样式
        worksheet['A1'] = { t: 's', v: "\u5408\u6210\u56FE\u7247 ".concat(index + 1), s: { font: { bold: true, sz: 14 } } };
        worksheet['A2'] = { t: 's', v: '图片链接（请复制此链接到浏览器中查看）', s: { font: { italic: true } } };
        worksheet['A3'] = { t: 's', v: dataURL, s: { alignment: { wrapText: true } } };
        // 将工作表添加到工作簿
        XLSX.utils.book_append_sheet(workbook, worksheet, "\u5408\u6210\u56FE\u7247 ".concat(index + 1));
    });
    // 生成Excel文件并下载
    XLSX.writeFile(workbook, "composited_images.xlsx");
}
// 添加 downloadImage 函数
function downloadImage() {
    return __awaiter(this, void 0, void 0, function () {
        var downloadProgress, progressBar, progressText, zip, totalSteps, progressIncrement, content, link;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!compositedImageDataURLs.length) {
                        alert('请先合成图片！');
                        return [2 /*return*/];
                    }
                    downloadProgress = document.getElementById('downloadProgress');
                    progressBar = document.getElementById('progressBar');
                    progressText = document.getElementById('progressText');
                    downloadProgress.style.display = 'block';
                    updateProgress(progressBar, progressText, 0);
                    zip = new JSZip();
                    totalSteps = compositedImageDataURLs.length;
                    progressIncrement = 100 / totalSteps;
                    compositedImageDataURLs.forEach(function (dataURL, index) {
                        var fileName = "composited_image_".concat(index + 1, ".jpg");
                        zip.file(fileName, dataURL.split(',')[1], { base64: true });
                        updateProgress(progressBar, progressText, (index + 1) * progressIncrement);
                    });
                    return [4 /*yield*/, zip.generateAsync({ type: "blob" }, function (metadata) {
                            var finalProgress = ((totalSteps - 1) + metadata.percent / 100) * progressIncrement;
                            updateProgress(progressBar, progressText, finalProgress);
                        })];
                case 1:
                    content = _a.sent();
                    link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = 'composited_images.zip';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    updateProgress(progressBar, progressText, 100);
                    setTimeout(function () {
                        downloadProgress.style.display = 'none';
                    }, 1000);
                    return [2 /*return*/];
            }
        });
    });
}
function updateProgress(progressBar, progressText, value) {
    progressBar.value = value;
    progressText.textContent = "".concat(Math.round(value), "%");
}
// 添加 exportToPDF 函数
function exportToPDF() {
    if (!compositedImageDataURLs.length) {
        alert('请先合成图片！');
        return;
    }
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF();
    var currentPage = 0;
    function addImageToPDF() {
        if (currentPage >= compositedImageDataURLs.length) {
            // 所有图片都已添加，保存PDF
            doc.save('composited_images.pdf');
            return;
        }
        var img = new Image();
        img.src = compositedImageDataURLs[currentPage];
        img.onload = function () {
            // 计算图片在PDF中的尺寸和位置
            var imgWidth = img.width;
            var imgHeight = img.height;
            var pdfWidth = doc.internal.pageSize.getWidth();
            var pdfHeight = doc.internal.pageSize.getHeight();
            var ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            var width = imgWidth * ratio;
            var height = imgHeight * ratio;
            var x = (pdfWidth - width) / 2;
            var y = (pdfHeight - height) / 2;
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
    var preview = document.getElementById('preview');
    preview.innerHTML = ''; // 清空预览区域
    // 重置文件输入框
    var imageUpload = document.getElementById('imageUpload');
    imageUpload.value = '';
    // 清空进度条
    var progressBar = document.getElementById('progressBar');
    var progressText = document.getElementById('progressText');
    progressBar.value = 0;
    progressText.textContent = '0%';
    // 隐藏下载进度
    var downloadProgress = document.getElementById('downloadProgress');
    downloadProgress.style.display = 'none';
    showMessage('已清除所有图片和合成结果！');
}
// 修改事件监听器
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('imageUpload').addEventListener('change', uploadImages);
    document.getElementById('uploadButton').addEventListener('click', function () {
        document.getElementById('imageUpload').click();
    });
    document.getElementById('compositeButton').addEventListener('click', compositeImages);
    document.getElementById('downloadButton').addEventListener('click', downloadImage);
    document.getElementById('exportExcelButton').addEventListener('click', exportToExcel);
    document.getElementById('exportPDFButton').addEventListener('click', exportToPDF);
    document.getElementById('clearButton').addEventListener('click', clearCompositedImages);
});
// 删除之前直接添加事件监听器的代码
