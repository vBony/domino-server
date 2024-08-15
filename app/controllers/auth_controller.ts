import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
    async index({request, response}: HttpContext) {
		const userR = request.only(['usu_nickname', 'usu_password'])

        const user = await User.verifyCredentials(userR.usu_nickname, userR.usu_password)

        return user
    }

}