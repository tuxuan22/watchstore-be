const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const User = require('../models/user')

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const existingUser = await User.findOne({ email: profile.emails[0].value })
            if (existingUser) return done(null, existingUser)

            const newUser = await User.create({
                email: profile.emails[0].value,
                firstname: profile.name.givenName,
                lastname: profile.name.familyName,
                password: Math.random().toString(36).slice(-8),
                mobile: ''
            })
            done(null, newUser)
        } catch (error) {
            done(error, null)
        }
    }
))

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name']
},
    async (accessToken, refreshToken, profile, done) => {
        // Similar implementation as Google strategy
    }
))