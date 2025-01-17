const ProductCategory = require('../models/productCategory')
const asyncHandler = require('express-async-handler')
const slugify = require('vietnamese-slug')

const createCategory = asyncHandler(async (req, res) => {
    req.body.slug = slugify(req.body.title)
    const response = await ProductCategory.create(req.body)
    return res.json({
        success: response ? true : false,
        mes: response ? 'Tạo danh mục sản phẩm thành công' : 'Tạo danh mục sản phẩm thất bại'
    })
})

const getCategories = asyncHandler(async (req, res) => {
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

    let queryCommand = ProductCategory.find(qr)

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
    const limit = 5
    const skip = (page - 1) * limit
    queryCommand = queryCommand.skip(skip).limit(limit)

    //Excute query
    try {
        const response = await queryCommand.exec()
        const counts = await ProductCategory.find(qr).countDocuments()

        return res.status(200).json({
            success: response ? true : false,
            counts,
            productCategories: response ? response : 'Không thể lấy danh sách danh mục sản phẩm',
        })
    } catch (err) {
        throw new Error(err.message)
    }
})

const updateCategory = asyncHandler(async (req, res) => {
    const { pcid } = req.params
    const response = await ProductCategory.findByIdAndUpdate(pcid, req.body, { new: true })
    return res.json({
        success: response ? true : false,
        mes: response ? 'Cập nhật danh mục sản phẩm thành công' : 'Cập nhật danh mục sản phẩm thất bại'
    })
})

const deleteCategory = asyncHandler(async (req, res) => {
    const { pcid } = req.params
    const response = await ProductCategory.findByIdAndDelete(pcid)
    return res.json({
        success: response ? true : false,
        mes: response ? 'Xóa danh mục sản phẩm thành công' : 'Xóa danh mục sản phẩm thất bại'
    })
})


module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
}