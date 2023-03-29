const express = require('express')
const router = express.Router()
const LogsModel = require('../Model/LogsModel')
const InstModel = require('../Model/InstModel')
const UsersModel = require('../Model/UsersModel')
//const DatosModel = require('../Model/DatosModel')
const DatoModel = require('../Model/DatoModel')
//const IPublicModel = require('../Model/IPublicModel')
const dotenv = require('dotenv')
dotenv.config({path: './Env/.env'})
const QRCode = require('qrcode')
const pdf = require('html-pdf');
const PublicModel = require('../Model/PublicModel')
var options= {format:'A4'}

router.post('/consulta', async(req,res)=>{
  try {
    const placa= req.body.placa
    const placas= placa.toUpperCase().trim()
    const fecha= new Date()
    const userlog= req.body.userlog
    const año= fecha.getFullYear().toString()


    //consultamos el usuariolog
    const usuario= await UsersModel.find({user: userlog})  

    //Consultamos la institucion del usuariolog
    const institucion= await InstModel.find({_id: usuario[0].inst})

    let array_datos=[]

    await DatoModel.aggregate([
      {
        '$match': {
          'data.año': año, 
          'data.placa': placas
        }
      }, {
        '$unwind': {
          'path': '$data'
        }
      }, {
        '$match': {
          'data.placa': placas
        }
      }, {
        '$project': {
          '_id': 0, 
          'placa': '$data.placa', 
          'valor': {
            '$concat': [
              ' $ ', '$data.valor'
            ]
          }, 
          'fecha': '$data.fecha_mov', 
          'hora': '$data.hora_mov'
        }
      }
    ]).then((result)=>{
      if(result.length >0){
        for(let i=0; i<result.length; i++){
          array_datos.push({
            ...result[i]
          })
        }
      }
    })


    await PublicModel.aggregate([
      {
        '$match': {
          'data.año': año, 
          'data.placa': placas
        }
      }, {
        '$unwind': {
          'path': '$data'
        }
      }, {
        '$match': {
          'data.placa': placas
        }
      }, {
        '$project': {
          '_id': 0, 
          'placa': '$data.placa', 
          'valor': {
            '$concat': [
              ' $ ', '$data.valor'
            ]
          }, 
          'fecha': '$data.fecha_mov', 
          'hora': '$data.hora_mov'
        }
      }
    ]).then((result)=>{
      if(result.length >0){
        for(let i=0; i<result.length; i++){
          array_datos.push({
            ...result[i]
          })
        }
      }
    })

    if(array_datos.length>0){
      await new LogsModel({
        user: userlog,
        action: 'SEARCH',
        date: fecha.toISOString().substring(0,10),
        hour: fecha.toLocaleTimeString(),
        dire: institucion[0].inst,
        razon: 'Se consulto la placa: '+ placas
      }).save()
      res.send({datos: array_datos})
    }else{
      res.send({
        title:'¡Error!',
        icon: 'error',
        text: 'Placa no encontrada'
      }) 
    }

  } catch (error) {
    console.log('Error en DatosController en el metodo post /consulta: '+ error)
  }
})

//Metodo para generar el pdf del certificado
router.post('/pdf', async(req,res)=>{
  try {
    const placas= req.body.placa
    const placa= placas.toUpperCase().trim()
    const array_datos= req.body.datos
    const userlog= req.body.userlog
    const fecha= new Date()

    //consultamos el usuariolog
    const usuario= await UsersModel.find({user: userlog})  

    //Consultamos la institucion del usuariolog
    const institucion= await InstModel.find({_id: usuario[0].inst})


    //Creamos los meses del año
    let Meses=['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviember', 'Diciembre']
            
    //Obtenemos el mes
    let mes= Number(fecha.toISOString().substring(5,7))-1

    //Seteamos la fecha como se mostrara en el html
    let date= 'Santo Domingo, '+ fecha.toISOString().substring(8,10) +' de '+ Meses[mes]+ ' de '+ fecha.getFullYear()

    //Creamos una url para el qr
    const url= process.env.BACKEND+placa

    //Creamos el codigo qr
    const codqr= await QRCode.toDataURL(url)

    await new LogsModel({
      user: userlog,
      action: 'PRINT',
      date: fecha.toISOString().substring(0,10),
      hour: fecha.toLocaleTimeString(),
      dire: institucion[0].inst,
      razon: 'Se mando a imprimir el certificado de la  placa: '+ placa
    }).save()

    //Renderizamos los datos en la plantilla html
    res.render('certificado.ejs',{
      logog: process.env.LOGOGAD,
      logoe: process.env.LOGOEPMT,
      barra: process.env.BARRA,
      firma: process.env.FIRMA,
      fecha: date,
      datos: array_datos,
      qrcod: codqr
    },function (err,html){
      if(err){
        console.log(err)
      }else{
        let namepdf= placa+'-'+fecha.toISOString().substring(0,4)+'.pdf'
        let url= './public/certificados/'+namepdf
        pdf.create(html, options).toFile(url, function(err, resp){
          if(err){
            console.log(err)
          }else{
            res.send(process.env.URLPDF +namepdf)
          }
        })
      }
    })
  } catch (error) {
    console.log('Error en DatosController en el metodo post /pdf: '+ error)
  }
})

