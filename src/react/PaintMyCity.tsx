import { useState, useEffect } from 'react';
import { fetchCityPOIs, searchImages } from '../utils/wikipedia';
import type { ImageResult } from '../utils/wikipedia';
import { compositeBubbles } from '../utils/painter';
import { initializeModel, applyStyle, getAvailableStyles } from '../utils/stylist';

type Step = 'input' | 'select-pois' | 'select-images' | 'compose' | 'select-style' | 'stylize' | 'complete';

interface SelectedPOI {
  name: string;
  images: ImageResult[];
  selectedImage?: ImageResult;
}

const STYLE_IMAGE_URLS: { [key: string]: string } = {
  wave: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/The_Great_Wave_off_Kanagawa.jpg/512px-The_Great_Wave_off_Kanagawa.jpg',
  scream: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg/512px-Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg',
  udnie: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Femme_au_cheval_Picabia.jpg/512px-Femme_au_cheval_Picabia.jpg',
  rain_princess: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/512px-Tsunami_by_hokusai_19th_century.jpg',
  la_muse: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Pablo_Picasso%2C_1909-10%2C_Figure_dans_un_Fauteuil_%28Seated_Nude%2C_Femme_nue_assise%29%2C_oil_on_canvas%2C_92.1_x_73_cm%2C_Tate_Modern%2C_London.jpg/512px-Pablo_Picasso%2C_1909-10%2C_Figure_dans_un_Fauteuil_%28Seated_Nude%2C_Femme_nue_assise%29%2C_oil_on_canvas%2C_92.1_x_73_cm%2C_Tate_Modern%2C_London.jpg',
  shipwreck: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/J._M._W._Turner_-_Snow_Storm_-_Steam-Boat_off_a_Harbour%27s_Mouth_-_WGA23178.jpg/512px-J._M._W._Turner_-_Snow_Storm_-_Steam-Boat_off_a_Harbour%27s_Mouth_-_WGA23178.jpg',
};

function getStyleImageUrl(style: string): string {
  return STYLE_IMAGE_URLS[style] || '';
}

