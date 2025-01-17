const mongoose = require('mongoose') // Erase if already required

// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema({
    products: [{
        product: {
            type: mongoose.Types.ObjectId,
            ref: 'Product'
        },
        quantity: Number,
    }],
    address: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'Processing',
        enum: ['Cancelled', 'Processing', 'Succeed']
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'PayPal'],
        default: 'COD',
    },
    total: Number,
    orderBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
},
    {
        timestamps: true,
    })

//Export the model
module.exports = mongoose.model('Order', orderSchema)