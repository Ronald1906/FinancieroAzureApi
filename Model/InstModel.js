const mongoose = require('mongoose')
const Schema = mongoose.Schema

const InstSchema = new Schema(
    {
        inst: Schema.Types.String,
    },
    {collection:'institucion'}
)

module.exports = mongoose.model('InstModel', InstSchema)