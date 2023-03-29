const express = require('express')
const router = express.Router()
const RolModel = require('../Model/RolModel')

router.get('/sadministrador', async(req,res)=>{
    try {
        //Consultamos los roles
        const consulta= await RolModel.find()

        //Excluimos al super admin
        const filtrado= consulta.filter(el=>el.rol != 'SAdm' && el.rol != 'Administrador GAD')

        res.send(filtrado.sort())

    } catch (error) {
        console.log('Error en RolController en el metodo get /administrador: '+ error)
    }
})

router.get('/super', async(req,res)=>{
    try {
        //Consultamos los roles
        const consulta= await RolModel.find()

        res.send(consulta)

    } catch (error) {
        console.log('Error en RolController en el metodo get /administrador: '+ error)
    }
})


module.exports = router