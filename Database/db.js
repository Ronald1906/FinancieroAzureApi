//Importanto modulo de mongo db
const mongoose = require('mongoose')

//Direccion url de la bdd
const url = 'mongodb://databasemongo:42fhaoRPAvUsaOU4nY0UgTngkGwYlVrUVkVXb288Cl2VLnnaYDfq5TfXDZk3bkQ35nKtQ2PK5OFeACDbGdVDKw%3D%3D@databasemongo.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@databasemongo@'

//Conexion a la base de datos
mongoose.connect(url)
const db = mongoose.connection
//Para verificar si existe la conexion a la bdd
db.on('open',()=>{console.log('Conectado a la base de datos')})
db.on('error',()=>{console.log('Error al conectarse a la base de datos')})

module.exports = db