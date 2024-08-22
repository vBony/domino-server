import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import {createValidator} from '#validators/user'
import hash from '@adonisjs/core/services/hash'

export default class UsersController {
    async index() {
		const users = await User.all()
		return users
    }

	async show({response, params}: HttpContext) {
		if(params.id){
			const user = await User.find(params.id)


			if(user != null){
				return user
				
			}else{
				return response.status(404)
			}
		}
	}

	async getByToken({response, auth}: HttpContext){
		const authUser = auth.getUserOrFail()
		
		const user = await User.find(authUser.id)
		if(user != null){
			return user
			
		}else{
			return response.status(404)
		}
	}

	async create({request, response}: HttpContext){
		let data = request.body()
		
		data = await createValidator.validate(data)

		data.password = await hash.make(data.password)
		data.nickname = data.nickname
							.replace(/[^a-zA-Z0-9]+/g, ' ')
							.replace(/\s+/g, '_')
							.toLowerCase();

		let success = User.create(data)
		return success
	}
}