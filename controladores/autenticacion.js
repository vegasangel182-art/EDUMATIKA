const Usuario = require('../modelos/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/* ===========================================
    Completar registro Representante
   ============================================ */
exports.completarRegistroRepresentante = async (req, res) => {
    const { nombreUsuario, contrasena, nombreCompleto, cedula } = req.body;

    try {
        // Primero se busca si el representante esta pre-autorizado
        let usuario = await Usuario.findOne({ cedula: cedula });

        if (!usuario) {
            // Si la cedula no esta en la base de datos, es que ningun docente lo ha pre-autorizado
            return res.status(403).json({ msg: 'Su cédula no está pre-autorizada. Contacte al docente para que registre a su representado primero.' });
        }

        // Luego se verifica si ya completo el registro antes
        if (!usuario.nombreUsuario.startsWith('PRE_')) {
            return res.status(400).json({ msg: 'Esta cédula ya se encuentra registrada en el sistema. Intente iniciar sesión.' });
        }

        // Se actualizan los datos para cambiar de pre-registro a registro 
        const salt = await bcrypt.genSalt(10);
        usuario.contrasena = await bcrypt.hash(contrasena, salt);
        usuario.nombreUsuario = nombreUsuario;
        if (nombreCompleto) {
            usuario.nombreCompleto = nombreCompleto;
        }

        await usuario.save();

        // 4. Al final se loguea automaticamente y Retorna con el Token
        const payload = { usuario: { id: usuario.id, rol: usuario.rol } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token, usuario: { rol: usuario.rol, nombre: usuario.nombreCompleto } });
        });

    } catch (error) {
        console.error('Error en completarRegistroRepresentante:', error.message);
        res.status(500).send('Error del servidor');
    }
};
/* ===========================================
    Registrar un nuevo usuario
   ============================================ */
exports.registrar = async (req, res) => {
    const { nombreUsuario, contrasena, rol, nombreCompleto, cedula } = req.body;
    try {
        let usuario = await Usuario.findOne({ nombreUsuario });
        if (usuario) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }
        usuario = new Usuario({ nombreUsuario, contrasena, rol, nombreCompleto, cedula });
        const salt = await bcrypt.genSalt(10);
        usuario.contrasena = await bcrypt.hash(contrasena, salt);
        await usuario.save();

        const payload = { usuario: { id: usuario.id, rol: usuario.rol } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (error) {
        console.error('Error en registro:', error.message);
        res.status(500).send('Error del servidor');
    }
};
/* ===========================================
    Iniciar sesion de usuario
   ============================================ */
exports.iniciarSesion = async (req, res) => {
    const { nombreUsuario, contrasena, rol } = req.body;

    if (!nombreUsuario || !contrasena || !rol) {
        return res.status(400).json({ msg: 'Por favor ingrese todos los campos (Usuario, Contraseña y Rol)' });
    }

    try {
        let usuario = await Usuario.findOne({ nombreUsuario });
        if (!usuario) {
            return res.status(400).json({ msg: 'El usuario no se encuentra registrado en el sistema' });
        }
        const esCorrecta = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!esCorrecta) {
            return res.status(400).json({ msg: 'La contraseña ingresada es incorrecta' });
        }
        if (usuario.rol !== rol) {
            return res.status(403).json({
                msg: `Error de Permisos: Este usuario no tiene el rol de "${rol}". Verifique su selección en el menú principal.`
            });
        }

        //  Generar Token y Respuesta Exitosa
        const payload = {
            usuario: {
                id: usuario.id,
                rol: usuario.rol
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    usuario: {
                        rol: usuario.rol,
                        nombre: usuario.nombreCompleto,
                        id: usuario.id,
                        asignaciones: usuario.asignaciones || []
                    }
                });
            }
        );

    } catch (error) {
        console.error('Error en iniciarSesion:', error.message);
        res.status(500).json({ msg: 'Error interno del servidor. Intente más tarde.' });
    }
};
/* ===========================================
    Obtener perfil de usuario
   ============================================ */
exports.obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select('-contrasena');
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        res.json({
            id: usuario._id,
            rol: usuario.rol,
            nombreUsuario: usuario.nombreUsuario,
            nombreCompleto: usuario.nombreCompleto
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error del servidor');
    }
};
