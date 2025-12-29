# COMPETITIVE ANALYSIS

A competitor analysis tool that leverages multimodal AI and web search capabilities to analyze product images, extract features, and identify competitive pricing across online marketplaces.

## Overview

This project demonstrates how to:
- Analyze product images using NeuroLink AI to extract product names and features
- Build intelligent search queries combining user input and AI analysis
- Search for product prices using SerpAPI (Google Shopping)
- Display price comparison results in a formatted CLI table


---

## Table of Contents

1. [Problem Statement & Solution](#problem-statement--solution)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Strategy](#implementation-strategy)
4. [Core Functionality](#core-functionality)
5. [CLI Usage Examples](#cli-usage-examples)
6. [SDK Integration Examples](#sdk-integration-examples)
7. [Technical Implementation Details](#technical-implementation-details)
8. [Performance & Best Practices](#performance--best-practices)
9. [Troubleshooting & Debugging](#troubleshooting--debugging)

---

## How It Works

This demo showcases a **three-stage pipeline** for product search and price comparison:

1. **Product Analysis**: NeuroLink AI analyzes product images to extract product names and features, combined with user-provided specifications
2. **Query Building**: Intelligent search queries are constructed by merging AI-extracted information with user inputs
3. **Price Search**: SerpAPI searches Google Shopping for product prices across Indian e-commerce sites
4. **Results Display**: Price comparison results are presented in a formatted CLI table

---

## Architecture Overview

### Data Flow Diagram

```
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                              COMPETITIVE ANALYSIS WORKFLOW                                                   ║
╠══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                                              
║   📥 INPUT               🤖 PROCESSING           🔍 ANALYSIS             🌐 SEARCH               📊 OUTPUT                    
║  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌─────────────────┐          
║  │ • Product Name  │──▶│ • NeuroLink AI   │──▶│ • Query Builder  │──▶│ • SerpAPI Search │──▶│ • Price Table   │         
║  │ • Specifications│   │ • Image Analysis │   │ • Text Combine   │   │ • Google Shopping│   │ • CLI Display   │         
║  │ • Product Image │   │ • Gemini 2.5     │   │ • Smart Keywords │   │ • Indian Sites   │   │ • ₹ Format      │         
║  └─────────────────┘   └──────────────────┘   └──────────────────┘   └──────────────────┘   └─────────────────┘          
║                                                                                                                       
║  🔄 Data Flow: User Input → AI Analysis → Query Generation → Web Search → Formatted Results                           
║                                                                                                                       
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### Key Components

1. **Product Analyzer** (`find-product.ts`): Uses NeuroLink to analyze images and extract product information
2. **Query Builder**: Combines user inputs with AI image analysis to create effective search queries
3. **Price Searcher** (`search-product.ts`): Uses SerpAPI to search Google for prices
4. **Table Formatter**: Displays results in a readable CLI table format with Indian Rupee pricing

---

## Implementation Strategy

### Phase 1: Core AI Feature Extraction

**Objective**: Enable product image analysis and feature extraction

**Key Components**:
- NeuroLink integration for multimodal analysis
- Product feature extraction from images
- Specification processing and validation

**Success Criteria**:
- ✅ Product images processed for feature extraction
- ✅ Key specifications identified from visual analysis
- ✅ Structured data output for search query generation

### Phase 2: Intelligent Search Query Generation

**Objective**: Create effective competitor search queries

**Implementation Areas**:
- Combine extracted features with user specifications
- Generate multiple search variations for comprehensive coverage
- Optimize queries for e-commerce marketplace results

### Phase 3: SerpAPI Google Shopping Integration

**Objective**: Search across Indian e-commerce marketplaces

**Features**:
- SerpAPI Google Shopping integration
- Result filtering for product-related content from Indian sites
- Rate limiting and error handling
- Indian Rupee currency formatting

### Phase 4: Data Extraction & Analysis

**Objective**: Parse and structure competitor data

**Features**:
- Extract shop/store names from search results
- Parse product prices and currencies
- Identify exact product matches vs. related items
- Table-based result presentation

---

## Core Functionality

### Product Analysis with AI

```typescript
// Extract product name from images using NeuroLink
async function extractProductNameFromImages(images: string[], provider: string, model: string): Promise<string> {
  const neurolink = new NeuroLink();

  const generateOptions = {
    input: {
      text: "Give the name of the product in single line",
      images: readImageBuffers(images)  // Convert image files to buffers
    },
    output: {
      format: "text" as const
    },
    provider,
    model
  };

  const result = await neurolink.generate(generateOptions);
  return result.content.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
}
```

### Search Query Building

```typescript
// Build search query by combining user input and AI analysis
function buildSearchQuery(userText: string, imageText: string): string {
  if (!userText && !imageText) return '';

  const userWords = userText.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  const imageWords = imageText.toLowerCase().split(/\s+/).filter(word => word.length > 0);

  // Find unique words from image analysis not in user input
  const uniqueImageWords = imageWords.filter(word =>
    !userWords.includes(word) &&
    word.length > 2 &&
    !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'product', 'model'].includes(word)
  );

  const combinedWords = [...userWords, ...uniqueImageWords];
  const uniqueWords = [...new Set(combinedWords)];

  return uniqueWords.join(' ').trim();
}
```

### TypeScript Interfaces

```typescript
// Shopping result interface
interface ShoppingResult {
  position: number;
  title: string;
  link: string;
  source: string;
  price: string;
  extracted_price: number;
  rating?: number;
  reviews?: number;
  thumbnail?: string;
}

// SerpAPI response interface
interface SerpApiResponse {
  shopping_results?: ShoppingResult[];
  search_information?: {
    query_displayed: string;
  };
}
```

### SerpAPI Google Shopping Search

```typescript
// Search for product prices using SerpAPI
export async function searchProductPrices(query: string): Promise<ShoppingResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY not found in environment variables");
  }

  return new Promise((resolve, reject) => {
    getJson(
      {
        api_key: apiKey,
        engine: "google",
        q: query,
        location: "India",
        google_domain: "google.com",
        gl: "in",
        hl: "en",
        tbm: "shop",  // Shopping search
        device: "desktop",
      },
      (json: SerpApiResponse) => {
        const raw: ShoppingResult[] = json.shopping_results || [];

        // Filter to English-only results
        const filtered = raw.map((r) => ({
          ...r,
          title: keepEnglish(r.title || ""),
          source: keepEnglish(r.source || ""),
        }));

        resolve(filtered);
      }
    ).catch(reject);
  });
}
```

### Results Display

```typescript
// Display shopping results in formatted CLI table
export function displayTable(results: ShoppingResult[]): void {
  const columnWidths = {
    ecommerce: 30,
    price: 15,
    title: 60,
  };

  // Table header
  console.log("\n" + "=".repeat(columnWidths.ecommerce + columnWidths.price + columnWidths.title + 6));
  console.log(
    padString("E-Commerce Name", columnWidths.ecommerce) +
    " | " +
    padString("Price", columnWidths.price) +
    " | " +
    padString("Title", columnWidths.title)
  );
  console.log("=".repeat(columnWidths.ecommerce + columnWidths.price + columnWidths.title + 6));

  // Results
  if (results.length === 0) {
    console.log("No results found!");
  } else {
    results.forEach((result) => {
      const ecommerce = result.source || "Unknown";
      const price = formatPrice(result.extracted_price);  // Format as ₹
      const title = result.title || "No title";

      console.log(
        padString(truncateString(ecommerce, columnWidths.ecommerce), columnWidths.ecommerce) +
        " | " +
        padString(price, columnWidths.price) +
        " | " +
        padString(truncateString(title, columnWidths.title), columnWidths.title)
      );
    });
  }

  console.log("=".repeat(columnWidths.ecommerce + columnWidths.price + columnWidths.title + 6));
  console.log(`\nTotal results shown (Indian sites only): ${results.length}\n`);
}
```

---

## Usage Examples

### Running the Demo

The demo is hardcoded to analyze an IQOO neo 10r smartphone:

```typescript
// main.ts - Demo execution
const result = await findProductFeatures({
  productName: "IQOO neo 10r",
  productModel: "",
  specification: "12 + 256",
  images: ["test/test1.jpeg"]
});

const prices = await searchProductPrices(result.searchQuery);
displayTable(prices);
```

### Custom Product Analysis

You can modify the demo to analyze different products:

```typescript
// Analyze a different smartphone
const result = await findProductFeatures({
  productName: "Samsung Galaxy S24",
  specification: "512GB",
  images: ["./samsung-s24.jpg"]
});

// Search for prices
const prices = await searchProductPrices(result.searchQuery);
displayTable(prices);
```

### Using Different AI Models

```typescript
// Use different AI configuration
const result = await findProductFeatures({
  productName: "MacBook Air M3",
  specification: "13-inch",
  images: ["./macbook.jpg"],
  config: {
    provider: "google-ai",
    model: "gemini-2.0-flash"  // Different model
  }
});
```

### Analyzing Products Without Images

```typescript
// Text-only analysis (no images)
const result = await findProductFeatures({
  productName: "Sony WH-1000XM5 Headphones",
  specification: "Wireless, ANC, 30hr battery"
  // No images provided
});

const prices = await searchProductPrices(result.searchQuery);
displayTable(prices);
```

---

## API Integration Examples

### Using the Functions Directly

```typescript
import { findProductFeatures } from './find-product.ts';
import { searchProductPrices, displayTable } from './search-product.ts';

// Analyze a product with image
async function analyzeProduct() {
  const result = await findProductFeatures({
    productName: "iPhone 15 Pro",
    specification: "128GB",
    images: ["./iphone.jpg"]
  });

  if (result.success) {
    const prices = await searchProductPrices(result.searchQuery);
    displayTable(prices);
  }
}

analyzeProduct();
```

### Custom Integration

```typescript
// Create a custom product analyzer
class ProductPriceAnalyzer {
  async analyze(productName: string, specs: string, imagePath?: string) {
    const options: any = {
      productName,
      specification: specs
    };

    if (imagePath) {
      options.images = [imagePath];
    }

    const result = await findProductFeatures(options);

    if (!result.success) {
      throw new Error(result.error);
    }

    const prices = await searchProductPrices(result.searchQuery);

    return {
      searchQuery: result.searchQuery,
      prices,
      metadata: result.metadata
    };
  }
}

// Usage
const analyzer = new ProductPriceAnalyzer();
const result = await analyzer.analyze(
  "Samsung Galaxy S24",
  "512GB",
  "./galaxy-s24.jpg"
);

console.log(`Search query: ${result.searchQuery}`);
displayTable(result.prices);
```

---



## Performance Notes

The current implementation processes requests sequentially without advanced caching or rate limiting. For production use, consider implementing:

- Request caching to reduce API calls
- Rate limiting for API quota management
- Parallel processing for multiple product analyses
- Error retry mechanisms with exponential backoff

---

## Troubleshooting & Debugging

### Common Issues and Solutions

#### 1. NeuroLink API Errors

**Problem**: Authentication or API quota exceeded

**Solution**: Check your Google AI API key and billing status

```bash
# Test API key
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"

# Expected response: List of available models including gemini-2.5-flash
```

#### 2. SerpAPI Errors

**Problem**: Invalid API key or quota exceeded

**Solution**: Verify your SerpAPI credentials

```bash
# Test SerpAPI key
curl "https://serpapi.com/search.json?q=test&api_key=YOUR_SERPAPI_KEY"

# Check your dashboard at serpapi.com for usage limits
```

#### 3. No Search Results Found

**Problem**: Empty results from Google Shopping

**Solution**: Check query formatting and location settings

```typescript
// Debug the search query
console.log('Search query:', result.searchQuery);

// Test with a simpler query
const testQuery = "iPhone 15";
const testResults = await searchProductPrices(testQuery);
console.log('Test results:', testResults.length);
```

#### 4. Image Processing Errors

**Problem**: Invalid image format or file not found

**Solution**: Validate image files before processing

```bash
# Check image file
file test/test1.jpeg  # Should show: JPEG image data

# Test with a different image
ls -la test/  # Ensure test1.jpeg exists
```

#### 5. Memory Issues with Large Images

**Problem**: Out of memory errors

**Solution**: The code automatically handles image buffers, but very large files may cause issues

```bash
# Check image size
ls -lh test/test1.jpeg  # Should be under 10MB

# Resize large images if needed
convert large-image.jpg -resize 1920x1080 test/test1.jpeg
```

### Environment Variable Issues

**Problem**: "SERPAPI_API_KEY not found" error

**Solution**: Ensure `.env` file is properly configured

```bash
# Check if .env file exists
ls -la .env

# Verify environment variables are loaded
node -e "require('dotenv').config(); console.log(process.env.SERPAPI_API_KEY ? 'API key loaded' : 'API key missing')"
```

### Network Issues

**Problem**: API requests failing due to network connectivity

**Solution**: Check internet connection and API endpoints

```bash
# Test connectivity
curl -I https://serpapi.com
curl -I https://generativelanguage.googleapis.com
```

### Performance Optimization

**Problem**: Slow response times

**Solution**: The demo processes images sequentially and makes API calls

```typescript
// Current implementation is single-threaded for simplicity
// For production use, consider:
// - Caching results
// - Parallel processing
// - Error retry logic
```

---

## Requirements & Setup

### Prerequisites

- **Node.js**: >= 18.0.0
- **NeuroLink**: >= 8.22.0
- **SerpAPI**: Valid API key (for Google Shopping search)
- **Image Formats**: JPEG, PNG, WebP (max 10MB)
- **Memory**: Minimum 512MB RAM
- **Network**: Stable internet connection

### Installation

```bash
# Install dependencies
pnpm install

# Or with npm
npm install
```

### Environment Setup

Create a `.env` file in the project root:

```bash
# NeuroLink Configuration
DEFAULT_PROVIDER="google-ai"
GOOGLE_AI_API_KEY="your_google_ai_api_key_here"
GOOGLE_AI_MODEL="gemini-2.5-flash"

# SerpAPI Configuration
SERPAPI_API_KEY="your_serpapi_api_key_here"
```

### Running the Demo

```bash
# Run the demo with tsx
npx tsx main.ts

# Expected output:
🚀 Product Search & Price Comparison Demo

🔍 Step 1: Building product search query...
✅ Search Query: IQOO neo 10r 12 256
📊 Metadata: { userText: 'IQOO neo 10r 12 256', imageProductName: '...', ... }


🛒 Step 2: Searching for product prices online...
[...search results...]


📊 Step 3: Formatted Price Comparison Table:
E-Commerce Name                 | Price          | Title
Amazon                         | ₹24,999        | IQOO Neo 10R (12GB RAM, 256GB Storage)
Flipkart                       | ₹24,999        | IQOO Neo 10R 5G (12GB RAM, 256GB)
Croma                          | ₹24,990        | IQOO Neo 10R 5G Smartphone

Total results shown (Indian sites only): 15
```

---

## License

ISC License

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## Roadmap

- [ ] Enhanced image preprocessing
- [ ] Support for additional marketplaces
- [ ] Price history tracking
- [ ] Export to multiple formats (CSV, PDF)
- [ ] Real-time price alerts
- [ ] Competitor analysis dashboard
- [ ] Multi-language support
- [ ] Advanced filtering options
