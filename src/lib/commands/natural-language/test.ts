/**
 * Test file for natural language parser
 * Run this to test the parser functionality
 */

import { parseAddCommand } from "./parser";

/**
 * Print a comprehensive reference guide for add command syntax
 */
export function printAddCommandReference() {
  console.log("📚 Add Command Reference Guide");
  console.log("===============================");
  console.log("");

  console.log("🔧 Basic Syntax:");
  console.log("  add <item> <amount> [currency]");
  console.log("");

  console.log("📝 All Available Options:");
  console.log("  • Items: <name> <amount> [currency]");
  console.log("  • Multiple items: <item1> <amount1>, <item2> <amount2>");
  console.log("  • Merchant: @ <name> or at <name>");
  console.log("  • Payment: with <method>");
  console.log("  • Entity: for <name>");
  console.log("  • Date: on <date>");
  console.log("  • Memo: memo \"<text>\" or memo '<text>'");
  console.log("");

  console.log("📅 Date Formats:");
  console.log("  • Relative: on today, on yesterday, on tomorrow");
  console.log("  • Specific: on 2025/08/15 or on 2025-08-15");
  console.log("");

  console.log("💰 Currency Examples:");
  console.log("  • add coffee 10 THB");
  console.log("  • add coffee 10 USD @ Starbucks");
  console.log("  • add coffee 10, croissant 5 USD @ Starbucks");
  console.log("");

  console.log("🏪 Merchant Examples:");
  console.log("  • add coffee 10 @ Starbucks");
  console.log("  • add coffee 10 at McDonald's");
  console.log("  • add coffee 10 @ 7-Eleven");
  console.log("  • add coffee 10 @ Shell Gas Station");
  console.log("");

  console.log("💳 Payment Examples:");
  console.log("  • add coffee 10 with cash");
  console.log("  • add coffee 10 with visa");
  console.log("  • add coffee 10 with kbank");
  console.log("  • add coffee 10 with credit_card");
  console.log("");

  console.log("👤 Entity Examples:");
  console.log("  • add coffee 10 for Personal");
  console.log("  • add coffee 10 for Business");
  console.log("  • add coffee 10 for my_company");
  console.log("");

  console.log("📝 Memo Examples:");
  console.log('  • add coffee 10 memo "morning coffee"');
  console.log("  • add coffee 10 memo 'client meeting'");
  console.log('  • add coffee 10 memo "expense for project X"');
  console.log("");

  console.log("🎯 Complex Examples:");
  console.log("  • add coffee 10 @ Starbucks with visa for Personal on today");
  console.log(
    '  • add coffee 10, croissant 5 @ Starbucks with visa for Personal on 2025/08/15 memo "breakfast"'
  );
  console.log(
    '  • add lunch 25 THB @ McDonald\'s with kbank for Business on yesterday memo "client lunch"'
  );
  console.log("");

  console.log("❌ Common Errors to Avoid:");
  console.log("  • add coffee (missing amount)");
  console.log("  • add 10 (missing item name)");
  console.log("  • add coffee 10 @ (missing merchant name)");
  console.log("  • add coffee 10 with (missing payment method)");
  console.log("  • add coffee 10 for (missing entity name)");
  console.log("  • add coffee 10 on (missing date)");
  console.log("  • add coffee 10 memo (missing memo text)");
  console.log("");
}

