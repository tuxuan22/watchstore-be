const mongoose = require('mongoose') // Erase if already required

// Declare the Schema of the Mongo model
var brandgSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        index: true,
    },
}, {
    timestamps: true,

})

//Export the model
module.exports = mongoose.model('Brand', brandgSchema)