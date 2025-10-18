export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    
    img.src = url;
  });
}

export function createCircleMask(
  diameter: number,
  image: HTMLImageElement
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = diameter;
  canvas.height = diameter;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  const radius = diameter / 2;
  const scale = Math.max(diameter / image.width, diameter / image.height);
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;
  const offsetX = (diameter - scaledWidth) / 2;
  const offsetY = (diameter - scaledHeight) / 2;

  ctx.save();
  
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    image,
    offsetX,
    offsetY,
    scaledWidth,
    scaledHeight
  );

  ctx.restore();

  return canvas;
}

export async function compositeBubbles(
  backgroundUrl: string,
  featureUrls: string[],
  bubbleDiameter: number = 128,
  padding: number = 16
): Promise<HTMLCanvasElement> {
  if (featureUrls.length === 0 || featureUrls.length > 4) {
    throw new Error('Feature images must be between 1 and 4');
  }

  const background = await loadImage(backgroundUrl);
  const featureImages = await Promise.all(
    featureUrls.map(url => loadImage(url))
  );

  const canvas = document.createElement('canvas');
  canvas.width = background.width;
  canvas.height = background.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  ctx.drawImage(background, 0, 0);

  const numBubbles = featureImages.length;
  const totalBubblesWidth = numBubbles * bubbleDiameter;
  const totalPaddingWidth = (numBubbles - 1) * padding;
  const totalWidth = totalBubblesWidth + totalPaddingWidth;
  const margin = (background.width - totalWidth) / 2;

  const offsetY = (background.height - bubbleDiameter) / 4;

  featureImages.forEach((image, index) => {
    const circleMask = createCircleMask(bubbleDiameter, image);
    const offsetX = margin + index * (bubbleDiameter + padding);
    
    ctx.drawImage(circleMask, offsetX, offsetY);
  });

  return canvas;
}
