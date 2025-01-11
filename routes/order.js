const router = require('express').Router()
const controller = require('../controllers/order')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')

router.post('/', verifyAccessToken, controller.createOrder)
router.put('/status/admin/:oid', [verifyAccessToken, isAdmin], controller.updateStatus)
router.put('/status/:oid', verifyAccessToken, controller.updateStatusUser)
router.delete('/:oid', [verifyAccessToken, isAdmin], controller.deleteOrder)
router.get('/admin', verifyAccessToken, isAdmin, controller.getOrders)
router.get('/', verifyAccessToken, controller.getUserOrders)

module.exports = router

