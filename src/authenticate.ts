import { Action }       from '@itrocks/action'
import { Request }      from '@itrocks/action-request'
import { Type }         from '@itrocks/class-type'
import { verifyPassword } from '@itrocks/password/transformers'
import { Headers }      from '@itrocks/request-response'
import { dataSource }   from '@itrocks/storage'
import { AttemptLimiter } from './attempt-limiter'
import { User }         from './user'

const DUMMY_PASSWORD = 'scrypt$32768$8$1$-kpXSVW4CAFbWhbQGhHWZA$wyjczccUQgTV1znIPY7VY97_yUoXXWVb0plqkjwSv6u0eJA-d970OHUQUEyy4A1n_-ZPPVfYugNYsfdRVzjkWQ'
const identifierAttempts = new AttemptLimiter({
	maxAttempts: 10,
	windowMs:    15 * 60 * 1000
})
const totalAttempts = new AttemptLimiter({
	maxAttempts: 200,
	windowMs:    15 * 60 * 1000
})

export class Authenticate<T extends User = User> extends Action<T>
{

	async html(request: Request<T>)
	{
		const data          = request.request.data
		const loginInput    = (typeof data.login === 'string') ? data.login.trim() : ''
		const passwordInput = (typeof data.password === 'string') ? data.password : ''
		const login         = (loginInput.length <= 254) ? loginInput : ''
		const password      = (passwordInput.length <= 1024) ? passwordInput : ''
		const attempt       = identifierAttempts.consume(login.toLocaleLowerCase('en-US'))
		const total         = totalAttempts.consume('all')
		if (!attempt.allowed || !total.allowed) {
			return this.authenticationError(request, 429, Math.max(attempt.retryAfterSeconds, total.retryAfterSeconds))
		}

		const userType: Type<User> = request.type
		let user: User | undefined
		if (login.includes('@')) {
			user = await dataSource().searchOne(userType, { email: login })
		}
		user ??= login ? await dataSource().searchOne(userType, { login }) : undefined
		if (!await verifyPassword(password, user?.password ?? DUMMY_PASSWORD) || !user) {
			return this.authenticationError(request)
		}

		identifierAttempts.clear(login.toLocaleLowerCase('en-US'))
		await request.request.session.regenerate?.()
		request.request.session.user = user
		return this.htmlTemplateResponse(user, request, __dirname + '/authenticated.html')
	}

	private authenticationError(request: Request<T>, statusCode = 401, retryAfter?: number)
	{
		const headers: Headers = {}
		if (retryAfter) {
			headers['Retry-After'] = retryAfter.toString()
		}
		return this.htmlTemplateResponse({}, request, __dirname + '/authentication-error.html', statusCode, headers)
	}

}
