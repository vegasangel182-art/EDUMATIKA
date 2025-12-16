const express = require('express');
const router = express.Router();
const gestionEstudiantes = require('../controladores/gestionEstudiantes');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Nombre unico se genera fecha + extension
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const validarToken = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No hay token, permiso no válido' });

    try {
        const jwt = require('jsonwebtoken');
        const cifrado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = cifrado.usuario;
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token no válido' });
    }
};

// --- RUTAS DOCENTE ---
router.post('/registrar', validarToken, gestionEstudiantes.registrarEstudianteYPreautorizar);
router.put('/:id', validarToken, gestionEstudiantes.actualizarEstudiante);
router.get('/', validarToken, gestionEstudiantes.obtenerEstudiantes);
router.get('/por-representante', validarToken, gestionEstudiantes.obtenerEstudiantesPorRepresentante);

// --- RUTAS REPRESENTANTE ---
router.get('/mi-estudiante', validarToken, gestionEstudiantes.obtenerMiEstudiante);
router.post('/mi-estudiante/foto', validarToken, upload.single('foto'), gestionEstudiantes.subirFotoEstudiante);
router.put('/mi-estudiante/password', validarToken, gestionEstudiantes.actualizarPasswordEstudiante);

// --- RUTAS PROGRESO ---
router.post('/progreso', validarToken, gestionEstudiantes.guardarProgreso);
router.get('/progreso', validarToken, gestionEstudiantes.obtenerProgreso);
router.get('/mis-datos', validarToken, gestionEstudiantes.obtenerMisDatos);
router.get('/progreso/:id', validarToken, gestionEstudiantes.obtenerProgresoEstudiante);

// --- RUTAS SESIONES ---
router.get('/sesiones/:id', validarToken, gestionEstudiantes.obtenerSesionesEstudiante);
router.put('/sesiones/:sesionId/observaciones', validarToken, gestionEstudiantes.actualizarObservacionesSesion);
router.get('/observaciones', validarToken, gestionEstudiantes.obtenerObservacionesEstudiante);

module.exports = router;
