
const mongoose = require('mongoose');

const RegistroActividadSchema = new mongoose.Schema({
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
    },
    accion: {
        type: String,
        required: true,
    },
    detalles: {
        type: Map,
        of: String,
    },
    fecha: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('RegistroActividad', RegistroActividadSchema);
