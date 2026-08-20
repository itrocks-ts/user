import { createHash } from 'node:crypto'

export type AttemptDecision = Readonly<{
	allowed:          boolean
	retryAfterSeconds: number
}>

export type AttemptLimiterOptions = Readonly<{
	maxAttempts: number
	maxEntries?: number
	windowMs:    number
}>

type AttemptWindow = {
	count:   number
	resetAt: number
}

const DEFAULT_MAX_ENTRIES = 10_000

export class AttemptLimiter
{

	private readonly attempts = new Map<string, AttemptWindow>()

	constructor(private readonly options: AttemptLimiterOptions)
	{
		if ((options.maxAttempts < 1) || (options.windowMs < 1)) {
			throw new RangeError('Attempt limits must be positive')
		}
	}

	clear(value: string): void
	{
		this.attempts.delete(this.key(value))
	}

	consume(value: string, now = Date.now()): AttemptDecision
	{
		const key     = this.key(value)
		const current = this.attempts.get(key)
		const window  = !current || (current.resetAt <= now)
			? { count: 0, resetAt: now + this.options.windowMs }
			: current

		if (!current || (current.resetAt <= now)) {
			this.prune(now)
		}
		window.count ++
		this.attempts.set(key, window)

		return Object.freeze({
			allowed:          window.count <= this.options.maxAttempts,
			retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - now) / 1000))
		})
	}

	private key(value: string): string
	{
		return createHash('sha256').update(value, 'utf8').digest('base64url')
	}

	private prune(now: number): void
	{
		for (const [key, attempt] of this.attempts) {
			if (attempt.resetAt <= now) {
				this.attempts.delete(key)
			}
		}
		if (this.attempts.size < (this.options.maxEntries ?? DEFAULT_MAX_ENTRIES)) {
			return
		}
		const oldest = this.attempts.keys().next().value
		if (oldest !== undefined) {
			this.attempts.delete(oldest)
		}
	}

}
