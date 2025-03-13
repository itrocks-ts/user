import { Action }     from '@itrocks/action'
import { getActions } from '@itrocks/action'
import { Request }    from '@itrocks/action-request'
import { routeOf }    from '@itrocks/route'
import { User }       from './user'

export class Login extends Action
{

	async html(request: Request<User>)
	{
		const route  = routeOf(this)
		this.actions = getActions(request.type, route.slice(route.lastIndexOf('/') + 1))
		return this.htmlTemplateResponse(new request.type, request, __dirname + '/login.html')
	}

}
