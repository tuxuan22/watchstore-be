const router = require('express').Router()
const controller = require('../controllers/order')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')

router.get('/', verifyAccessToken, controller.getUserOrder)
router.post('/', verifyAccessToken, controller.createOrder)
router.put('/status/:oid', [verifyAccessToken, isAdmin], controller.updateStatus)
router.get('/admin', verifyAccessToken, isAdmin, controller.getOrders)

module.exports = router

