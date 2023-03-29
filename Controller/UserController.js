const express = require('express')
const router = express.Router()
const bcryptjs= require('bcryptjs')
const RolModel = require('../Model/RolModel')
const InstModel = require('../Model/InstModel')
const UsersModel = require('../Model/UsersModel')
const session = require('express-session')
const LogsModel = require('../Model/LogsModel')
const dotenv = require('dotenv')
dotenv.config({path: './Env/.env'})

//Se crea los valores de la sesión 
router.use(session({
    key: process.env.CLVNAME,
    secret: process.env.CLVSECRET,
    resave: false,
    saveUninitialized: false,
    cookie:{
        maxAge:60*60*500
    }
}))


//Metodo para crear usuarios Super Administradores
router.post('/addSA', async(req,res)=>{
    try {
        const user= req.body.user
        const pass= req.body.pass
        const pwd= await bcryptjs.hash(pass, 10)
        const rol= req.body.rol

        //Consultamos el id de la institucion
        const consulta= await InstModel.find({inst: 'GADSTDGO'})

        //Consultamos si el usuario no existe
        const consulta2= await UsersModel.find({user: user})

        //Si no existe se registra
        if(consulta2.length == 0){
            //Se procede con el registro
            await new UsersModel({
                user: user,
                pass: pwd,
                rol: rol,
                estado: 'ACTIVO',
                inst: consulta[0]._id,
                log: 0
            }).save().then(()=>{
                res.send({
                    title: '¡REGISTRO EXITOSO!',
                    icon: 'success',
                    text: 'Usuario registrado correctamente'
                })
            })
        }else{
            //Validamos si el usuario esta activo
            if(consulta2[0].estado == 'ACTIVO'){
                res.send({
                    title: '¡ADVERTENCIA!',
                    icon: 'warning',
                    text: 'El usuario que desea registrar es un usuario ya activo'
                })
            }else{
                res.send({
                    title: '¡ADVERTENCIA!',
                    icon: 'warning',
                    text: 'El usuario que desea registrar es un usuario ya inactivo'
                })
            }
        }

    } catch (error) {
        console.log('Error en UserController en el metodo post /addSA: '+ error)
    }
})

//Metodo para iniciar sesion
router.post('/login', async(req,res)=>{
    try {
        let usuario= req.body.usuario
        let password= req.body.password

        //Consultamos el usuario
        const consulta= await UsersModel.find({user: usuario})

        //Se verifica si no existe en la base de datos
        if(consulta.length == 0){
            res.send({
                title: '¡ERROR!',
                icon: 'error',
                text: 'El usuario que ingreso, se encuentra erroneo'
            })
        }else{
            //Se verifica si esta activado
            if(consulta[0].estado == 'INACTIVO'){
                res.send({
                    title: '¡ADVERTENCIA!',
                    text: 'El usuario que desea ingresar se encuentra inactivo',
                    icon: 'warning'
                })
            }else{
                
                //Comparamos la contraseña ingresada con la de la bdd
                await bcryptjs.compare(password,consulta[0].pass).then((result)=>{
                    //Si coincide el usuario y la contraseña
                    if(consulta[0].user == usuario && result == true){
                        req.session.usuario={
                            user: consulta[0].user,
                            rol: consulta[0].rol,
                            inst: consulta[0].inst,
                            log: consulta[0].log
                        }
                        res.send(req.session.usuario)
                        let fecha= new Date()

                        new LogsModel({
                            user: consulta[0].user,
                            date: fecha.toISOString().substring(0,10),
                            hour: fecha.toLocaleTimeString(),
                            dire: consulta[0].inst,
                            action: 'LOGIN',
                            razon: 'El usuario: '+ consulta[0].user+' ingreso al sistema'
                        }).save()

                    }else{
                        res.send({
                            title: '¡ERROR!',
                            icon: 'warning',
                            text: 'Usuario y/o contraseña erroneos'
                        })
                    }
                })
            }
        }

    } catch (error) {
        console.log('Error en UserController en el metodo post /login: '+ error)
    }
})

