const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DatSchema = new Schema(
    {
        nomArchivo:Schema.Types.String,
        fecha: Schema.Types.String,
        data:[{
            'valor': Schema.Types.String,
            'placa': Schema.Types.String,
            'nombre': Schema.Types.String,
            'fecha_mov': Schema.Types.String,
            'hora_mov': Schema.Types.String,
            'año': Schema.Types.String,
        }]
    },{collection:'dato'}
)

module.exports = mongoose.model('DatoModel', DatSchema)