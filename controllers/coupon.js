const Coupon = require('../models/coupon')
const asyncHandler = require('express-async-handler')

const createNewCoupon = asyncHandler(async (req, res) => {
    const { name, discount, expiry, code, discountType } = req.body
    if (!name || !discount || !expiry || !code || !discountType) throw new Error('Nhập vào các trường')
    if (discountType === 'PERCENTAGE' && (discount <= 0 || discount > 100)) throw new Error('Phần trăm giảm giá từ 0 đến 100')
    if (discountType === 'FIXED' && discount <= 0) throw new Error('Giá trị giảm giá phải lớn hơn 0')

    const response = await Coupon.create({
        ...req.body,
        expiry: Date.now() + +expiry * 24 * 60 * 60 * 1000
    })
    return res.json({
        success: response ? true : false,
        createdCoupon: response ? response : 'Cannot create new coupon'
    })
})

const getCoupons = asyncHandler(async (req, res) => {
    const response = await Coupon.find().select('-createdAt -updatedAt')
    return res.json({
        success: response ? true : false,
        coupons: response ? response : 'Cannot get coupons'
    })
})

const updateCoupon = asyncHandler(async (req, res) => {
    const { cid } = req.params
    if (Object.keys(req.body).length === 0) throw new Error('Nhập vào các trường')
    if (req.body.expiry) req.body.expiry = Date.now() + +req.body.expiry * 24 * 60 * 60 * 1000
    const response = await Coupon.findByIdAndUpdate(cid, req.body, { new: true })
    return res.json({
        success: response ? true : false,
        updatedCoupon: response ? response : 'Cannot update coupon'
    })
})

const deleteCoupon = asyncHandler(async (req, res) => {
    const { cid } = req.params
    const response = await Coupon.findByIdAndDelete(cid, req.body, { new: true })
    return res.json({
        success: response ? true : false,
        deletedCoupon: response ? response : 'Cannot delete coupon'
    })
})

module.exports = {
    createNewCoupon,
    getCoupons,
    updateCoupon,
    deleteCoupon,
}