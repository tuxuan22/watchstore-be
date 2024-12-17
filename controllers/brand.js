const Brand = require('../models/brand')
const asyncHandler = require('express-async-handler')

const createNewBrand = asyncHandler(async (req, res) => {
    const response = await Brand.create(req.body)
    return res.json({
        success: response ? true : false,
        createdBrand: response ? response : 'Không thể tạo thương hiệu'
    })
})

const getBrands = asyncHandler(async (req, res) => {
    const response = await Brand.find()
    return res.json({
        success: response ? true : false,
        brands: response ? response : 'Không thể lấy thông tin các thương hiệu'
    })
})

const updateBrand = asyncHandler(async (req, res) => {
    const { brid } = req.params
    const response = await Brand.findByIdAndUpdate(brid, req.body, { new: true })
    return res.json({
        success: response ? true : false,
        updatedBrand: response ? response : 'Không thể cập nhập thương hiệu'
    })
})

const deleteBrand = asyncHandler(async (req, res) => {
    const { brid } = req.params
    const response = await Brand.findByIdAndDelete(brid)
    return res.json({
        success: response ? true : false,
        deletedBrand: response ? response : 'Không thể xóa thương hiệu'
    })
})


module.exports = {
    createNewBrand,
    getBrands,
    updateBrand,
    deleteBrand,
}