import { Action }     from '@itrocks/action'
import { getActions } from '@itrocks/action'
import { Request }    from '@itrocks/action-request'
import { User }       from './user'

const DISABLE = ['/user/login', '/user/logout']

export class Login<T extends User = User> extends Action<T>
{

	redirect = '/'

	async html(request: Request<T>)
	{
		const coreRequest = request.request
		const userType    = request.type
		this.actions      = getActions(userType, request.action)
		this.redirect     = ((coreRequest.method === 'GET') && !DISABLE.includes(coreRequest.path)) ? coreRequest.path : '/'
		return this.htmlTemplateResponse(new userType, request, __dirname + '/login.html')
	}

}
