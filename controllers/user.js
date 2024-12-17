const User = require('../models/user')
const asyncHandler = require('express-async-handler')
const { generateAccessToken, generateRefreshToken } = require('../middlewares/jwt')
const jwt = require('jsonwebtoken')
const { sendMail } = require('../utils/sendMail')
const crypto = require('crypto')


const register = asyncHandler(async (req, res) => {
    const { email, password, firstname, lastname, mobile } = req.body
    if (!email || !password || !firstname || !lastname || !mobile)
        return res.status(400).json({
            success: false,
            mes: 'Nhập vào các trường'
        })
    const user = await User.findOne({ email })
    if (user)
        throw new Error('Người dùng đã tồn tại!')
    else {
        const token = Math.floor(100000 + Math.random() * 900000)
        const emailedited = btoa(email) + '@' + token
        // res.cookie('dataregister', { ...req.body, token }, { httpOnly: true, maxAge: 15 * 60 * 1000 })
        // const html = `Xin vui lòng click vào link dưới đây để hoàn tất quá trình đăng ký. Link này sẽ hết hạn sau 15 phút kể từ bây giờ. 
        //  <a href=${process.env.URL_SERVER}/api/user/email/verify/${token}>Click here</a>`
        const newUser = await User.create({
            email: btoa(email) + '@' + token, password, firstname, lastname, mobile
        })
        if (newUser) {
            const html = `<h2>Mã đăng ký:</h2></br><blockquote>${token}</blockquote>`
            await sendMail({ email, html, subject: 'Hoàn tất đăng ký' })
        }
        setTimeout(async () => {
            await User.deleteOne({ email: emailedited })

        }, [300000])
        return res.json({
            success: newUser ? true : false,
            mes: newUser ? 'Vui lòng check email để kích hoạt tài khoản' : 'Có lỗi xảy ra'
        })
        // const newUser = await User.create({
        //     email, password, firstname, lastname, mobile
        // })
        // return res.json({
        //     success: newUser ? true : false,
        //     mes: newUser ? 'Đăng ký tài khoản thành công' : 'Có lỗi xảy ra'
        // })
    }
})

const emailVerify = asyncHandler(async (req, res) => {
    const { token } = req.params
    const notActivedEmail = await User.findOne({ email: new RegExp(`${token}$`) })
    if (notActivedEmail) {
        notActivedEmail.email = atob(notActivedEmail?.email?.split('@')[0])
        notActivedEmail.save()
    }
    return res.json({
        success: notActivedEmail ? true : false,
        mes: notActivedEmail ? 'Đăng ký tài khoản thành công. Vui lòng đến đăng nhập' : 'Có lỗi xảy ra'
    })

})

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password)
        return res.status(400).json({
            success: false,
            mes: 'Nhập vào các trường'
        })

    const response = await User.findOne({ email })
    if (response && await response.isCorrectPassword(password)) {

        const { password, role, refreshToken, ...userData } = response.toObject()

        //Tao access token 
        const accessToken = generateAccessToken(response._id, role)

        //Tao refresh token
        const newRefreshToken = generateRefreshToken(response._id)

        //Luu refresh token vao database
        await User.findByIdAndUpdate(response._id, { refreshToken: newRefreshToken }, { new: true })

        //Luu refresh token vao cookie
        res.cookie('refreshToken', newRefreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 })
        return res.status(200).json({
            success: true,
            accessToken,
            userData
        })
    } else {
        throw new Error('Thông tin xác thực không hợp lệ!')
    }
})

const getCurrent = asyncHandler(async (req, res) => {
    const { _id } = req.user

    const user = await User.findById(_id).select('-refreshToken -password').populate({
        path: 'cart',
        populate: {
            path: 'product',
            select: 'title thumb price'
        }
    })
    return res.status(200).json({
        success: true,
        rs: user ? user : 'User not found'
    })
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    //Lay token tu cookie
    const cookie = req.cookies

    //Kiem tra co token hay ko
    if (!cookie && !cookie?.refreshToken) throw new Error('No refresh token in cookies')

    //Kiem tra token co hop le hay ko
    const rs = await jwt.verify(cookie.refreshToken, process.env.JWT_SECRET)
    const response = await User.findOne({ _id: rs._id, refreshToken: cookie.refreshToken })
    return res.status(200).json({
        success: response ? true : false,
        newAccessToken: response ? generateAccessToken(response._id, response.role) : 'Refresh token not valid'
    })
})

const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies
    if (!cookie && !cookie.refreshToken) throw new Error('No refresh token in cookies')
    await User.findOneAndUpdate({ refreshToken: cookie.refreshToken }, { refreshToken: '' }, { new: true })
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true
    })
    return res.status(200).json({
        success: true,
        mes: 'Logout successfully'
    })
})

//Reset password gui OTP ve mail
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body
    if (!email) throw new Error('Vui lòng nhập email')
    const user = await User.findOne({ email })
    if (!user) throw new Error('Không tìm thấy email người dùng')
    const resetToken = user.createPasswordChangedToken()
    await user.save()

    const html = `Xin vui lòng click vào link dưới đây để thay đổi mật khẩu.Link này sẽ hết hạn sau 15 phút kể từ bây giờ. 
    <a href = ${process.env.CLIENT_URL}/resetpassword/${resetToken}>Click here</a> `

    const data = {
        email,
        html,
        subject: 'Quên mật khẩu'
    }
    const rs = await sendMail(data)
    return res.status(200).json({
        success: rs.response?.includes('OK') ? true : false,
        mes: rs.response?.includes('OK') ? 'Hãy kiểm tra mail của bạn' : 'Đã có lỗi, vui lòng thử lại sau'
    })
})

