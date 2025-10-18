# Stylist - Neural Style Transfer Utility

Browser-based neural style transfer using TensorFlow.js and Magenta's Arbitrary Style Transfer model.

## Installation

Already installed:
```bash
npm install @tensorflow/tfjs @magenta/image
```

## Setup

### 1. Add Style Images

Place style reference images in `/public/styles/`:
- `wave.jpg` - The Great Wave off Kanagawa
- `scream.jpg` - The Scream
- `udnie.jpg` - Udnie
- `rain_princess.jpg` - Rain Princess
- `la_muse.jpg` - La Muse
- `shipwreck.jpg` - The Shipwreck of the Minotaur

See `/public/styles/README.md` for details.

## API

### `initializeModel()`
Loads and caches the style transfer model. Call this once before using `applyStyle()`.

```typescript
await initializeModel();
```

### `applyStyle(contentCanvas, stylePreset, strength?, onProgress?)`
Applies style transfer to a canvas element.

**Parameters:**
- `contentCanvas: HTMLCanvasElement` - The canvas with content to stylize
- `stylePreset: string` - Style name (e.g., 'wave', 'scream')
- `strength?: number` - Style strength (0-1, default: 1.0)
- `onProgress?: (progress: number) => void` - Progress callback (0-1)

**Returns:** `Promise<HTMLCanvasElement>` - Stylized canvas

```typescript
const styledCanvas = await applyStyle(
  myCanvas, 
  'wave',
  1.0,
  (progress) => console.log(`${Math.round(progress * 100)}%`)
);
```

### `getAvailableStyles()`
Returns array of available style names.

```typescript
const styles = getAvailableStyles();
// ['wave', 'scream', 'udnie', 'rain_princess', 'la_muse', 'shipwreck']
```

### `disposeModel()`
Cleans up the cached model to free memory.

```typescript
disposeModel();
```

## Usage Example

```typescript
import { initializeModel, applyStyle, getAvailableStyles } from './utils/stylist';

async function stylizeImage() {
  // Initialize model (do this once)
  await initializeModel();

  // Get your content canvas
  const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;

  // Apply style transfer
  const styledCanvas = await applyStyle(
    canvas,
    'wave',
    0.8, // 80% strength
    (progress) => {
      // Update loading UI
      progressBar.value = progress;
    }
  );

  // Use the result
  document.body.appendChild(styledCanvas);
}
```

## Performance Notes

- **First load**: Model download (~20MB) + initialization (~5-10s)
- **Subsequent calls**: Cached, much faster
- **Processing time**: 5-15 seconds depending on:
  - Image size
  - Device GPU capability
  - Browser performance

### Optimization Tips

1. **Preload the model** on app startup:
   ```typescript
   initializeModel().catch(console.error);
   ```

2. **Resize large images** before stylizing:
   ```typescript
   // Resize to max 512px to improve performance
   const maxSize = 512;
   if (canvas.width > maxSize || canvas.height > maxSize) {
     // Resize canvas first
   }
   ```

3. **Show loading UI** using the progress callback
4. **Dispose model** when not needed to free memory

## Limitations

- Requires modern browser with WebGL support
- Model download size: ~20MB
- Processing is CPU/GPU intensive
- Mobile devices may be slower
- Needs CORS-enabled style images

## Error Handling

```typescript
try {
  const result = await applyStyle(canvas, 'wave');
  // Success
} catch (error) {
  if (error.message.includes('load style image')) {
    console.error('Style image not found');
  } else if (error.message.includes('load style transfer model')) {
    console.error('Model failed to load');
  } else {
    console.error('Style transfer failed:', error);
  }
}
```

## Integration with PaintMyCity

The stylist is designed to work with the PaintMyCity canvas painter:

```typescript
import { getCanvas } from './utils/painter';
import { applyStyle } from './utils/stylist';

async function paintAndStylize(lat: number, lng: number) {
  // 1. Paint the map
  const canvas = await getCanvas(lat, lng);
  
  // 2. Apply style transfer
  const styledCanvas = await applyStyle(canvas, 'wave', 1.0);
  
  // 3. Display or download
  return styledCanvas;
}
```

## References

- [Magenta.js Image Models](https://github.com/magenta/magenta-js/tree/master/image)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Arbitrary Style Transfer Paper](https://arxiv.org/abs/1705.06830)
