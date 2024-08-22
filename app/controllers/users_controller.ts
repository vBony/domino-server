import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

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
}