import { Account }        from '@itrocks/account'
import { Representative } from '@itrocks/class-view'
import { EmailAddress }   from '@itrocks/email-address'
import { Required }       from '@itrocks/required'
import { Store }          from '@itrocks/store'

@Representative('email') @Store()
export class User extends Account
{

	@EmailAddress() @Required()
	email = ''

}
