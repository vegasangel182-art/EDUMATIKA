
const mongoose = require('mongoose');

const EstudianteSchema = new mongoose.Schema({
    nombreUsuario: {
        type: String,
        required: true,
        unique: true,
    },
    contrasena: {
        type: String,
        required: true,
    },
    nombres: {
        type: String
    },
    apellidos: {
        type: String
    },
    nombreCompleto: {
        type: String,
        required: true,
    },
    grado: {
        type: String,
        required: true,
    },
    edad: {
        type: Number,
        required: true
    },
    sexo: {
        type: String,
        required: true
    },
    foto: {
        type: String,
        default: 'assets/svg/perfil.svg'
    },
    representante: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
    },
    docente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
    },
});

module.exports = mongoose.model('Estudiante', EstudianteSchema);
