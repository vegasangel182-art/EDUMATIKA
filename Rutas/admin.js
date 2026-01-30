const express = require('express');
const router = express.Router();
const adminController = require('../controladores/admin');
const jwt = require('jsonwebtoken');

// Validar token y rol de admin
const validarAdmin = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No hay token, permiso no válido' });
    try {
        const cifrado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = cifrado.usuario;
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({ msg: 'Acceso denegado: Se requieren permisos de administrador' });
        }
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token no válido' });
    }
};

router.post('/crear-docente', validarAdmin, adminController.crearDocente);
router.get('/docentes', validarAdmin, adminController.obtenerDocentes);
router.put('/docente/:id', validarAdmin, adminController.actualizarDocente);

module.exports = router;
