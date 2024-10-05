declare global {
  interface Window {
    uploadImages: () => void;
    compositeImages: () => Promise<void>;
    downloadImage: () => Promise<void>;
    exportToExcel: () => void;
    exportToPDF: () => void;
    clearCompositedImages: () => void;
    jspdf: {
      jsPDF: new () => any;
    };
  }
}

export {};