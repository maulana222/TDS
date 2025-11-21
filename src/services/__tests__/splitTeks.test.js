/**
 * Test cases untuk fungsi splitTeks
 * 
 * Untuk menjalankan test, gunakan:
 * - Jest: npm test splitTeks.test.js
 * - Atau manual testing di browser console
 */

import { splitTeks } from '../marketingService';

// Test Case 1: Basic split dengan teks normal
console.log('=== Test Case 1: Basic Split ===');
const test1 = splitTeks("Halo, saya mau beli produk ini!");
console.log('Input:', "Halo, saya mau beli produk ini!");
console.log('Expected:', ['halo', 'saya', 'mau', 'beli', 'produk', 'ini']);
console.log('Result:', test1);
console.log('Pass:', JSON.stringify(test1) === JSON.stringify(['halo', 'saya', 'mau', 'beli', 'produk', 'ini']));
console.log('');

// Test Case 2: Remove stopwords
console.log('=== Test Case 2: Remove Stopwords ===');
const test2 = splitTeks("Saya mau beli produk yang bagus", { removeStopwords: true });
console.log('Input:', "Saya mau beli produk yang bagus");
console.log('Expected:', ['mau', 'beli', 'produk', 'bagus']);
console.log('Result:', test2);
console.log('Pass:', JSON.stringify(test2) === JSON.stringify(['mau', 'beli', 'produk', 'bagus']));
console.log('');

// Test Case 3: Minimum length filter
console.log('=== Test Case 3: Minimum Length ===');
const test3 = splitTeks("A B CD EFG HIJK", { minLength: 3 });
console.log('Input:', "A B CD EFG HIJK");
console.log('Expected:', ['cd', 'efg', 'hijk']);
console.log('Result:', test3);
console.log('Pass:', JSON.stringify(test3) === JSON.stringify(['cd', 'efg', 'hijk']));
console.log('');

// Test Case 4: Combined options (removeStopwords + minLength)
console.log('=== Test Case 4: Combined Options ===');
const test4 = splitTeks("Saya ingin beli paket premium yang diskon", { 
  removeStopwords: true, 
  minLength: 4 
});
console.log('Input:', "Saya ingin beli paket premium yang diskon");
console.log('Expected:', ['ingin', 'beli', 'paket', 'premium', 'diskon']);
console.log('Result:', test4);
console.log('Pass:', JSON.stringify(test4) === JSON.stringify(['ingin', 'beli', 'paket', 'premium', 'diskon']));
console.log('');

// Test Case 5: Teks dengan tanda baca dan spasi ganda
console.log('=== Test Case 5: Punctuation & Multiple Spaces ===');
const test5 = splitTeks("Halo!!!  Saya   mau    beli... produk???", { removeStopwords: true });
console.log('Input:', "Halo!!!  Saya   mau    beli... produk???");
console.log('Expected:', ['halo', 'mau', 'beli', 'produk']);
console.log('Result:', test5);
console.log('Pass:', JSON.stringify(test5) === JSON.stringify(['halo', 'mau', 'beli', 'produk']));
console.log('');

// Test Case 6: Edge cases
console.log('=== Test Case 6: Edge Cases ===');
console.log('Empty string:', splitTeks(""));
console.log('Null:', splitTeks(null));
console.log('Undefined:', splitTeks(undefined));
console.log('Only spaces:', splitTeks("   "));
console.log('Only punctuation:', splitTeks("!!!@@@###"));
console.log('');

// Test Case 7: Real marketing message
console.log('=== Test Case 7: Real Marketing Message ===');
const marketingMsg = "Bang, saya mau beli paket premium yang diskon. Ada promo tidak?";
const test7 = splitTeks(marketingMsg, { removeStopwords: true, minLength: 3 });
console.log('Input:', marketingMsg);
console.log('Result:', test7);
console.log('Keywords found:', ['beli', 'paket', 'premium', 'diskon', 'promo'].filter(k => test7.includes(k)));
console.log('');

export {
  test1,
  test2,
  test3,
  test4,
  test5,
  test7
};


