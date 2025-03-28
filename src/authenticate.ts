import { Action }       from '@itrocks/action'
import { Request }      from '@itrocks/action-request'
import { dataToObject } from '@itrocks/data-to-object'
import { dataSource }   from '@itrocks/storage'
import { User }         from './user'

export class Authenticate extends Action
{

	async html(request: Request<User>)
	{
		let search = new request.type
		await dataToObject(search, request.request.data)

		const { login, password } = search
		let user: User | undefined
		if (search.login.includes('@')) {
			user = (await dataSource().search(User, { active: true, email: login, password }))[0]
		}
		if (!user) {
			user = (await dataSource().search(User, { active: true, login, password }))[0]
		}
		request.request.session.user = user
		const [templateFile, statusCode] = user
			? ['/authenticated.html', 200]
			: ['/authentication-error.html', 401]
		if (user) {
			Object.assign(search, request.request.data, user)
		}
		return this.htmlTemplateResponse(search, request, __dirname + templateFile, statusCode)
	}

}
