import { findProductFeatures } from "./find-product.ts";
import { searchProductPrices, displayTable } from "./search-product.ts";

interface ProductSearchResult {
  success: boolean;
  searchQuery?: string;
  error?: string;
  metadata: {
    provider?: string;
    model?: string;
    userText?: string;
    imageProductName?: string;
    imageCount?: number;
    timestamp: string;
  };
}

async function main() {
  console.log("🚀 Product Search & Price Comparison Demo\n");

  try {
    // Step 1: Build search query from user inputs and image analysis
    console.log("🔍 Step 1: Building product search query...");

    const findResult = await findProductFeatures({
      productName: "IQOO neo 10r",
      productModel: "",
      specification: "12 + 256",
      images: ["test/test1.jpeg"]
    }) as ProductSearchResult;

    if (!findResult.success) {
      console.log("❌ Error building search query:", findResult.error);
      return;
    }

    console.log("✅ Search Query:", findResult.searchQuery);
    console.log("📊 Metadata:", {
      userText: findResult.metadata.userText,
      imageProductName: findResult.metadata.imageProductName,
      imageCount: findResult.metadata.imageCount
    });

    console.log("\n" + "=".repeat(60));

    // Step 2: Perform web search for pricing
    console.log("🛒 Step 2: Searching for product prices online...");

    const searchResults = await searchProductPrices(findResult.searchQuery!);

    // Display JSON data
    //console.log("\n📄 JSON Results:");
    //console.log(JSON.stringify(searchResults, null, 2));

    console.log("\n" + "=".repeat(60));

    // Step 3: Display formatted table
    console.log("📊 Step 3: Formatted Price Comparison Table:");
    displayTable(searchResults);

  } catch (error) {
    console.error("💥 Fatal error:", error);
  }

  console.log("\n🏁 Demo completed");
}

// Run the demo
main().catch(console.error);
