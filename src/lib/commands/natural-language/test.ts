/**
 * Test file for natural language parser
 * Run this to test the parser functionality
 */

import { parseAddCommand } from "./parser";

export function testNaturalLanguageParser() {
  console.log("🧪 Testing Natural Language Parser");
  console.log("=====================================");

  const testCases = [
    {
      input: "add coffee 10",
      description: "Basic item",
    },
    {
      input: "add coffee 10 @ Starbucks",
      description: "Item with merchant",
    },
    {
      input: "add coffee 10 @ Starbucks with kbank",
      description: "Item with merchant and payment",
    },
    {
      input: "add coffee 10, croissant 5 @ Starbucks",
      description: "Multiple items with merchant",
    },
    {
      input: "add coffee 10 THB @ Starbucks with kbank for Personal",
      description: "Full syntax with currency and entity",
    },
    {
      input: 'add coffee 10 @ Starbucks on today memo "morning coffee"',
      description: "With date and memo",
    },
    {
      input:
        'add lunch 25 @ McDonald\'s with visa for Personal on yesterday memo "client lunch"',
      description: "Complex example",
    },
    {
      input: "add",
      description: "Empty command (should fail)",
    },
    {
      input: "add invalid",
      description: "Invalid syntax (should fail)",
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
