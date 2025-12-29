/**
 * Find Product Features Module
 * Analyzes text and/or images to extract product features using NeuroLink SDK
 */

import { NeuroLink } from "@juspay/neurolink";
import fs from "fs";
import path from "path";

/**
 * Reads image files and returns buffers
 * @param {string[]} imagePaths - Array of image file paths
 * @returns {Buffer[]} Array of image buffers
 */
function readImageBuffers(imagePaths: string[]): Buffer[] {
  return imagePaths.map(imgPath => {
    try {
      return fs.readFileSync(path.resolve(imgPath));
    } catch (error) {
      throw new Error(`Failed to read image file ${imgPath}: ${(error as Error).message}`);
    }
  });
}

/**
 * Validates input options for product search
 * @param {Object} options - Input options
 * @param {string} [options.productName] - Product name
 * @param {string} [options.mode] - Product mode
 * @param {string} [options.specification] - Product specification
 * @param {string[]} [options.images] - Array of image file paths
 * @throws {Error} If inputs are invalid
 */
function validateProductInputs(options: any): void {
  if (!options || (typeof options !== 'object')) {
    throw new Error('Options must be an object');
  }

  const { productName, mode, specification, images } = options;

  // Validate text inputs if provided
  if (productName !== undefined && typeof productName !== 'string') {
    throw new Error('productName must be a string if provided');
  }

  if (mode !== undefined && typeof mode !== 'string') {
    throw new Error('mode must be a string if provided');
  }

  if (specification !== undefined && typeof specification !== 'string') {
    throw new Error('specification must be a string if provided');
  }

  // Validate images if provided
  if (images && Array.isArray(images) && images.length > 0) {
    for (const imgPath of images) {
      if (typeof imgPath !== 'string') {
        throw new Error('Image paths must be strings');
      }
      const resolvedPath = path.resolve(imgPath);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Image file not found: ${imgPath}`);
      }
      // Check if it's a valid image file (basic check)
      const ext = path.extname(resolvedPath).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
        throw new Error(`Invalid image format: ${imgPath}. Supported formats: jpg, jpeg, png, gif, bmp, webp`);
      }
    }
  }
}

/**
 * Builds a product search query from user inputs and image analysis
 * @param {Object} options - Input options
 * @param {string} [options.productName] - Product name from user
 * @param {string} [options.mode] - Product mode/model from user
 * @param {string} [options.specification] - Product specification from user
 * @param {string[]} [options.images] - Array of image file paths
 * @param {Object} [options.config] - Additional configuration
 * @param {string} [options.config.provider='google-ai'] - AI provider
 * @param {string} [options.config.model='gemini-2.5-flash'] - Model to use
 * @returns {Promise<Object>} Result object with search query and metadata
 */
export async function findProductFeatures(options: any = {}): Promise<any> {
  try {
    // Validate inputs (now allows all inputs to be empty)
    validateProductInputs(options);

    const { productName, mode, specification, images, config = {} } = options;
    const { provider = 'google-ai', model = 'gemini-2.5-flash' } = config;

    // Combine user text inputs
    const userText = [productName, mode, specification].filter(Boolean).join(' ');

    // Extract product name from images
    let imageProductName = '';
    if (images && images.length > 0) {
      imageProductName = await extractProductNameFromImages(images, provider, model);
    }

    // Build search query
    const searchQuery = buildSearchQuery(userText, imageProductName);

    console.log(`🔍 Product search query built: "${searchQuery}"`);

    return {
      success: true,
      searchQuery,
      metadata: {
        provider,
        model,
        userText,
        imageProductName,
        imageCount: images ? images.length : 0,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error(`❌ Error in findProductFeatures: ${(error as Error).message}`);
    return {
      success: false,
      error: (error as Error).message,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Extracts product name from images
 * @param {string[]} images - Array of image file paths
 * @param {string} provider - AI provider
 * @param {string} model - Model to use
 * @returns {Promise<string>} Extracted product name
 */
async function extractProductNameFromImages(images: string[], provider: string, model: string): Promise<string> {
  const neurolink = new NeuroLink();

  const generateOptions = {
    input: {
      text: "Give the name of the product in single line",
      images: readImageBuffers(images)
    },
    output: {
      format: "text" as const
    },
    provider,
    model
  };

  console.log(`🖼️  Extracting product name from ${images.length} image(s)...`);

  const result = await neurolink.generate(generateOptions);

  if (!result.content) {
    throw new Error('No content received from AI provider for image analysis');
  }

  // Clean and return the product name
  return result.content.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Builds search query by combining user text with unique words from image response
 * @param {string} userText - Combined user inputs
 * @param {string} imageText - Text extracted from images
 * @returns {string} Formed search query
 */
function buildSearchQuery(userText: string, imageText: string): string {
  if (!userText && !imageText) return '';

  const userWords = userText.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  const imageWords = imageText.toLowerCase().split(/\s+/).filter(word => word.length > 0);

  // Find words in image text that are not in user text
  const uniqueImageWords = imageWords.filter(word =>
    !userWords.includes(word) &&
    word.length > 2 && // Filter out very short words
    !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'product', 'model'].includes(word) // Filter common words
  );

  // Combine user text with unique image words
  const combinedWords = [...userWords, ...uniqueImageWords];

  // Remove duplicates and join
  const uniqueWords = [...new Set(combinedWords)];

  return uniqueWords.join(' ').trim();
}

// Export default
export default findProductFeatures;
