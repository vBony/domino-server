import {Router, Request, Response} from 'express'
import * as homeController from '../controllers/homeController'
import {Auth} from '../middlewares/Auth'
import * as authController from '../controllers/authController'
import * as authValidator from '../validators/user'

const router = Router()

router.get('/', Auth.private, homeController.home)
router.get('/contato', homeController.contato)
router.get('/sobre', homeController.sobre)

/**
 * USER
 */
router.post('/user', authValidator.register, authController.register)

/**
 * Auth
 */
router.post('/auth', authController.login)


export default router