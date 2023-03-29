const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RolSchema = new Schema(
    {
        rol: Schema.Types.String,
    },
    {collection:'rol'}
)

module.exports = mongoose.model('RolModel', RolSchema)