const resetPassword = asyncHandler(async (req, res) => {
    const { password, token } = req.body
    if (!password || !token) throw new Error('Nhập vào các trường')
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({ passwordResetToken, passwordResetExpires: { $gt: Date.now() } })
    if (!user) throw new Error('Invalid reset token')
    user.password = password
    user.passwordResetToken = undefined
    user.passwordChangedAt = Date.now()
    user.passwordResetExpires = undefined
    await user.save()
    return res.status(200).json({
        success: user ? true : false,
        mes: user ? 'Đã cập nhật  mật khẩu mới' : 'Có lỗi xảy ra'
    })
})

const getUsers = asyncHandler(async (req, res) => {
    const queries = { ...req.query }
    //Tách các trường đặc biệt ra khỏi query
    const excludeFields = ['limit', 'sort', 'page', 'fields']
    excludeFields.forEach(el => delete queries[el])

    //Format lai cac operators cho dung cu phap mongoose
    let queryString = JSON.stringify(queries)
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, macthedEl => `$${macthedEl}`)
    const formattedQueries = JSON.parse(queryString)

    //Filtering
    if (queries?.name) formattedQueries.name = { $regex: queries.name, $options: 'i' }

    if (req.query.q) {
        delete formattedQueries.q
        formattedQueries['$or'] = [
            { firstname: { $regex: req.query.q, $options: 'i' } },
            { lastname: { $regex: req.query.q, $options: 'i' } },

            { email: { $regex: req.query.q, $options: 'i' } }
        ]
    }

    let queryCommand = User.find(formattedQueries)

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
    const limit = +req.query.limit || process.env.LIMIT_USER
    const skip = (page - 1) * limit
    queryCommand = queryCommand.skip(skip).limit(limit)

    //Excute query
    try {
        const response = await queryCommand.exec()
        const counts = await User.find(formattedQueries).countDocuments()

        return res.status(200).json({
            success: response ? true : false,
            counts,
            users: response ? response : 'Không thể lấy thông tin người dùng',
        })
    } catch (err) {
        throw new Error(err.message)
    }
})

const deleteUser = asyncHandler(async (req, res) => {
    const { uid } = req.params
    const response = await User.findByIdAndDelete(uid)
    return res.status(200).json({
        success: response ? true : false,
        mes: response ? `Người dùng có email ${response.email} đã xóa` : 'Không tìm thấy người dùng để xóa'
    })
})

const updateUser = asyncHandler(async (req, res) => {
    const { _id } = req.user
    if (!_id || Object.keys(req.body).length === 0) throw new Error('Nhập vào các trường')
    const response = await User.findByIdAndUpdate(_id, req.body, { new: true }).select('-password -role')
    return res.status(200).json({
        success: response ? true : false,
        updateUser: response ? response : 'Có lỗi xảy ra'
    })
})

const updateUserByAdmin = asyncHandler(async (req, res) => {
    const { uid } = req.params
    if (Object.keys(req.body).length === 0) throw new Error('Nhập vào các trường')
    const response = await User.findByIdAndUpdate(uid, req.body, { new: true }).select('-password -role')
    return res.status(200).json({
        success: response ? true : false,
        mes: response ? 'Cập nhật thành công' : 'Có lỗi xảy ra'
    })
})

const updateAddressUser = asyncHandler(async (req, res) => {
    const { _id } = req.user
    if (!req.body.address) throw new Error('Nhập vào các trường')
    const response = await User.findByIdAndUpdate(_id, { $push: { address: req.body.address } }, { new: true }).select('-password -role')
    return res.status(200).json({
        success: response ? true : false,
        updateUser: response ? response : 'Có lỗi xảy ra'
    })
})

const updateCart = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const { pid, quantity = 1, color, price, thumb, title } = req.body
    if (!pid || !color) throw new Error('Nhập vào các trường')
    const user = await User.findById(_id).select('cart')
    const alreadyProduct = user?.cart?.find(el => el.product.toString() === pid && el.color === color)
    if (alreadyProduct) {
        const response = await User.updateOne(
            { cart: { $elemMatch: alreadyProduct } }, {
            $set: {
                'cart.$.thumb': thumb,
                'cart.$.price': price,
                'cart.$.title': title,
                // 'cart.$.quantity': quantity,
            },
            $inc: { "cart.$.quantity": quantity },
        }, { new: true })
        return res.status(200).json({
            success: response ? true : false,
            mes: response ? 'Giỏ hàng đã được cập nhật' : 'Có lỗi xảy ra'
        })
    } else {
        const response = await User.findByIdAndUpdate(_id, { $push: { cart: { product: pid, quantity, color, price, thumb, title } } }, { new: true })
        return res.status(200).json({
            success: response ? true : false,
            mes: response ? 'Giỏ hàng đã được cập nhật' : 'Có lỗi xảy ra'
        })
    }
})

const removeProductInCart = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const { pid, color } = req.params
    const user = await User.findById(_id).select('cart')
    const alreadyProduct = user?.cart?.find(el => el.product.toString() === pid && el.color === color)
    if (!alreadyProduct) {
        return res.status(200).json({
            success: true,
            mes: 'Sản phẩm đã được xóa khỏi giỏ hàng'
        })
    }
    const response = await User.findByIdAndUpdate(_id, { $pull: { cart: { product: pid, color } } }, { new: true })
    return res.status(200).json({
        success: response ? true : false,
        mes: response ? 'Sản phẩm đã được xóa khỏi giỏ hàng' : 'Có lỗi xảy ra'
    })

})

module.exports = {
    register,
    emailVerify,
    login,
    getCurrent,
    refreshAccessToken,
    logout,
    forgotPassword,
    resetPassword,
    getUsers,
    deleteUser,
    updateUser,
    updateUserByAdmin,
    updateAddressUser,
    updateCart,
    removeProductInCart
}