const router = require('express').Router()
const controller = require('../controllers/product')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')
const uploader = require('../config/cloudinary.config')

router.post('/', [verifyAccessToken, isAdmin], uploader.fields([
    { name: 'images', maxCount: 10 },
    { name: 'thumb', maxCount: 1 }
]), controller.createProduct)
router.get('/', controller.getProducts)
router.get('/ratingUser', verifyAccessToken, controller.getUserRatings)
router.put('/ratings', verifyAccessToken, controller.ratings)


router.put('/uploadimage/:pid', [verifyAccessToken, isAdmin], uploader.array('images', 10), controller.uploadImagesProduct)
router.put('/variant/:pid', verifyAccessToken, isAdmin, uploader.fields([
    { name: 'images', maxCount: 10 },
    { name: 'thumb', maxCount: 1 }
]), controller.addVariant)

router.put('/:pid', verifyAccessToken, isAdmin, uploader.fields([
    { name: 'images', maxCount: 10 },
    { name: 'thumb', maxCount: 1 }
]), controller.updateProduct)
router.delete('/:pid', [verifyAccessToken, isAdmin], controller.deleteProduct)
router.get('/:pid', controller.getProduct)

module.exports = router