//Se obtiene los datos de la sesion
router.get('/login', async(req,res)=>{
    if(req.session.usuario){
        res.send({
            loggedIn: true,
            user: req.session.usuario
        })
    }else{
        res.send({
            loggedIn: false
        })
    }
})

//Se realiza el cierre de la session
router.get('/logout',async (req,res)=>{
    try {
        let fecha= new Date()

        new LogsModel({
            user: req.session.usuario.user,
            date: fecha.toISOString().substring(0,10),
            hour: fecha.toLocaleTimeString(),
            dire: req.session.usuario.inst,
            action: 'LOGOUT',
            razon: 'El usuario: '+ req.session.usuario.user+' cerro la sesión'
        }).save()

        req.session.destroy(()=>{
            res.send({
                loggedIn: false,
            })
        })
        
    } catch (error) {
        console.log('Error: '+ error)
    }
})

//Metodo para hacer el cambio de contraseña
router.post('/changepass', async(req,res)=>{
    try {
        const pass= req.body.pass
        const pwd= await bcryptjs.hash(pass,10)
        const user= req.body.user

        //Consultamos el usuario
        const consulta= await UsersModel.find({user: user})
        
        //Consultamos la institucion
        const consulta2= await InstModel.find({_id: consulta[0].inst})

        //Verificamos que la contraseña no sea la misma que ya se encuentra
        await bcryptjs.compare(pass,consulta[0].pass).then((result)=>{
            //Si la contraseña no es igual a la antigua, se procede con el cambio
            if(result == false){
                UsersModel.updateOne({user: user},{$set:{pass: pwd, log:1}}).then((result)=>{
                    if(result.matchedCount == 1){
                        let fecha= new Date()
                        new LogsModel({
                            user: user,
                            date: fecha.toISOString().substring(0,10),
                            hour: fecha.toLocaleTimeString(),
                            action: 'UPDATE',
                            dire: consulta2[0].inst,
                            razon: 'El usuario actualizo por primera vez su contraseña'
                        }).save()
                        res.send({modify: true})
                    }
                })
            }else{
                res.send({
                    title: '¡ADVERTENCIA!',
                    icon: 'warning',
                    text: 'La contraseña no puede ser igual a la actual',
                    modify: false
                })
            }
        })

    } catch (error) {
        console.log('Error en UserController en el metodo post /changepass: '+ error)
    }
})

//Metodo para hacer el cambio de contraseña por parte del administrador
router.post('/changepassword', async(req,res)=>{
    try {
        const pass= req.body.pass
        const pwd= await bcryptjs.hash(pass,10)
        const id= req.body.user
        const userlog= req.body.userlog

        //consultamos el usuariolog
        const con= await UsersModel.find({user: userlog})

        //Consultamos la institucion del usuariolog
        const con2= await InstModel.find({_id: con[0].inst})

        //Consultamos el usuario
        const consulta= await UsersModel.find({_id: id})
        const usuario_consul= consulta[0].user

        //Verificamos que la contraseña no sea la misma que ya se encuentra
        await bcryptjs.compare(pass,consulta[0].pass).then((result)=>{
            //Si la contraseña no es igual a la antigua, se procede con el cambio
            if(result == false){
                UsersModel.updateOne({_id: id},{$set:{pass: pwd}}).then((result)=>{
                    if(result.matchedCount == 1){
                        let fecha= new Date()
                        new LogsModel({
                            user: userlog,
                            date: fecha.toISOString().substring(0,10),
                            hour: fecha.toLocaleTimeString(),
                            dire: con2[0].inst,
                            action: 'UPDATE',
                            razon: 'El usuario actualizo la contraseña del usuario: '+ usuario_consul
                        }).save()
                        res.send({modify: true})
                    }
                })
            }else{
                res.send({
                    title: '¡ADVERTENCIA!',
                    icon: 'warning',
                    text: 'La contraseña no puede ser igual a la actual',
                    modify: false
                })
            }
        })

        

    } catch (error) {
        console.log('Error en UserController en el metodo post /changepass: '+ error)
    }
})

