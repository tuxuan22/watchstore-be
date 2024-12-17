const Blog = require('../models/blog')
const asyncHandler = require('express-async-handler')

const createNewBlog = asyncHandler(async (req, res) => {
    const { title, description, category } = req.body
    if (!title || !description || !category) throw new Error('Nhập vào các trường')
    const response = await Blog.create(req.body)
    return res.status(200).json({
        success: response ? true : false,
        createdBlog: response ? response : 'Không thể tạo blog mới'
    })
})

const updateBlog = asyncHandler(async (req, res) => {
    const { bid } = req.params
    if (Object.keys(bid).length === 0) throw new Error('Nhập vào các trường')
    const response = await Blog.findByIdAndUpdate(bid, req.body, { new: true })
    return res.json({
        success: response ? true : false,
        updatedBlog: response ? response : 'Không thể sửa blog'
    })
})

const getBloges = asyncHandler(async (req, res) => {
    const response = await Blog.find()
    return res.json({
        success: response ? true : false,
        blogs: response ? response : 'Không thể lấy thông tin các blog'
    })
})

//Like & Dislike

/*
Khi nguoi dung like 1 blog 
1. Kiem tra xem nguoi dung truoc do co dislike hay k -> bo dislike
2. Kiem tra xem nguoi dung truoc do co like hay k -> bo like/ like
*/

const likeBlog = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const { bid } = req.params
    if (!bid) throw new Error('Nhập vào các trường')
    const blog = await Blog.findById(bid)
    const alreadyDisliked = blog?.dislikes?.find(el => el.toString() === _id)
    if (alreadyDisliked) {
        const response = await Blog.findByIdAndUpdate(bid, { $pull: { dislikes: _id } }, { new: true })
        return res.json({
            success: response ? true : false,
            rs: response
        })
    }
    const isLiked = blog?.likes?.find(el => el.toString() === _id)
    if (isLiked) {
        const response = await Blog.findByIdAndUpdate(bid, { $pull: { likes: _id } }, { new: true })
        return res.json({
            success: response ? true : false,
            rs: response
        })
    } else {
        const response = await Blog.findByIdAndUpdate(bid, { $push: { likes: _id } }, { new: true })
        return res.json({
            success: response ? true : false,
            rs: response
        })
    }
})

const dislikeBlog = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const { bid } = req.params
    if (!bid) throw new Error('Nhập vào các trường')
    const blog = await Blog.findById(bid)
    const alreadyLiked = blog?.likes?.find(el => el.toString() === _id)
    if (alreadyLiked) {
        const response = await Blog.findByIdAndUpdate(bid, { $pull: { likes: _id } }, { new: true })
        return res.json({
            success: response ? true : false,
            rs: response
        })
    }
    const isDisiked = blog?.dislikes?.find(el => el.toString() === _id)
    if (isDisiked) {
        const response = await Blog.findByIdAndUpdate(bid, { $pull: { dislikes: _id } }, { new: true })
        return res.json({
            success: response ? true : false,
            rs: response
        })
    } else {
        const response = await Blog.findByIdAndUpdate(bid, { $push: { dislikes: _id } }, { new: true })
        return res.json({
            success: response ? true : false,
            rs: response
        })
    }
})

const getBlog = asyncHandler(async (req, res) => {
    const { bid } = req.params
    const blog = await Blog.findByIdAndUpdate(bid, { $inc: { numberViews: 1 } }, { new: true })
        .populate('likes', 'name')
        .populate('dislikes', 'name')
    return res.json({
        success: blog ? true : false,
        rs: blog
    })
})

const deleteBlog = asyncHandler(async (req, res) => {
    const { bid } = req.params
    const blog = await Blog.findByIdAndDelete(bid)
    return res.json({
        success: blog ? true : false,
        deletedBlog: blog ? blog : 'Không thể xóa blog'
    })
})

const uploadImagesBlog = asyncHandler(async (req, res) => {
    const { bid } = req.params
    if (!req.file) throw new Error('Nhập vào các trường')
    const response = await Blog.findByIdAndUpdate(bid, { image: req.file.path }, { new: true })
    return res.json({
        status: response ? true : false,
        updatedBlog: response ? response : 'Không thể tải ảnh blog lên'
    })

})

module.exports = {
    createNewBlog,
    updateBlog,
    getBloges,
    likeBlog,
    dislikeBlog,
    getBlog,
    deleteBlog,
    uploadImagesBlog
}