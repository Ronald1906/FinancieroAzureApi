const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PublicSchema = new Schema(
    {
        nomArchivo:Schema.Types.String,
        fecha: Schema.Types.String,
        data:[
            {
                'valor': Schema.Types.String,
                'placa': Schema.Types.String,
                'institucion': Schema.Types.String,
                'fecha_mov': Schema.Types.String,
                'hora_mov': Schema.Types.String,
                'año': Schema.Types.String,
            }
        ]
    },
    {collection:'publica'}   
)
module.exports = mongoose.model('PublicModel', PublicSchema)