//Metodo para mostrar todos los usuarios excepto el usuario super admin
router.get('/userSadm', async(req,res)=>{
    try {
        //Consultamos los usuarios
        const consulta= await UsersModel.find()
        
        //Creamos un array para mostrar los usuarios
        let array=[]

        //Recorremos los datos
        for(let i=0; i<consulta.length; i++){
            //Consultamos el rol
            const consul1= await RolModel.find({_id: consulta[i].rol})
            
            //Consultamos la institucion
            const consul2 = await InstModel.find({_id: consulta[i].inst})

            let objeto={
                id: consulta[i]._id,
                user: consulta[i].user,
                rol: consul1[0].rol,
                inst: consul2[0].inst,
                estado: consulta[i].estado
            }
            array.push(objeto)
        }

        //Eliminamos al usuario Super administrador

        let filtro= array.filter(el=>el.rol != 'SAdm')

        res.send(filtro)

    } catch (error) {
        console.log('Error en UserController en el metodo get /userSadm: '+ error)
    }
})

//Metodo para agregar usuarios 
router.post('/agregar', async(req,res)=>{
    try {
        const user = req.body.user
        const pass = req.body.pass
        const pwd= await bcryptjs.hash(pass, 10)
        const rol= req.body.rol
        const inst = req.body.inst
        const userlog= req.body.userlog

        //consultamos el usuariolog
        const con= await UsersModel.find({user: userlog})

        //Consultamos la institucion del usuariolog
        const con2= await InstModel.find({_id: con[0].inst})

        //consultamos el usuario
        const consulta= await UsersModel.find({user: user})

        if(consulta.length == 0){
            await new UsersModel({
                user: user,
                pass: pwd,
                rol: rol,
                inst: inst,
                estado: 'ACTIVO',
                log:0,
            }).save().then(()=>{
                let fecha= new Date()

                new LogsModel({
                    user: userlog,
                    date: fecha.toISOString().substring(0,10),
                    hour: fecha.toLocaleTimeString(),
                    dire: con2[0].inst,
                    action: 'INSERT',
                    razon: 'Registro del usuario: '+ user
                    
                }).save()
                res.send({
                    title: '¡USUARIO REGISTRADO!',
                    icon: 'success', 
                    text: 'Usuario registrado correctamente'
                })
            })
        }else{
            res.send({
                title: '¡ERROR!',
                icon: 'error',
                text: 'El usuario ya se encuentra registrado'
            })
        }

    } catch (error) {
        console.log('Error en UserController en el metodo post /agregar : '+ error)
    }
})

//Metodo para editar el estado de los usuarios
router.post('/editEst', async(req,res)=>{
    try {
        const id= req.body.id
        const estado= req.body.estado
        const userlog= req.body.userlog

        //consultamos el usuariolog
        const con= await UsersModel.find({user: userlog})

        //Consultamos la institucion del usuariolog
        const con2= await InstModel.find({_id: con[0].inst})


        //Consultamos el usuario
        const consulta= await UsersModel.find({_id: id})
        let usuario= consulta[0].user

        //Verificamos que el estado no sea igual al que ya tiene
        if(consulta[0].estado == estado){
            res.send({
                title: '¡ERROR!',
                icon: 'error',
                text: 'El usuario ya se encuentra en el estado seleccionado'
            })
        }else{
            let est_anterior = consulta[0].estado
            await UsersModel.updateOne({_id: id},{$set:{estado: estado}}).then((result)=>{
                if(result.matchedCount == 1){
                    const fecha= new Date()
                    new LogsModel({
                        action: 'UPDATE',
                        date: fecha.toISOString().substring(0,10),
                        hour: fecha.toLocaleTimeString(),
                        dire: con2[0].inst,
                        user: userlog,
                        razon: 'Se modifico al usuario: '+ usuario +' del estado '+ est_anterior+ ' al estado '+ estado
                    }).save()
                    res.send({
                        title: '¡Estado Modificado!',
                        icon: 'success',
                        text: 'Modifico el usuario al estado '+ estado
                    })
                }
            })
        }

    } catch (error) {
        console.log('Error en UserController en el metodo post /editEst: '+ error)
    }
})

