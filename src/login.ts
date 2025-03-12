import { Action }  from '@itrocks/action'
import { Request } from '@itrocks/action-request'
import { User }    from './user'

export class Login extends Action
{

	async html(request: Request<User>)
	{
		return this.htmlTemplateResponse(new request.type, request, __dirname + '/login.html')
	}

}