function PaintMyCity() {
  const [step, setStep] = useState<Step>('input');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  
  useEffect(() => {
    document.title = 'PaintMyCity | Eric Van Lare';
    return () => {
      document.title = 'Eric Van Lare';
    };
  }, []);
  
  const [pois, setPois] = useState<string[]>([]);
  const [selectedPOIs, setSelectedPOIs] = useState<Set<string>>(new Set());
  
  const [poisWithImages, setPoisWithImages] = useState<SelectedPOI[]>([]);
  const [cityImages, setCityImages] = useState<ImageResult[]>([]);
  const [selectedCityImage, setSelectedCityImage] = useState<ImageResult | null>(null);
  
  const [composedCanvas, setComposedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);
  
  const [stylizeProgress, setStylizeProgress] = useState(0);
  const [finalCanvas, setFinalCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    document.title = 'PaintMyCity - Eric Van Lare';
    setAvailableStyles(getAvailableStyles());
    setModelStatus('loading');
    setError('');
    initializeModel()
      .then(() => {
        setModelStatus('ready');
        console.log('TensorFlow model loaded (20MB)');
      })
      .catch((err) => {
        setModelStatus('error');
        console.error('Failed to load model:', err);
      });
  }, []);

  const handleResearch = async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const foundPois = await fetchCityPOIs(city, state || undefined);
      
      if (foundPois.length === 0) {
        setError('No points of interest found for this city. Try adding a state or checking the spelling.');
        setIsLoading(false);
        return;
      }

      setPois(foundPois);
      setStep('select-pois');
    } catch (err) {
      setError('Failed to fetch city information. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePOISelect = async () => {
    if (selectedPOIs.size === 0) {
      setError('Please select at least one point of interest');
      return;
    }

    if (selectedPOIs.size > 4) {
      setError('Please select at most 4 points of interest');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cityQuery = state ? `${city}, ${state}` : city;
      const [cityImagesResult, ...poiImagesResults] = await Promise.all([
        searchImages(cityQuery, 8),
        ...Array.from(selectedPOIs).map(poi => searchImages(poi, 5))
      ]);

      setCityImages(cityImagesResult);
      
      const poisData = Array.from(selectedPOIs).map((poi, idx) => ({
        name: poi,
        images: poiImagesResults[idx] || [],
      }));

      setPoisWithImages(poisData);
      setStep('select-images');
    } catch (err) {
      setError('Failed to fetch images. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const canCompose = selectedCityImage && poisWithImages.every(poi => poi.selectedImage);

  const handleCompose = async () => {
    if (!canCompose) {
      setError('Please select a background image and one image for each POI');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const featureUrls = poisWithImages
        .map(poi => poi.selectedImage!.url)
        .filter(Boolean);

      const canvas = await compositeBubbles(
        selectedCityImage!.url,
        featureUrls,
        128,
        16
      );

      setComposedCanvas(canvas);
      setStep('select-style');
    } catch (err) {
      setError('Failed to compose images. Some images may have CORS restrictions. Try selecting different images.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStylize = async () => {
    if (!composedCanvas || !selectedStyle) {
      setError('Please select a style');
      return;
    }

    if (modelStatus !== 'ready') {
      setError('Style transfer model is still loading. Please wait...');
      return;
    }

    setIsLoading(true);
    setError('');
    setStylizeProgress(0);
    setStep('stylize');

    try {
      const styledCanvas = await applyStyle(
        composedCanvas,
        selectedStyle,
        0.3,
        (progress) => setStylizeProgress(Math.round(progress * 100))
      );

      setFinalCanvas(styledCanvas);
      setStep('complete');
    } catch (err) {
      setError('Style transfer failed. Please try again.');
      console.error(err);
      setStep('select-style');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!finalCanvas) return;

    finalCanvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${city.toLowerCase().replace(/\s+/g, '-')}-painted.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleReset = () => {
    setStep('input');
    setCity('');
    setState('');
    setPois([]);
    setSelectedPOIs(new Set());
    setPoisWithImages([]);
    setCityImages([]);
    setSelectedCityImage(null);
    setComposedCanvas(null);
    setSelectedStyle('');
    setFinalCanvas(null);
    setError('');
  };

  return (
    <main className="min-h-screen flex flex-col px-6 md:px-12 lg:px-24 max-w-6xl mx-auto py-12">
      <section className="mb-8">
        <a href="/" className="inline-block mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
          ← Back to Home
        </a>
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight text-gray-900 dark:text-gray-100">
          Paint My City
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-4">
          Transform your city into art. Research landmarks, compose them into a scene, and apply neural style transfer.
        </p>
        {modelStatus === 'loading' && (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Loading AI model (20MB)...
          </p>
        )}
        {modelStatus === 'error' && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load AI model. Style transfer will not be available.
          </p>
        )}
      </section>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {step === 'input' && (
        <section className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                City Name *
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="San Francisco"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                State (optional)
              </label>
              <input
                id="state"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="California"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
              />
            </div>
          </div>

          <button
            onClick={handleResearch}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? 'Researching...' : 'Research'}
          </button>
        </section>
      )}

      {step === 'select-pois' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              Select Points of Interest
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Choose 1-4 landmarks to feature (found {pois.length} POIs)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pois.map((poi) => (
              <button
                key={poi}
                onClick={() => {
                  const newSet = new Set(selectedPOIs);
                  if (newSet.has(poi)) {
                    newSet.delete(poi);
                  } else if (newSet.size < 4) {
                    newSet.add(poi);
                  }
                  setSelectedPOIs(newSet);
                }}
                className={`p-4 text-left border rounded-lg transition-all ${
                  selectedPOIs.has(poi)
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                <span className="text-gray-900 dark:text-gray-100">{poi}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('input')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handlePOISelect}
              disabled={isLoading || selectedPOIs.size === 0}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Fetching Images...' : `Continue (${selectedPOIs.size} selected)`}
            </button>
          </div>
        </section>
      )}

      {step === 'select-images' && (
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              Select Background Image
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Choose a background for {city}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cityImages.map((img) => (
              <button
                key={img.url}
                onClick={() => setSelectedCityImage(img)}
                className={`relative rounded-lg overflow-hidden border-4 transition-all ${
                  selectedCityImage?.url === img.url
                    ? 'border-blue-600'
                    : 'border-transparent hover:border-blue-300'
                }`}
              >
                <img
                  src={img.thumbnail}
                  alt={img.title}
                  className="w-full aspect-square object-cover"
                />
              </button>
            ))}
          </div>

          {poisWithImages.map((poi) => (
            <div key={poi.name}>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                {poi.name}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {poi.images.map((img) => (
                  <button
                    key={img.url}
                    onClick={() => {
                      setPoisWithImages(prev =>
                        prev.map(p =>
                          p.name === poi.name
                            ? { ...p, selectedImage: img }
                            : p
                        )
                      );
                    }}
                    className={`relative rounded-lg overflow-hidden border-4 transition-all ${
                      poi.selectedImage?.url === img.url
                        ? 'border-blue-600'
                        : 'border-transparent hover:border-blue-300'
                    }`}
                  >
                    <img
                      src={img.thumbnail}
                      alt={img.title}
                      className="w-full aspect-square object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-4">
            <button
              onClick={() => setStep('select-pois')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleCompose}
              disabled={isLoading || !canCompose}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Composing...' : 'Compose'}
            </button>
          </div>
        </section>
      )}

      {(step === 'select-style' || step === 'stylize') && composedCanvas && (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              Composed Scene
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {step === 'select-style' ? 'Select a style to apply' : 'Applying style transfer...'}
            </p>
          </div>

          <div className="flex justify-center">
            <img
              src={composedCanvas.toDataURL()}
              alt="Composed scene"
              className="max-w-full rounded-lg shadow-lg"
            />
          </div>

          {step === 'select-style' && (
            <>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Select Style
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableStyles.map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedStyle === style
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      <img
                        src={getStyleImageUrl(style)}
                        alt={style}
                        className="w-full aspect-square object-cover rounded mb-2"
                        crossOrigin="anonymous"
                      />
                      <span className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                        {style.replace(/_/g, ' ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ Style transfer takes 5-15 seconds to complete. Please be patient.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('select-images')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleStylize}
                  disabled={isLoading || !selectedStyle || modelStatus !== 'ready'}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                >
                  {isLoading ? 'Stylizing...' : 'Stylize'}
                </button>
              </div>
            </>
          )}

          {step === 'stylize' && (
            <div className="space-y-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${stylizeProgress}%` }}
                />
              </div>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Processing: {stylizeProgress}%
              </p>
            </div>
          )}
        </section>
      )}

      {step === 'complete' && finalCanvas && (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              Your Painted City
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {city} reimagined through art
            </p>
          </div>

          <div className="flex justify-center">
            <img
              src={finalCanvas.toDataURL()}
              alt="Styled result"
              className="max-w-full rounded-lg shadow-2xl"
            />
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleDownload}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-lg"
            >
              Download Image
            </button>
            <button
              onClick={handleReset}
              className="px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-lg"
            >
              Create Another
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default PaintMyCity;
