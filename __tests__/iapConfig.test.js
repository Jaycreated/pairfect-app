const test = require('node:test');
const assert = require('node:assert/strict');
const { getProductIdsForPlatform } = require('../services/iapConfig');

test('uses the shared store product IDs for both platforms', () => {
  assert.deepEqual(getProductIdsForPlatform('ios'), [
    'ng.com.pairfect.dailysubscribe',
    'ng.com.pairfect.monthlyaccess',
  ]);

  assert.deepEqual(getProductIdsForPlatform('android'), [
    'com.pairfect.daily',
    'com.pairfect.monthly',
  ]);
});
