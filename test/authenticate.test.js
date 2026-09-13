const assert                        = require('node:assert/strict')
const { createHash }                = require('node:crypto')
const { basename }                  = require('node:path')
const { before }                    = require('node:test')
const { describe, it }              = require('node:test')
const { Authenticate }              = require('../cjs/authenticate')
const { Login }                     = require('../cjs/login')
const { Logout }                    = require('../cjs/logout')
const { User }                      = require('../cjs/user')
const { hashPassword }              = require('@itrocks/password/transformers')
const { createDataSource }          = require('@itrocks/storage')

const users = []
const legacyPassword = createHash('sha512').update('legacy password', 'utf8').digest('hex')

function authenticationRequest(login, password, redirect)
{
	const session = {
		regenerated: false,
		async regenerate()
		{
			this.regenerated = true
		}
	}
	return {
		action:  'authenticate',
		request: {
			data: { login, password, redirect },
			session
		},
		type: User
	}
}

function authenticate()
{
	const action = new Authenticate()
	action.htmlTemplateResponse = async (data, _request, template, statusCode = 200, headers = {}) => {
		action.renderedData = data
		return {
			body: basename(template),
			headers,
			statusCode
		}
	}
	return action
}

before(async () => {
	createDataSource({ engine: require.resolve('./memory-data-source'), users })
	users.push(Object.assign(new User, {
		email:    'alice@example.test',
		login:    'alice',
		password: await hashPassword('valid password')
	}))
	users.push(Object.assign(new User, {
		email:    'bob@example.test',
		login:    'bob',
		password: legacyPassword
	}))
})

describe('Authenticate', () => {
	it('lets applications replace templates without replacing authentication logic', async () => {
		class BrandedAuthenticate extends Authenticate
		{
			templateFile(name)
			{
				return '/application/' + name + '.html'
			}
		}
		const action = new BrandedAuthenticate()
		action.htmlTemplateResponse = async (_data, _request, template, statusCode = 200) => ({
			statusCode,
			template
		})

		assert.deepEqual(await action.html(authenticationRequest('unknown', 'wrong')), {
			statusCode: 401,
			template:   '/application/authentication-error.html'
		})
	})

	it('returns the same response for an unknown account and a wrong password', async () => {
		const unknown = await authenticate().html(authenticationRequest('unknown', 'wrong'))
		const existing = await authenticate().html(authenticationRequest('alice', 'wrong'))

		assert.deepEqual(unknown, existing)
		assert.deepEqual(existing, { body: 'authentication-error.html', headers: {}, statusCode: 401 })
	})

	it('regenerates the session before storing the authenticated user', async () => {
		const action   = authenticate()
		const request  = authenticationRequest('alice@example.test', 'valid password')
		const response = await action.html(request)

		assert.equal(response.statusCode, 200)
		assert.equal(request.request.session.regenerated, true)
		assert.equal(request.request.session.user.login, 'alice')
		assert.deepEqual(action.renderedData, { login: 'alice', redirect: '/' })
	})

	it('keeps safe internal redirects without exposing private credentials to the template', async () => {
		const action   = authenticate()
		const request  = authenticationRequest('alice', 'valid password', '/private?tab=account')
		const response = await action.html(request)

		assert.equal(response.statusCode, 200)
		assert.deepEqual(action.renderedData, { login: 'alice', redirect: '/private?tab=account' })
	})

	it('rejects external redirect targets', async () => {
		const action   = authenticate()
		const request  = authenticationRequest('alice', 'valid password', '//example.test/private')
		const response = await action.html(request)

		assert.equal(response.statusCode, 200)
		assert.deepEqual(action.renderedData, { login: 'alice', redirect: '/' })
	})

	it('authenticates a legacy SHA-512 password without rewriting it', async () => {
		const request  = authenticationRequest('bob', 'legacy password')
		const response = await authenticate().html(request)

		assert.equal(response.statusCode, 200)
		assert.equal(request.request.session.user.login, 'bob')
		assert.equal(users.find(user => user.login === 'bob').password, legacyPassword)
	})
})

describe('Login', () => {
	it('lets applications replace the login template without replacing its action', async () => {
		class BrandedLogin extends Login
		{
			templateFile(name)
			{
				return '/application/' + name + '.html'
			}
		}
		const action = new BrandedLogin()
		action.htmlTemplateResponse = async (_data, _request, template) => ({ template })

		const response = await action.html({
			action:  'login',
			request: { method: 'GET', path: '/user/login' },
			type:    User
		})
		assert.equal(response.template, '/application/login.html')
	})
})

describe('Logout', () => {
	it('waits for revocation before redirecting to the login page', async () => {
		let destroyed = false
		const response = await new Logout().html({
			request: {
				session: {
					async destroy()
					{
						destroyed = true
					},
					user: { login: 'alice' }
				}
			}
		})

		assert.equal(destroyed, true)
		assert.equal(response.statusCode, 303)
		assert.equal(response.headers.Location, '/user/login')
	})
})
