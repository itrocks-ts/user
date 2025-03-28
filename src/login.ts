import { Action }     from '@itrocks/action'
import { getActions } from '@itrocks/action'
import { Request }    from '@itrocks/action-request'
import { User }       from './user'

export class Login extends Action
{

	redirect = '/'

	async html(request: Request<User>)
	{
		this.actions  = getActions(request.type, request.action)
		this.redirect = (request.request.method === 'GET') ? request.request.path : '/'
		return this.htmlTemplateResponse(new request.type, request, __dirname + '/login.html')
	}

}
