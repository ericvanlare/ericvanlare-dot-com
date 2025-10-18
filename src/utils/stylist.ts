import { ArbitraryStyleTransferNetwork } from '@magenta/image';

let cachedModel: ArbitraryStyleTransferNetwork | null = null;
let modelLoading: Promise<ArbitraryStyleTransferNetwork> | null = null;

const STYLE_IMAGES: { [key: string]: string } = {
  wave: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/The_Great_Wave_off_Kanagawa.jpg/512px-The_Great_Wave_off_Kanagawa.jpg',
  scream: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg/512px-Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg',
  udnie: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Femme_au_cheval_Picabia.jpg/512px-Femme_au_cheval_Picabia.jpg',
  rain_princess: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/512px-Tsunami_by_hokusai_19th_century.jpg',
  la_muse: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Pablo_Picasso%2C_1909-10%2C_Figure_dans_un_Fauteuil_%28Seated_Nude%2C_Femme_nue_assise%29%2C_oil_on_canvas%2C_92.1_x_73_cm%2C_Tate_Modern%2C_London.jpg/512px-Pablo_Picasso%2C_1909-10%2C_Figure_dans_un_Fauteuil_%28Seated_Nude%2C_Femme_nue_assise%29%2C_oil_on_canvas%2C_92.1_x_73_cm%2C_Tate_Modern%2C_London.jpg',
  shipwreck: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/J._M._W._Turner_-_Snow_Storm_-_Steam-Boat_off_a_Harbour%27s_Mouth_-_WGA23178.jpg/512px-J._M._W._Turner_-_Snow_Storm_-_Steam-Boat_off_a_Harbour%27s_Mouth_-_WGA23178.jpg',
};

export async function initializeModel(): Promise<ArbitraryStyleTransferNetwork> {
  if (cachedModel) {
    return cachedModel;
  }

  if (modelLoading) {
    return modelLoading;
  }

  modelLoading = (async () => {
    try {
      const model = new ArbitraryStyleTransferNetwork();
      await model.initialize();
      cachedModel = model;
      return model;
    } catch (error) {
      modelLoading = null;
      throw new Error(`Failed to load style transfer model: ${error}`);
    }
  })();

  return modelLoading;
}

async function loadStyleImage(stylePreset: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load style image: ${stylePreset}`));
    
    const stylePath = STYLE_IMAGES[stylePreset];
    if (!stylePath) {
      reject(new Error(`Unknown style preset: ${stylePreset}`));
      return;
    }
    
    img.src = stylePath;
  });
}

function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.putImageData(imageData, 0, 0);
  }
  
  return canvas;
}

function resizeCanvas(canvas: HTMLCanvasElement, maxSize: number = 512): HTMLCanvasElement {
  const scale = Math.min(maxSize / canvas.width, maxSize / canvas.height, 1);
  
  if (scale >= 1) return canvas;
  
  const resized = document.createElement('canvas');
  resized.width = Math.floor(canvas.width * scale);
  resized.height = Math.floor(canvas.height * scale);
  
  const ctx = resized.getContext('2d');
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, resized.width, resized.height);
  }
  
  return resized;
}

export async function applyStyle(
  contentCanvas: HTMLCanvasElement,
  stylePreset: string,
  strength: number = 1.0,
  onProgress?: (progress: number) => void
): Promise<HTMLCanvasElement> {
  try {
    if (onProgress) onProgress(0.1);

    // Resize if too large (max 1024px to balance quality and WebGL limits)
    const resizedContent = resizeCanvas(contentCanvas, 1024);
    console.log(`Resized canvas from ${contentCanvas.width}x${contentCanvas.height} to ${resizedContent.width}x${resizedContent.height}`);

    const model = await initializeModel();
    if (onProgress) onProgress(0.3);

    const styleImage = await loadStyleImage(stylePreset);
    if (onProgress) onProgress(0.4);

    if (onProgress) onProgress(0.5);

    const styledImageData = await model.stylize(resizedContent, styleImage, strength);

    if (onProgress) onProgress(0.9);

    const resultCanvas = imageDataToCanvas(styledImageData);

    if (onProgress) onProgress(1.0);

    return resultCanvas;
  } catch (error) {
    throw new Error(`Style transfer failed: ${error}`);
  }
}

export function getAvailableStyles(): string[] {
  return Object.keys(STYLE_IMAGES);
}

export function disposeModel(): void {
  if (cachedModel) {
    cachedModel.dispose();
    cachedModel = null;
  }
  modelLoading = null;
}
