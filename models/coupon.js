const mongoose = require('mongoose') // Erase if already required

// Declare the Schema of the Mongo model
var couponSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        uppercase: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,

    },

    discountType: {
        type: String,
        required: true,
        enum: ['FIXED', 'PERCENTAGE'],
    },
    discount: {
        type: Number,
        required: true,
        validate: {
            validator: function (value) {
                if (this.discountType === 'PERCENTAGE') {
                    return value <= 100 && value > 0;
                }
                return value > 0;
            },
            message: 'Invalid discount value'
        }
    },
    expiry: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
})

//Export the model
module.exports = mongoose.model('Coupon', couponSchema)