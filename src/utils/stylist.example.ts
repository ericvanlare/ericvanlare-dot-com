import { initializeModel, applyStyle, getAvailableStyles, disposeModel } from './stylist';

export async function exampleUsage() {
  const availableStyles = getAvailableStyles();
  console.log('Available styles:', availableStyles);

  const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
  
  const styledCanvas = await applyStyle(
    canvas,
    'wave',
    1.0,
    (progress) => {
      console.log(`Progress: ${Math.round(progress * 100)}%`);
    }
  );

  document.body.appendChild(styledCanvas);
}

export async function preloadModel() {
  try {
    await initializeModel();
    console.log('Model preloaded successfully');
  } catch (error) {
    console.error('Failed to preload model:', error);
  }
}

export function cleanupModel() {
  disposeModel();
  console.log('Model cleaned up');
}
