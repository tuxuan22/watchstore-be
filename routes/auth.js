const router = require('express').Router()
const passport = require('passport')
const { generateAccessToken, generateRefreshToken } = require('../middlewares/jwt')

router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
)

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        const accessToken = generateAccessToken(req.user._id, req.user.role)
        const refreshToken = generateRefreshToken(req.user._id)
        // Handle successful auth
        res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${accessToken}`)
    }
)

router.get('/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
)

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    async (req, res) => {
        try {
            const accessToken = generateAccessToken(req.user._id, req.user.role)
            const refreshToken = generateRefreshToken(req.user._id)

            // Update user's refresh token
            await User.findByIdAndUpdate(req.user._id, { refreshToken }, { new: true })

            // Set refresh token in cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000
            })

            res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${accessToken}`)
        } catch (error) {
            res.redirect('/login?error=auth_failed')
        }
    }
)

module.exports = router