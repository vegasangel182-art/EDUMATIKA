const express = require('express');
const router = express.Router();
const autenticacionController = require('../controladores/autenticacion');

router.post('/registrar', autenticacionController.registrar);
router.post('/registrar-representante', autenticacionController.completarRegistroRepresentante);
router.post('/iniciar-sesion', autenticacionController.iniciarSesion);

const jwt = require('jsonwebtoken');
const validarToken = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No hay token, permiso no válido' });
    try {
        const cifrado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = cifrado.usuario;
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token no válido' });
    }
};
router.get('/perfil', validarToken, autenticacionController.obtenerPerfil);

module.exports = router;
