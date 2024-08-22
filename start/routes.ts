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
router.post('/user', [UsersController, 'create'])

// router.get('/users', [UsersController, 'index'])
// .use(middleware.auth({
//     guards: ['api']
// }))

/**
 * AUTHENTICATION
 */
router.post('/auth', [AuthController, 'index'])

router.get('/auth/user', [UsersController, 'getByToken'])
.use(middleware.auth({
    guards: ['api']
}))