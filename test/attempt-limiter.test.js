const assert           = require('node:assert/strict')
const { describe, it } = require('node:test')
const { AttemptLimiter } = require('../cjs/attempt-limiter')

describe('AttemptLimiter', () => {
	it('limits one opaque key until its window expires', () => {
		const limiter = new AttemptLimiter({ maxAttempts: 2, windowMs: 1_000 })

		assert.equal(limiter.consume('private@example.test', 1_000).allowed, true)
		assert.equal(limiter.consume('private@example.test', 1_100).allowed, true)
		assert.equal(limiter.consume('private@example.test', 1_200).allowed, false)
		assert.equal(limiter.consume('private@example.test', 2_000).allowed, true)
	})

	it('clears a key independently', () => {
		const limiter = new AttemptLimiter({ maxAttempts: 1, windowMs: 1_000 })

		limiter.consume('alice', 1_000)
		limiter.clear('alice')

		assert.equal(limiter.consume('alice', 1_100).allowed, true)
		assert.equal(limiter.consume('bob', 1_100).allowed, true)
	})
})
