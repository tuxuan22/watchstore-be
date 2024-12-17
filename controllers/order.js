const Order = require('../models/order')
const Coupon = require('../models/coupon')
const User = require('../models/user')
const asyncHandler = require('express-async-handler')

const createOrder = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const { products, total, address, status } = req.body
    if (address) {
        await User.findByIdAndUpdate(_id, { address, cart: [] })
    }
    const data = { products, total, postedBy: _id }
    if (status) data.status = status
    const rs = await Order.create(data)
    return res.status(200).json({
        success: rs ? true : false,
        rs: rs ? 'Tạo đơn hàng thành công' : 'Không thể tạo đơn hàng'
    })
})

const updateStatus = asyncHandler(async (req, res) => {
    const { oid } = req.params
    const { status } = req.body
    if (!status) throw new Error('Nhập vào các trường')
    const response = await Order.findByIdAndUpdate(oid, { status }, { new: true })
    return res.status(200).json({
        success: response ? true : false,
        response: response ? response : 'Cannot update order'
    })
})

const getUserOrder = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const response = await Order.find({ orderBy: _id })
    return res.status(200).json({
        success: response ? true : false,
        response: response ? response : 'Something went wrong'
    })
})

const getOrders = asyncHandler(async (req, res) => {
    const response = await Order.find()
    return res.status(200).json({
        success: response ? true : false,
        response: response ? response : 'Something went wrong'
    })
})

module.exports = {
    createOrder,
    updateStatus,
    getUserOrder,
    getOrders
}