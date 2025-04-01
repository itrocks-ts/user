import { Action }       from '@itrocks/action'
import { Request }      from '@itrocks/action-request'
import { Type }         from '@itrocks/class-type'
import { dataToObject } from '@itrocks/data-to-object'
import { dataSource }   from '@itrocks/storage'
import { User }         from './user'

export class Authenticate<T extends User = User> extends Action<T>
{

	async html(request: Request<T>)
	{
		const userType: Type<User> = request.type
		const search = new userType
		await dataToObject(search, request.request.data)

		const { login, password } = search
		let user: User | undefined
		if (search.login.includes('@')) {
			user = await dataSource().searchOne(userType, { email: login, password })
		}
		user ??= await dataSource().searchOne(userType, { login, password })
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
