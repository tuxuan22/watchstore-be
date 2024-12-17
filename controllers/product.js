const Product = require('../models/product')
const asyncHandler = require('express-async-handler')
const slugify = require('vietnamese-slug')
const skuId = require('uniqid')

const createProduct = asyncHandler(async (req, res) => {
    const { title, price, description, brand, category, color, quantity } = req.body
    const thumb = req?.files?.thumb[0]?.path
    const images = req.files?.images?.map(el => el.path)
    if (!(title && price && description && brand && category && color && quantity)) throw new Error('Nhập vào các trường')
    req.body.slug = slugify(title)
    if (thumb) req.body.thumb = thumb
    if (images) req.body.images = images
    const newProduct = await Product.create(req.body)
    return res.status(200).json({
        success: newProduct ? true : false,
        mes: newProduct ? 'Tạo sản phẩm thành công' : 'Không thể tạo sản phẩm mới'
    })
})

const getProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params
    const product = await Product.findById(pid).populate({
        path: 'ratings',
        populate: {
            path: 'postedBy',
            select: 'firstname lastname avatar',
        }
    })
    return res.status(200).json({
        success: product ? true : false,
        productData: product ? product : 'Không thể lấy thông tin sản phẩm'
    })
})

const getProducts = asyncHandler(async (req, res) => {
    const queries = { ...req.query }
    //Tách các trường đặc biệt ra khỏi query
    const excludeFields = ['limit', 'sort', 'page', 'fields']
    excludeFields.forEach(el => delete queries[el])

    //Format lai cac operators cho dung cu phap mongoose
    let queryString = JSON.stringify(queries)
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, macthedEl => `$${macthedEl}`)
    const formattedQueries = JSON.parse(queryString)
    let brandQueryObject = {}

    //Filtering
    if (queries?.title) formattedQueries.title = { $regex: queries.title, $options: 'i' }
    if (queries?.category) formattedQueries.category = { $regex: queries.category, $options: 'i' }
    if (queries?.brand) {
        delete formattedQueries.brand
        const brandArr = queries.brand?.split(',')
        const brandQuery = brandArr.map(el => ({ brand: { $regex: el, $options: 'i' } }))
        brandQueryObject = { $or: brandQuery }
    }
    let queryObject = {}
    if (queries?.q) {
        delete formattedQueries.q
        queryObject = {
            $or: [
                { brand: { $regex: queries.q, $options: 'i' } },
                { title: { $regex: queries.q, $options: 'i' } },
                { category: { $regex: queries.q, $options: 'i' } },
                // {description:{$regex:queries.q,$options:'i'}},
            ]
        }
    }
    const qr = { ...brandQueryObject, ...formattedQueries, ...queryObject }

    let queryCommand = Product.find(qr)

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
        const counts = await Product.find(qr).countDocuments()

        return res.status(200).json({
            success: response ? true : false,
            counts,
            products: response ? response : 'Không thể lấy thông tin các sản phẩm',
        })
    } catch (err) {
        throw new Error(err.message)
    }


})

const updateProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params
    const files = req?.files
    if (files?.thumb) req.body.thumb = files?.thumb[0]?.path
    if (files?.images) req.body.images = files?.images.map(el => el.path)
    if (req.body && req.body.title) req.body.slug = slugify(req.body.title)
    const updateProduct = await Product.findByIdAndUpdate(pid, req.body, { new: true })
    return res.status(200).json({
        success: updateProduct ? true : false,
        mes: updateProduct ? 'Cập nhật thành công' : 'Không thể cập nhật sản phẩm'
    })
})

const deleteProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params
    const deleteProduct = await Product.findByIdAndDelete(pid)
    return res.status(200).json({
        success: deleteProduct ? true : false,
        mes: deleteProduct ? 'Xóa sản phẩm thành công' : 'Không thể xóa sản phẩm'
    })
})

const ratings = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const { star, comment, pid, updatedAt } = req.body
    if (!star || !pid) throw new Error('Nhập vào các trường')
    const ratingProduct = await Product.findById(pid)
    const alreadyRating = ratingProduct?.ratings?.find(el => el.postedBy.toString() === _id)
    // console.log({ ratingProduct })

    if (alreadyRating) {
        await Product.updateOne({
            ratings: { $elemMatch: alreadyRating }
        }, {
            $set: {
                'ratings.$.star': star,
                'ratings.$.comment': comment,
                'ratings.$.updatedAt': updatedAt
            }
        }, { new: true })
    } else {
        await Product.findByIdAndUpdate(pid, {
            $push: {
                ratings: {
                    star,
                    comment,
                    postedBy: _id,
                    updatedAt
                }
            }
        }, { new: true })

    }
    //Total raings
    const updatedProduct = await Product.findById(pid)
    const ratingCount = updatedProduct.ratings.length
    const sumRatings = updatedProduct.ratings.reduce((sum, el) => sum + +el.star, 0)
    updatedProduct.totalRatings = Math.round(sumRatings * 10 / ratingCount) / 10

    await updatedProduct.save()

    return res.status(200).json({
        success: true,
        updatedProduct
    })
})

const uploadImagesProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params
    if (!req.files) throw new Error('Nhập vào các trường')
    const response = await Product.findByIdAndUpdate(pid, { $push: { images: { $each: req.files.map(el => el.path) } } }, { new: true })
    return res.json({
        success: response ? true : false,
        updatedProduct: response ? response : 'Không thể tải ảnh sản phẩm lên'
    })

})

const addVariant = asyncHandler(async (req, res) => {
    const { pid } = req.params
    const { title, price, color } = req.body
    const thumb = req?.files?.thumb[0]?.path
    const images = req?.files?.images?.map(el => el.path)
    if (!(title && price && color)) throw new Error('Nhập vào các trường')
    const response = await Product.findByIdAndUpdate(pid, {
        $push: {
            variants: { color, price, title, thumb, images, sku: skuId().toUpperCase() }
        }
    }, { new: true })
    return res.json({
        success: response ? true : false,
        mes: response ? 'Thêm biến thể thành công' : 'Không thể thêm biến thể'
    })
})

module.exports = {
    createProduct,
    getProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    ratings,
    uploadImagesProduct,
    addVariant
}