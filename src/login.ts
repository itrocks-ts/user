import { Action }     from '@itrocks/action'
import { getActions } from '@itrocks/action'
import { Request }    from '@itrocks/action-request'
import { User }       from './user'

export class Login<T extends User = User> extends Action<T>
{

	redirect = '/'

	async html(request: Request<T>)
	{
		const userType = request.type
		this.actions   = getActions(userType, request.action)
		this.redirect  = (request.request.method === 'GET') ? request.request.path : '/'
		return this.htmlTemplateResponse(new userType, request, __dirname + '/login.html')
	}

}
