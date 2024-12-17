const router = require('express').Router()
const controller = require('../controllers/brand')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')

router.get('/', controller.getBrands)
router.post('/', [verifyAccessToken, isAdmin], controller.createNewBrand)
router.put('/:brid', [verifyAccessToken, isAdmin], controller.updateBrand)
router.delete('/:brid', [verifyAccessToken, isAdmin], controller.deleteBrand)

module.exports = router

