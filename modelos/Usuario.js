
const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    nombreUsuario: {
        type: String,
        required: true,
        unique: true,
    },
    contrasena: {
        type: String,
        required: true,
    },
    rol: {
        type: String,
        enum: ['docente', 'representante', 'estudiante', 'admin'],
        required: true,
    },
    asignaciones: [{
        grado: { type: String },
        seccion: { type: String },
        _id: false
    }],
    nombreCompleto: {
        type: String,
        required: true,
    },
    cedula: {
        type: String,
        unique: true,
        sparse: true,
    },
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
