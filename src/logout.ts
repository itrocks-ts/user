import { Action }  from '@itrocks/action'
import { Request } from '@itrocks/action-request'
import { User }    from './user'
import { Login }   from './login'

export class Logout<T extends User = User> extends Action<T>
{

	async html(request: Request<T>)
	{
		const session = request.request.session
		delete session.user
		session.destroy()

		request.action = 'login'
		return new Login().html(request)
	}

}
