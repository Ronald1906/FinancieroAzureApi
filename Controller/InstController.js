const express = require('express')
const router = express.Router()
const InstModel = require('../Model/InstModel')

router.get('/', async(req,res)=>{
    try {
        const consulta= await InstModel.find()
        res.send(consulta.sort())
    } catch (error) {
        console.log('Error en InstController en el metodo get /: '+ error)
    }
})

module.exports = router