class MemoryDataSource
{

	constructor(config)
	{
		this.users = config.users
	}

	async search(_type, search)
	{
		return this.users.filter(user => Object.entries(search ?? {}).every(([key, value]) => user[key] === value))
	}

	async searchOne(type, search)
	{
		return (await this.search(type, search))[0]
	}

}

module.exports = { MemoryDataSource }
