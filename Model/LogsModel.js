const mongoose = require('mongoose')
const Schema = mongoose.Schema

const LogsSchema = new Schema(
    {
        user: Schema.Types.String,
        date: Schema.Types.String,
        hour: Schema.Types.String,
        action: Schema.Types.String,
        razon: Schema.Types.String,
        dire: Schema.Types.String
    },
    {collection:'logs'}
)

module.exports = mongoose.model('LogsModel', LogsSchema)