const mongoose = require('mongoose') // Erase if already required

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: Array,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    thumb: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        default: 0,
    },
    sold: {
        type: Number,
        default: 0,
    },
    images: {
        type: Array,
    },
    color: {
        type: String,
        required: true,
    },
    ratings: [
        {
            star: { type: Number },
            postedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
            comment: { type: String },
            updatedAt: {
                type: Date,
                default: Date.now,

            }
        }
    ],
    totalRatings: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    variants: [
        {
            color: String,
            price: Number,
            thumb: String,
            images: Array,
            title: String,
            sku: String,
        }
    ]
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    })

productSchema.virtual('finalPrice').get(function () {
    return this.discount > 0
        ? this.price * (1 - this.discount / 100)
        : this.price
})

//Export the model
module.exports = mongoose.model('Product', productSchema)