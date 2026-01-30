
const mongoose = require('mongoose');

const ProgresoSchema = new mongoose.Schema({
    estudianteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Estudiante',
        required: true,
    },
    operacion: {
        type: String,
        enum: ['suma', 'resta', 'multiplicacion'],
        required: true,
    },
    nivel: {
        type: Number,
        default: 1,
    },
    puntajeMaximo: {
        type: Number,
        default: 0,
    },
    ejerciciosCompletados: {
        type: Number,
        default: 0,
    },
    ultimaActividad: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Progreso', ProgresoSchema);
