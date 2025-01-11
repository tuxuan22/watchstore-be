const Brand = require('../models/brand')
const asyncHandler = require('express-async-handler')

const createNewBrand = asyncHandler(async (req, res) => {
    const { title } = req.body
    if (!title) throw new Error('Nhập vào các trường')
    const response = await Brand.create(req.body)
    return res.json({
        success: response ? true : false,
        mes: response ? 'Tạo thương hiệu thành công' : 'Tạo thương hiệu thất bại'
    })
})

const getBrands = asyncHandler(async (req, res) => {
    const queries = { ...req.query }
    //Tách các trường đặc biệt ra khỏi query
    const excludeFields = ['limit', 'sort', 'page', 'fields']
    excludeFields.forEach(el => delete queries[el])

    //Format lai cac operators cho dung cu phap mongoose
    let queryString = JSON.stringify(queries)
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, macthedEl => `$${macthedEl}`)
    const formattedQueries = JSON.parse(queryString)
    //    let brandQueryObject = {}

    //    //Filtering
    //    if (queries?.title) formattedQueries.title = { $regex: queries.title, $options: 'i' }
    //    if (queries?.category) formattedQueries.category = { $regex: queries.category, $options: 'i' }
    //    if (queries?.brand) {
    //        delete formattedQueries.brand
    //        const brandArr = queries.brand?.split(',')
    //        const brandQuery = brandArr.map(el => ({ brand: { $regex: el, $options: 'i' } }))
    //        brandQueryObject = { $or: brandQuery }
    //    }
    //    let queryObject = {}
    //    if (queries?.q) {
    //        delete formattedQueries.q
    //        queryObject = {
    //            $or: [
    //                { brand: { $regex: queries.q, $options: 'i' } },
    //                { title: { $regex: queries.q, $options: 'i' } },
    //                { category: { $regex: queries.q, $options: 'i' } },
    //                // {description:{$regex:queries.q,$options:'i'}},
    //            ]
    //        }
    //    }
    const qr = { ...formattedQueries }

    let queryCommand = Brand.find(qr)

    //Sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ')
        queryCommand = queryCommand.sort(sortBy)
    }

    //Fields limiting
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ')
        queryCommand = queryCommand.select(fields)
    }
    //Pagination
    const page = +req.query.page || 1
    const limit = +req.query.limit || process.env.LIMIT_PRODUCT
    const skip = (page - 1) * limit
    queryCommand = queryCommand.skip(skip).limit(limit)

    //Excute query
    try {
        const response = await queryCommand.exec()
        const counts = await Brand.find(qr).countDocuments()

        return res.status(200).json({
            success: response ? true : false,
            counts,
            brands: response ? response : 'Không thể lấy danh sách các thương hiệu',
        })
    } catch (err) {
        throw new Error(err.message)
    }
})

const updateBrand = asyncHandler(async (req, res) => {
    const { brid } = req.params
    const response = await Brand.findByIdAndUpdate(brid, req.body, { new: true })
    return res.json({
        success: response ? true : false,
        mes: response ? 'Cập nhật thương hiệu thành công' : 'Cập nhật thương hiệu thất bại'
    })
})

const deleteBrand = asyncHandler(async (req, res) => {
    const { brid } = req.params
    const response = await Brand.findByIdAndDelete(brid)
    return res.json({
        success: response ? true : false,
        mes: response ? 'Xóa thương hiệu thành công' : 'Xóa thương hiệu thất bại'
    })
})


module.exports = {
    createNewBrand,
    getBrands,
    updateBrand,
    deleteBrand,
}