const router = require('express').Router()
const controller = require('../controllers/user')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')

router.post('/register', controller.register)
router.put('/email/verify/:token', controller.emailVerify)
router.post('/login', controller.login)
router.get('/current', verifyAccessToken, controller.getCurrent)
router.post('/refreshtoken', controller.refreshAccessToken)
router.get('/logout', controller.logout)
router.post('/forgotpassword', controller.forgotPassword)
router.put('/resetpassword', controller.resetPassword)
router.get('/', [verifyAccessToken, isAdmin], controller.getUsers)
router.delete('/:uid', [verifyAccessToken, isAdmin], controller.deleteUser)
router.put('/current', [verifyAccessToken], controller.updateUser)
router.put('/address/:uid', [verifyAccessToken], controller.updateAddressUser)
router.put('/cart', [verifyAccessToken], controller.updateCart)
router.delete('/remove-cart/:pid/:color', [verifyAccessToken], controller.removeProductInCart)
router.put('/:uid', [verifyAccessToken, isAdmin], controller.updateUserByAdmin)


module.exports = router

