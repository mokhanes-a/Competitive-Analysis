import { getJson } from "serpapi";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

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

interface SerpApiResponse {
  shopping_results?: ShoppingResult[];
  search_information?: {
    query_displayed: string;
  };
}


function keepEnglish(text: string): string {
  if (!text) return "";
  // Remove characters outside basic Latin (this removes other scripts like Devanagari, Tamil, etc.)
  return text.replace(/[^\x00-\x7F]/g, "").trim();
}

// Function to search product prices
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
        tbm: "shop",
        device: "desktop",
      },
      (json: SerpApiResponse) => {
        const raw: ShoppingResult[] = json.shopping_results || [];

        const filtered = raw.map((r) => {
          // Normalize titles and source to English-only
          return {
            ...r,
            title: keepEnglish(r.title || ""),
            source: keepEnglish(r.source || ""),
          } as ShoppingResult;
        });

        resolve(filtered);
      }
    ).catch((error) => {
      reject(new Error(`SerpAPI search failed: ${error.message}`));
    });
  });
}

// Function to format price in Indian Rupees
function formatPrice(price: number | string): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return `₹${numPrice.toLocaleString("en-IN")}`;
}

// Function to display results in table format (for CLI output)
export function displayTable(results: ShoppingResult[]): void {
  const columnWidths = {
    ecommerce: 30,
    price: 15,
    title: 60,
  };

  // Header
  console.log("\n" + "=".repeat(columnWidths.ecommerce + columnWidths.price + columnWidths.title + 6));
  console.log(
    padString("E-Commerce Name", columnWidths.ecommerce) +
    " | " +
    padString("Price", columnWidths.price) +
    " | " +
    padString("Title", columnWidths.title)
  );
  console.log("=".repeat(columnWidths.ecommerce + columnWidths.price + columnWidths.title + 6));

  // No launch info; directly print results
  console.log("-".repeat(columnWidths.ecommerce + columnWidths.price + columnWidths.title + 6));

  // Product results
  if (results.length === 0) {
    console.log("No results found!");
  } else {
    results.forEach((result) => {
      const ecommerce = result.source || "Unknown";
      const price = formatPrice(result.extracted_price);
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

// Helper function to pad string
function padString(str: string, length: number): string {
  return str.padEnd(length, " ");
}

// Helper function to truncate string
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}
