const express = require('express')
const router = express.Router()
const LogsModel = require('../Model/LogsModel')

//Obtemos los logs que se ven en el super administrador
router.get('/', async(req,res)=>{
    try {
        await LogsModel.find().then((result)=>{
            let datos= result.reverse()
            res.send(datos)
        })
        
    } catch (error) {
        console.log('Error en InstController en el metodo get /: '+ error)
    }
})

//Obtenemos los logs que se ven en el usuario administrador de la EPMT
router.get('/loge', async(req,res)=>{
    try {
        //consultamos los Logs
        await LogsModel.find({dire: 'EPMT'}).then((result)=>{
            let datos= result.reverse()
            res.send(datos)
        })

    } catch (error) {
        console.log('Error en LogController en el metodo get /loge: '+ error)
    }
})


//Metodo para limpiar todos los logs
/*router.get('/limpiar', async(req,res)=>{
    try {
        const consulta= await LogsModel.find()
        for(let i=0; i<consulta.length; i++){
            await LogsModel.deleteOne({_id: consulta[i]._id})
        }
        res.send('ok')
    } catch (error) {
        console.log('Error')
    }
})*/

module.exports = router