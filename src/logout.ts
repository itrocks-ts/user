import { Action }  from '@itrocks/action'
import { Request } from '@itrocks/action-request'
import { User }    from './user'
import { Login }   from './login'

export class Logout extends Action
{

	async html(request: Request<User>)
	{
		delete request.request.session.user
		request.request.session.destroy()
		return new Login().html(request)
	}

}
