const router = require('express').Router()
const controller = require('../controllers/user')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')
const uploader = require('../config/cloudinary.config')

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
router.put('/current', verifyAccessToken, uploader.single('avatar'), controller.updateUser)
router.put('/address/:uid', [verifyAccessToken], controller.updateAddressUser)
router.put('/cart', [verifyAccessToken], controller.updateCart)
router.put('/update-quantity', [verifyAccessToken], controller.updateQuantityCart)
router.delete('/remove-cart/:pid/:color', [verifyAccessToken], controller.removeProductInCart)
router.put('/wishlist/:pid', [verifyAccessToken], controller.updateWishlist)
router.put('/:uid', [verifyAccessToken, isAdmin], controller.updateUserByAdmin)


module.exports = router

