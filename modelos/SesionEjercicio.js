
const mongoose = require('mongoose');

const SesionEjercicioSchema = new mongoose.Schema({
    estudianteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Estudiante',
        required: true
    },
    operacion: {
        type: String,
        enum: ['suma', 'resta', 'multiplicacion'],
        required: true
    },
    nivel: {
        type: Number,
        required: true
    },
    puntuacionFinal: {
        type: Number,
        required: true
    },
    tiempoTotal: {
        type: Number,
        required: true
    },
    ejercicios: [{
        numero1: Number,
        numero2: Number,
        respuestaCorrecta: Number,
        intentos: Number,
        acertado: Boolean
    }],
    observaciones: {
        type: String,
        default: ''
    },
    revisado: {
        type: Boolean,
        default: false
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SesionEjercicio', SesionEjercicioSchema);
