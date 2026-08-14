const test = require('node:test');
const assert = require('node:assert/strict');
const { isPurchaseVerificationSuccessful } = require('../services/iapConfig');

test('treats backend verification as failed when Apple IAP is not configured', () => {
  const result = isPurchaseVerificationSuccessful({
    ok: false,
    status: 503,
    body: { success: false, message: 'Apple IAP verification not configured' },
  });

  assert.equal(result, false);
});

test('treats backend verification as successful only when the backend confirms success', () => {
  const result = isPurchaseVerificationSuccessful({
    ok: true,
    status: 200,
    body: { success: true, message: 'Receipt verified' },
  });

  assert.equal(result, true);
});