//Metodo para consultar el qr del pdf
router.get('/consulta/:placa', async(req,res)=>{
  try {
    const placa = req.params.placa
    const año= new Date().getFullYear().toString()
    let array_datos=[]

    await DatoModel.aggregate([
      {
        '$match': {
          'data.año': año, 
          'data.placa': placa
        }
      }, {
        '$unwind': {
          'path': '$data'
        }
      }, {
        '$match': {
          'data.placa': placa
        }
      }, {
        '$project': {
          '_id': 0, 
          'placa': '$data.placa', 
          'valor': {
            '$concat': [
              ' $ ', '$data.valor'
            ]
          }, 
          'fecha': '$data.fecha_mov', 
          'hora': '$data.hora_mov'
        }
      }
    ]).then((result)=>{
      if(result.length >0){
        for(let i=0; i<result.length; i++){
          array_datos.push({
            ...result[i]
          })
        }
      }
    })

    if(array_datos.length > 0){
      res.send(array_datos)
    }else{
      res.send({placa:'', valor:'', fecha:'', hora:'', mensaje: 'PLACA NO ENCONTRADA'})
    }

  }catch (error) {
    console.log('Error en DatosController en el metodo get /:placa: ' + error)
  }
})

//Consulta para red externa
router.get('/:placa', async(req,res)=>{
  try {
    const placa = req.params.placa
    const placas= placa.toUpperCase().trim()
    const año= new Date().getFullYear().toString()
    let array_datos=[]

    await DatoModel.aggregate([
      {
        '$match': {
          'data.año': año, 
          'data.placa': placas
        }
      }, {
        '$unwind': {
          'path': '$data'
        }
      }, {
        '$match': {
          'data.placa': placas
        }
      }, {
        '$project': {
          '_id': 0, 
          'placa': '$data.placa', 
          'valor': {
            '$concat': [
              ' $ ', '$data.valor'
            ]
          }, 
          'fecha': '$data.fecha_mov', 
          'hora': '$data.hora_mov'
        }
      }
    ]).then((result)=>{
      if(result.length >0){
        for(let i=0; i<result.length; i++){
          array_datos.push({
            ...result[i],
            co_error:0
          })
        }
      }
    })


    await PublicModel.aggregate([
      {
        '$match': {
          'data.año': año, 
          'data.placa': placas
        }
      }, {
        '$unwind': {
          'path': '$data'
        }
      }, {
        '$match': {
          'data.placa': placas
        }
      }, {
        '$project': {
          '_id': 0, 
          'placa': '$data.placa', 
          'valor': {
            '$concat': [
              ' $ ', '$data.valor'
            ]
          }, 
          'fecha': '$data.fecha_mov', 
          'hora': '$data.hora_mov'
        }
      }
    ]).then((result)=>{
      if(result.length >0){
        for(let i=0; i<result.length; i++){
          array_datos.push({
            ...result[i],
            co_error: 0
          })
        }
      }
    })


    if(array_datos.length == 0){
      res.send([{placa:'', valor:'', fecha:'', hora:'', co_error: 1 }])
    }else{
      res.send(array_datos)
    }

    } catch (error) {
        console.log('Error en DatosController en el metodo get /:placa: ' + error)
    }
})

/*router.get('/consulta/consulta/mejorar', async(req,res)=>{
  try {
    let array_final=[]
    let array_final2=[]

    await DatosModel.find().then((result)=>{
      for(let i=0; i<result.length; i++){
        let array_aux=[]
        for(let j=0 ; j<result[i].data.length; j++){
          array_aux.push({
            valor: result[i].data[j].valor,
            placa: result[i].data[j].cod.tercero.toUpperCase().trim(),
            nombre: result[i].data[j].nom.terc.trim(),
            fecha_mov: result[i].data[j].fecha_mov.substring(0,10),
            hora_mov: result[i].data[j].fecha_mov.substring(11,19),
            año: result[i].data[j].fecha_mov.substring(0,4),
          })
        }
        array_final.push({
          nomArchivo: result[i].nomArchivo,
          fecha: result[i].fecha,
          data: array_aux
        })
      }
    })

    await IPublicModel.find().then((result)=>{
      for(let i=0; i<result.length; i++){
        let array_aux=[]
        for(let j=0 ; j<result[i].data.length; j++){
          array_aux.push({
            valor: result[i].data[j].valor,
            placa: result[i].data[j].placa.toUpperCase().trim(),
            institucion: result[i].data[j].institucion.trim(),
            fecha_mov: result[i].data[j].fecha_mov.substring(0,10),
            hora_mov: result[i].data[j].fecha_mov.substring(11,19),
            año: result[i].data[j].fecha_mov.substring(0,4),
          })
        }
        array_final2.push({
          nomArchivo: result[i].nomArchivo,
          fecha: result[i].fecha,
          data: array_aux
        })
      }
    })
    
    for(let i=0; i<array_final.length; i++){
      await new DatoModel(array_final[i]).save()
    }

    for(let i=0; i<array_final2.length; i++){
      await new PublicModel(array_final2[i]).save()
    }

    res.send('terminado')

  } catch (error) {
    console.log('Error en mejorar: '+ error)
  }
})*/


module.exports = router