export function testNaturalLanguageParser() {
  console.log("🧪 Testing Natural Language Parser");
  console.log("=====================================");

  const testCases = [
    // Basic functionality
    {
      input: "add coffee 10",
      description: "Basic item - single item with amount",
    },
    {
      input: "add coffee 10.50",
      description: "Decimal amount",
    },
    {
      input: "add coffee 10 THB",
      description: "Item with currency",
    },
    {
      input: "add coffee 10, croissant 5",
      description: "Multiple items without merchant",
    },
    {
      input: "add coffee 10 THB, croissant 5 USD",
      description: "Multiple items with different currencies",
    },

    // Merchant variations
    {
      input: "add coffee 10 @ Starbucks",
      description: "Merchant with @ symbol",
    },
    {
      input: "add coffee 10 at Starbucks",
      description: "Merchant with 'at' keyword",
    },
    {
      input: "add coffee 10 @ McDonald's",
      description: "Merchant with apostrophe",
    },
    {
      input: "add coffee 10 @ 7-Eleven",
      description: "Merchant with numbers and hyphen",
    },
    {
      input: "add coffee 10 @ Shell Gas Station",
      description: "Multi-word merchant name",
    },

    // Payment methods
    {
      input: "add coffee 10 with cash",
      description: "Payment method - cash",
    },
    {
      input: "add coffee 10 with visa",
      description: "Payment method - visa",
    },
    {
      input: "add coffee 10 with kbank",
      description: "Payment method - kbank",
    },
    {
      input: "add coffee 10 with credit_card",
      description: "Payment method with underscore",
    },

    // Entity variations
    {
      input: "add coffee 10 for Personal",
      description: "Entity - Personal",
    },
    {
      input: "add coffee 10 for Business",
      description: "Entity - Business",
    },
    {
      input: "add coffee 10 for my_company",
      description: "Entity with underscore",
    },

    // Date variations
    {
      input: "add coffee 10 on today",
      description: "Date - today",
    },
    {
      input: "add coffee 10 on yesterday",
      description: "Date - yesterday",
    },
    {
      input: "add coffee 10 on tomorrow",
      description: "Date - tomorrow",
    },
    {
      input: "add coffee 10 on 2025/08/15",
      description: "Date - specific date (YYYY/MM/DD)",
    },
    {
      input: "add coffee 10 on 2025-08-15",
      description: "Date - specific date (YYYY-MM-DD)",
    },
    {
      input: "add coffee 10 on 2025/12/31",
      description: "Date - end of year",
    },

    // Memo variations
    {
      input: 'add coffee 10 memo "morning coffee"',
      description: "Memo with double quotes",
    },
    {
      input: "add coffee 10 memo 'evening coffee'",
      description: "Memo with single quotes",
    },
    {
      input: 'add coffee 10 memo "client meeting at 2pm"',
      description: "Memo with spaces and special characters",
    },

    // Complex combinations
    {
      input: "add coffee 10 @ Starbucks with visa",
      description: "Item + merchant + payment",
    },
    {
      input: "add coffee 10 @ Starbucks for Personal",
      description: "Item + merchant + entity",
    },
    {
      input: "add coffee 10 @ Starbucks on today",
      description: "Item + merchant + date",
    },
    {
      input: 'add coffee 10 @ Starbucks memo "morning coffee"',
      description: "Item + merchant + memo",
    },
    {
      input: "add coffee 10 @ Starbucks with visa for Personal",
      description: "Item + merchant + payment + entity",
    },
    {
      input: "add coffee 10 @ Starbucks with visa on today",
      description: "Item + merchant + payment + date",
    },
    {
      input: 'add coffee 10 @ Starbucks with visa memo "morning coffee"',
      description: "Item + merchant + payment + memo",
    },
    {
      input: "add coffee 10 @ Starbucks for Personal on today",
      description: "Item + merchant + entity + date",
    },
    {
      input: 'add coffee 10 @ Starbucks for Personal memo "morning coffee"',
      description: "Item + merchant + entity + memo",
    },
    {
      input: 'add coffee 10 @ Starbucks on today memo "morning coffee"',
      description: "Item + merchant + date + memo",
    },
    {
      input: "add coffee 10 @ Starbucks with visa for Personal on today",
      description: "Item + merchant + payment + entity + date",
    },
    {
      input:
        'add coffee 10 @ Starbucks with visa for Personal memo "morning coffee"',
      description: "Item + merchant + payment + entity + memo",
    },
    {
      input:
        'add coffee 10 @ Starbucks with visa on today memo "morning coffee"',
      description: "Item + merchant + payment + date + memo",
    },
    {
      input:
        'add coffee 10 @ Starbucks for Personal on today memo "morning coffee"',
      description: "Item + merchant + entity + date + memo",
    },
    {
      input:
        'add coffee 10 @ Starbucks with visa for Personal on today memo "morning coffee"',
      description: "FULL SYNTAX - all options",
    },

    // Multiple items with various combinations
    {
      input: "add coffee 10, croissant 5 @ Starbucks",
      description: "Multiple items + merchant",
    },
    {
      input: "add coffee 10, croissant 5 @ Starbucks with visa",
      description: "Multiple items + merchant + payment",
    },
    {
      input: "add coffee 10, croissant 5 @ Starbucks for Personal",
      description: "Multiple items + merchant + entity",
    },
    {
      input: "add coffee 10, croissant 5 @ Starbucks on today",
      description: "Multiple items + merchant + date",
    },
    {
      input: 'add coffee 10, croissant 5 @ Starbucks memo "breakfast"',
      description: "Multiple items + merchant + memo",
    },
    {
      input:
        "add coffee 10, croissant 5 @ Starbucks with visa for Personal on today",
      description: "Multiple items + merchant + payment + entity + date",
    },
    {
      input:
        'add coffee 10, croissant 5 @ Starbucks with visa for Personal on today memo "breakfast"',
      description: "Multiple items + ALL OPTIONS",
    },

    // Edge cases and special characters
    {
      input: "add coffee 10 @ Starbucks & Co.",
      description: "Merchant with ampersand and period",
    },
    {
      input: "add coffee 10 @ McDonald's with visa",
      description: "Merchant with apostrophe + payment",
    },
    {
      input: "add coffee 10 @ 7-Eleven for Personal",
      description: "Merchant with numbers + entity",
    },
    {
      input: 'add coffee 10 @ "Starbucks Coffee"',
      description: "Merchant with quotes (edge case)",
    },
    {
      input: "add coffee 10 with visa-card",
      description: "Payment with hyphen",
    },
    {
      input: "add coffee 10 for my-company",
      description: "Entity with hyphen",
    },

    // Currency variations
    {
      input: "add coffee 10 USD @ Starbucks",
      description: "Currency before merchant",
    },
    {
      input: "add coffee 10, croissant 5 USD @ Starbucks",
      description: "Multiple items with same currency",
    },
    {
      input: "add coffee 10 THB, croissant 5 USD @ Starbucks",
      description: "Multiple items with different currencies",
    },

    // Error cases (should fail)
    {
      input: "add",
      description: "Empty command (should fail)",
    },
    {
      input: "add coffee",
      description: "Item without amount (should fail)",
    },
    {
      input: "add 10",
      description: "Amount without item (should fail)",
    },
    {
      input: "add coffee @",
      description: "Merchant symbol without name (should fail)",
    },
    {
      input: "add coffee 10 @",
      description: "Merchant symbol without name (should fail)",
    },
    {
      input: "add coffee 10 with",
      description: "Payment keyword without method (should fail)",
    },
    {
      input: "add coffee 10 for",
      description: "Entity keyword without name (should fail)",
    },
    {
      input: "add coffee 10 on",
      description: "Date keyword without value (should fail)",
    },
    {
      input: "add coffee 10 memo",
      description: "Memo keyword without value (should fail)",
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.description}`);
    console.log(`Input: "${testCase.input}"`);

    const result = parseAddCommand(testCase.input);

    if (result.success) {
      console.log("✅ PASS");
      console.log("Parsed data:", JSON.stringify(result.data, null, 2));
      passed++;
    } else {
      console.log("❌ FAIL");
      console.log("Error:", result.error.message);
      if (result.error.suggestion) {
        console.log("Suggestion:", result.error.suggestion);
      }
      failed++;
    }
  }

  console.log("\n📊 Test Results");
  console.log("================");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );

  if (failed === 0) {
    console.log(
      "\n🎉 All tests passed! The natural language parser is working correctly."
    );
    console.log(
      "\n📝 Note: The generated Ledger entries will populate the terminal input field"
    );
    console.log("   for user review and editing before submission.");
  } else {
    console.log("\n⚠️  Some tests failed. Please review the implementation.");
  }

  return { passed, failed, total: passed + failed };
}

// Export for use in other files
export { testNaturalLanguageParser as testParser };

// Run tests if this file is executed directly
if (typeof window === "undefined" && require.main === module) {
  testNaturalLanguageParser();
}
