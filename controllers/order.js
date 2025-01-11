const Order = require('../models/order')
const Product = require('../models/product')
const Coupon = require('../models/coupon')
const User = require('../models/user')
const asyncHandler = require('express-async-handler')

const createOrder = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const { products, total, address, status } = req.body
    if (address) {
        await User.findByIdAndUpdate(_id, { address, cart: [] })
    }
    const data = { products, total, orderBy: _id }
    if (status) data.status = status
    const rs = await Order.create(data)
    return res.status(200).json({
        success: rs ? true : false,
        rs: rs ? rs : 'Không thể tạo đơn hàng'
    })
})

const deleteOrder = asyncHandler(async (req, res) => {
    const { oid } = req.params
    const deleteOrder = await Order.findByIdAndDelete(oid)
    return res.status(200).json({
        success: deleteOrder ? true : false,
        mes: deleteOrder ? 'Xóa đơn hàng thành công' : 'Không thể xóa đơn hàng'
    })
})

const updateStatus = asyncHandler(async (req, res) => {
    const { oid } = req.params
    const { status } = req.body
    if (!status) throw new Error('Nhập vào các trường')
    const order = await Order.findById(oid)
    if (!order) throw new Error('Không tìm thấy đơn hàng')

    // Xử lý khi đơn hàng thành công
    if (status !== order.status) {
        if (status === 'Succeed') {
            // Decrease quantity and increase sold count for successful orders
            await Promise.all(order.products.map(async (item) => {
                await Product.findByIdAndUpdate(
                    item.product,
                    {
                        $inc: {
                            quantity: -item.quantity,
                            sold: +item.quantity
                        }
                    },
                    { new: true }
                )
            }))
        }

        if (status === 'Cancelled' || status === 'Processing') {
            // Increase quantity and decrease sold count for cancelled orders
            await Promise.all(order.products.map(async (item) => {
                await Product.findByIdAndUpdate(
                    item.product,
                    {
                        $inc: {
                            quantity: +item.quantity,
                            sold: -item.quantity
                        }
                    },
                    { new: true }
                )
            }))
        }
    }
    const response = await Order.findByIdAndUpdate(
        oid,
        { status },
        { new: true }
    )

    return res.status(200).json({
        success: response ? true : false,
        response: response ? response : 'Không thể cập nhật thông tin đơn hàng'
    })
})

const updateStatusUser = asyncHandler(async (req, res) => {
    const { oid } = req.params
    const { status } = req.body
    if (!status) throw new Error('Nhập vào các trường')
    const order = await Order.findById(oid)
    if (!order) throw new Error('Không tìm thấy đơn hàng')

    // Xử lý khi đơn hàng thành công    
    if (status !== order.status) {
        if (status === 'Succeed') {
            // console.log('successful order')

            await Promise.all(order.products.map(async (item) => {
                // console.log(`Updating product: ${item.product}`)

                await Product.findByIdAndUpdate(
                    item.product,
                    {
                        $inc: {
                            quantity: -item.quantity,
                            sold: +item.quantity
                        }
                    },
                    { new: true }
                )
            }))
        }

        if (status === 'Cancelled' || status === 'Processing') {
            await Promise.all(order.products.map(async (item) => {
                await Product.findByIdAndUpdate(
                    item.product,
                    {
                        $inc: {
                            quantity: +item.quantity,
                            sold: -item.quantity
                        }
                    },
                    { new: true }
                )
            }))
        }
    }
    const response = await Order.findByIdAndUpdate(
        oid,
        { status },
        { new: true }
    )

    return res.status(200).json({
        success: response ? true : false,
        response: response ? response : 'Không thể cập nhật thông tin đơn hàng'
    })
})


const getUserOrders = asyncHandler(async (req, res) => {
    const queries = { ...req.query }
    const { _id } = req.user
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
    const qr = { ...formattedQueries, orderBy: _id }

    let queryCommand = Order.find(qr)

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
        const counts = await Order.find(qr).countDocuments()

        return res.status(200).json({
            success: response ? true : false,
            counts,
            orders: response ? response : 'Không thể lấy thông tin các sản phẩm',
        })
    } catch (err) {
        throw new Error(err.message)
    }
})

const getOrders = asyncHandler(async (req, res) => {
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

    let queryCommand = Order.find(qr).populate({
        path: 'orderBy',
        select: 'firstname lastname ',
        transform: doc => {
            return doc ? `${doc.firstname} ${doc.lastname}` : '';
        }
    })

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
        const counts = await Order.find(qr).countDocuments()

        return res.status(200).json({
            success: response ? true : false,
            counts,
            orders: response ? response : 'Không thể lấy danh sách các đơn hàng',
        })
    } catch (err) {
        throw new Error(err.message)
    }
})



module.exports = {
    createOrder,
    updateStatus,
    deleteOrder,
    getUserOrders,
    getOrders,
    updateStatusUser
}