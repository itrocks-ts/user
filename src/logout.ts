import { Action }  from '@itrocks/action'
import { Request } from '@itrocks/action-request'
import { User }    from './user'

export class Logout<T extends User = User> extends Action<T>
{

	async html(request: Request<T>)
	{
		const session = request.request.session
		delete session.user
		await session.destroy?.()

		return this.htmlResponse('', 303, { Location: '/user/login' })
	}

}
