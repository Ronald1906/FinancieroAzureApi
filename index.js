require('./Database/db')
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')


//Para procesar los datos enviados desde los formularios
app.use(express.json())

//Seteando las cookies
app.use(cookieParser())
app.use(bodyParser.json({limit: "50mb", extended: true}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true}))

app.use(cors({
    origin:['http://localhost:4001'], //Direccion de origen de donde provienen las peticiones
    methods: ['GET','POST'],
    credentials: true
}))


//Seteando las variables de entorno
dotenv.config({path: './Env/.env'})

app.use('/recursos', express.static('public'))
app.use('/recursos', express.static(__dirname+'/public'))

app.set('view engine', 'ejs')

const DatosRouter = require('./Controller/DatosController')
app.use('/consulta',DatosRouter)

const RolRouter = require('./Controller/RolController')
app.use('/rol',RolRouter)

const InstRouter = require('./Controller/InstController')
app.use('/inst',InstRouter)

const UserRouter = require('./Controller/UserController')
app.use('/user',UserRouter)

const LogsRouter = require('./Controller/LogsController')
app.use('/logs',LogsRouter)

//estableciendo el puerto con el que trabajara nodejs
app.listen(3002,()=>{
    console.log('Servidor iniciado en el puerto: 3002')
})
