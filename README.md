[![npm version](https://img.shields.io/npm/v/@itrocks/user?logo=npm)](https://www.npmjs.org/package/@itrocks/user)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/user)](https://www.npmjs.org/package/@itrocks/user)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/user?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/user)
[![issues](https://img.shields.io/github/issues/itrocks-ts/user)](https://github.com/itrocks-ts/user/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# user

Business entity representing a user with a login form, authentication, and logout actions.

*This documentation was written by an artificial intelligence and may contain errors or approximations.
It has not yet been fully reviewed by a human. If anything seems unclear or incomplete,
please feel free to contact the author of this package.*

## Installation

```bash
npm i @itrocks/user
```

`@itrocks/user` is usually installed together with the it.rocks framework
and other business‑level packs, but it can also be used on its own in any
TypeScript/Node.js project.

## Usage

`@itrocks/user` provides a ready‑to‑use `User` entity together with three
actions that cover a typical authentication flow:

- `Login` – displays the login form and exposes its JSON description,
  depending on the surrounding ecosystem.
- `Authenticate` – validates the submitted credentials, loads the
  corresponding user from the data store, and attaches it to the
  session.
- `Logout` – clears the authenticated user from the session and
  redirects back to the login form.

The actions are designed to be plugged into an HTTP framework (Fastify,
Express, …) through `@itrocks/action-request`. They work with any
`User`‑compatible entity (a class extending `User` or `Account`) stored
via `@itrocks/store`.

### Minimal example

```ts
import { Authenticate, Login, Logout, User } from '@itrocks/user'
import type { Request } from '@itrocks/action-request'

// Business entity
class AppUser extends User {}

// Actions used in the authentication workflow
const login        = new Login<AppUser>()
const authenticate = new Authenticate<AppUser>()
const logout       = new Logout<AppUser>()

// Example HTML endpoints
async function loginHtml (request: Request<AppUser>) {
	return login.html(request)
}

async function authenticateHtml (request: Request<AppUser>) {
	return authenticate.html(request)
}

async function logoutHtml (request: Request<AppUser>) {
	return logout.html(request)
}
```

In a real application, `Request<AppUser>` is built from the underlying
HTTP framework so that it embeds the HTTP request, session, and routing
information.

### Complete example with Fastify and @itrocks/action-request

Below is a simplified example showing how `@itrocks/user` can be wired
to Fastify using `@itrocks/action-request`.

```ts
import fastify from 'fastify'

import { Authenticate, Login, Logout, User } from '@itrocks/user'
import { toRequest } from '@itrocks/action-request'

class AppUser extends User {}

const app          = fastify({ logger: true })
const login        = new Login<AppUser>()
const authenticate = new Authenticate<AppUser>()
const logout       = new Logout<AppUser>()

// Display login form
app.route({
	method : 'GET',
	url    : '/login',
	handler: async (rawRequest, rawReply) => {
		const request = toRequest<AppUser>({
			action : 'login',
			headers: rawRequest.headers,
			method : rawRequest.method,
			path   : rawRequest.url,
			query  : rawRequest.query,
			body   : rawRequest.body,
			session: rawRequest.session
		})

		const response = await login.html(request)
		return rawReply.code(response.statusCode).type('text/html').send(response.body)
	}
})

// Handle submitted credentials
app.route({
	method : 'POST',
	url    : '/login',
	handler: async (rawRequest, rawReply) => {
		const request = toRequest<AppUser>({
			action : 'authenticate',
			headers: rawRequest.headers,
			method : rawRequest.method,
			path   : rawRequest.url,
			query  : rawRequest.query,
			body   : rawRequest.body,
			session: rawRequest.session
		})

		const response = await authenticate.html(request)
		return rawReply.code(response.statusCode).type('text/html').send(response.body)
	}
})

// Log out
app.route({
	method : 'GET',
	url    : '/logout',
	handler: async (rawRequest, rawReply) => {
		const request = toRequest<AppUser>({
			action : 'logout',
			headers: rawRequest.headers,
			method : rawRequest.method,
			path   : rawRequest.url,
			query  : rawRequest.query,
			body   : rawRequest.body,
			session: rawRequest.session
		})

		const response = await logout.html(request)
		return rawReply.code(response.statusCode).type('text/html').send(response.body)
	}
})

app.listen({ port: 3000 })
```

This example assumes that:

- your project has a configured data source via `@itrocks/storage`,
- `AppUser` instances are stored in that data source with valid
  `login`/`email` and `password` fields,
- sessions are available on the underlying HTTP request
  (`rawRequest.session`).

## API

### `class User extends Account`

Business entity representing an authenticated user. It extends
`Account` from `@itrocks/account` and adds an `email` field.

#### Decorators

- `@Representative('email')` – the `email` field is used as the
  representative value when instances are displayed in lists or detail
  views.
- `@Store()` – marks the entity as storable through `@itrocks/store`
  so that instances can be persisted and retrieved from a configured
  storage backend.

#### Properties

##### `email: string`

- Decorated with `@EmailAddress()` to ensure the value is a valid email
  address.
- Decorated with `@Required()` meaning it must be provided when creating
  a user.

This property is in addition to the `login` and `password` fields
inherited from `Account`.

### `class Login<T extends User = User> extends Action<T>`

Action responsible for displaying the login form.

#### Properties

##### `redirect: string`

- URL where the user will be redirected after a successful
  authentication.
- On a `GET /login` request, this is automatically set to the current
  path (`request.request.path`). On `POST`, it defaults to `'/'`.

You typically rely on the default behaviour, but you can override
`redirect` before calling `html` if you need custom logic.

#### Methods

##### `html(request: Request<T>): Promise<HtmlResponse>`

Renders the login HTML view based on the `login.html` template
shipped with the package. The `Request<T>` object contains the
typed entity (`T`) together with the HTTP request, session, and
action name.

### `class Authenticate<T extends User = User> extends Action<T>`

Action that validates credentials and authenticates a user.

#### Methods

##### `html(request: Request<T>): Promise<HtmlResponse>`

- Reads `login` and `password` from the request data and uses them
  to search for a matching user in the configured data source.
- If the `login` value contains an `@`, it is first interpreted as an
  email address and looked up against the `email` field; otherwise it
  is matched against the `login` field inherited from `Account`.
- When a user is found, it is stored in the session as
  `request.request.session.user` and a successful `authenticated.html`
  template is rendered with status code `200`.
- When no user matches, an `authentication-error.html` template is
  rendered with status code `401`.

In the success case, the found user data is merged back into the
search object so that bound forms or views reflect the authenticated
user.

### `class Logout<T extends User = User> extends Action<T>`

Action that logs out the current user.

#### Methods

##### `html(request: Request<T>): Promise<HtmlResponse>`

- Removes the `user` from the current session.
- Destroys the session (`request.request.session.destroy()`).
- Delegates to `new Login().html(request)` to display the login form
  again after logging out.

## Typical use cases

- **Simple login page** – use `Login` to expose a `/login` route that
  displays the form defined by this package.
- **Form‑based authentication** – use `Authenticate` to validate
  submitted credentials against a stored `User` entity and attach the
  result to the session.
- **Session‑based access control** – after `Authenticate` succeeds,
  check `request.request.session.user` in downstream routes or
  middlewares to authorise access to protected resources.
- **Logout endpoint** – use `Logout` to clear the authenticated user and
  destroy the session, then send the user back to the login screen.
- **Custom user subclass** – extend `User` to add domain‑specific
  attributes (roles, profile information, permissions) while still
  reusing the provided login, authenticate and logout actions.
