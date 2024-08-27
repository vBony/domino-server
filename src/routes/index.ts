import {Router, Request, Response} from 'express'
import * as homeController from '../controllers/homeController'
import {Auth} from '../middlewares/Auth'
import * as authController from '../controllers/authController'
import * as authValidator from '../validators/authValidator'

const router = Router()

router.get('/', Auth.private, homeController.home)
router.get('/contato', homeController.contato)
router.get('/sobre', homeController.sobre)
router.post('/login', authController.login)
router.post('/signup', authValidator.register, authController.register)


export default router