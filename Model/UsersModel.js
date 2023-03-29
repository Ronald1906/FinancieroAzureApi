const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema(
    {
        user: Schema.Types.String,
        pass: Schema.Types.String,
        rol: Schema.Types.ObjectId,
        inst: Schema.Types.String,
        log: Schema.Types.Number,
        estado: Schema.Types.String,
    },
    {collection:'user'}
)

module.exports = mongoose.model('UserModel', UserSchema)