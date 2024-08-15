/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import UsersController from '#controllers/users_controller'
import AuthController from '#controllers/auth_controller'

/**
 * USERS
 */
router.get('/user/:id', [UsersController, 'show'])
router.get('/users', [UsersController, 'index'])
.use(middleware.auth({
    guards: ['api']
}))

/**
 * USERS
 */
router.post('/auth', [AuthController, 'index'])