//Metodo para eliminar un usuario
router.post('/deleteUser', async(req,res)=>{
    try {
        const id= req.body.id
        const userlog= req.body.userlog

        //consultamos el usuariolog
        const con= await UsersModel.find({user: userlog})
        

        //Consultamos la institucion del usuariolog
        const con2= await InstModel.find({_id: con[0].inst})

        //Consultamos el usuario
        const consulta= await UsersModel.find({_id: id})

        await UsersModel.deleteOne({'_id': id}).then((result)=>{
            if(result.deletedCount == 1){
                let fecha= new Date()
                new LogsModel({
                    user: userlog,
                    date: fecha.toISOString().substring(0,10),
                    hour: fecha.toLocaleTimeString(),
                    dire: con2[0].inst,
                    action: 'DELETE',
                    razon: 'Elimino al usuario '+consulta[0].user
                }).save()
                res.send({
                    title: '¡Usuario Eliminado Correctamente!',
                    icon: 'success',
                    text: 'El usuario '+ consulta[0].user + ' ha sido eliminado correctamnte'
                })
            }
        })

    } catch (error) {
        console.log('Erroe en UserController en el metodo post /deleteUser: '+ error)
    }
})

//Metodo para mostrar todos los usuarios de consulta de la epmt
router.get('/userepmt', async(req,res)=>{
    try {
        //Consultamos los usuarios
        const consulta= await UsersModel.find()
        
        //Creamos un array para mostrar los usuarios
        let array=[]

        //Recorremos los datos
        for(let i=0; i<consulta.length; i++){
            //Consultamos el rol
            const consul1= await RolModel.find({_id: consulta[i].rol})
            
            //Consultamos la institucion
            const consul2 = await InstModel.find({_id: consulta[i].inst})

            let objeto={
                id: consulta[i]._id,
                user: consulta[i].user,
                rol: consul1[0].rol,
                inst: consul2[0].inst,
                estado: consulta[i].estado
            }
            array.push(objeto)
        }

        //Eliminamos al usuario Super administrador

        let filtro= array.filter(el=>el.inst == 'EPMT' && el.rol == 'Consulta')

        res.send(filtro)
    } catch (error) {
        console.log('Error en UsuarioController en el metodo get /userepmt: '+ error)
    }
})

//Metodo para agregar los usuarios de consulta de la epmt
router.post('/addconsul', async(req,res)=>{
    try {
        const user= req.body.user
        const pass= req.body.pass
        const pwd= await bcryptjs.hash(pass, 10)
        const userlog= req.body.userlog

        //consultamos el usuariolog
        const con= await UsersModel.find({user: userlog})

        //Consultamos la institucion del usuariolog
        const con2= await InstModel.find({_id: con[0].inst})

        //Consultamos si ya no existe este usuario
        const consulta= await UsersModel.find({user: user})

        //Consultamoe el rol de consulta
        const consulta2= await RolModel.find({rol: 'Consulta'})

        //Consultamos la institucion del ETPM
        const consulta3= await InstModel.find({inst: 'EPMT'})

        //Si el resultado es 0, se procede a registrar
        if(consulta.length == 0){
            await new UsersModel({
                user: user,
                pass: pwd,
                rol: consulta2[0]._id,
                inst: consulta3[0]._id,
                estado: 'ACTIVO',
                log:0,
            }).save().then(()=>{
                let fecha= new Date()

                new LogsModel({
                    user: userlog,
                    date: fecha.toISOString().substring(0,10),
                    hour: fecha.toLocaleTimeString(),
                    dire: con2[0].inst,
                    action: 'INSERT',
                    razon: 'Registro del usuario: '+ user
                    
                }).save()
                res.send({
                    title: '¡USUARIO REGISTRADO!',
                    icon: 'success', 
                    text: 'Usuario registrado correctamente'
                })
            })

            //En caso de que el resultado no sea 0
        }else{
            res.send({
                title: '¡ERROR!',
                icon: 'error',
                text: 'El usuario ya se encuentra registrado'
            })
        }

    } catch (error) {
        console.log('Error en UserController en el metodo post /addconsul: '+error )
    }
})


module.exports = router