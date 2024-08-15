import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
    async index({request, response}: HttpContext) {
		const userR = request.only(['nickname', 'password'])

        const user = await User.verifyCredentials(userR.nickname, userR.password)
        const token = await User.accessTokens.create(user)
        
        return token
    }

}