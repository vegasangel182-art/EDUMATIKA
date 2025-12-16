const Usuario = require('../modelos/Usuario');
const bcrypt = require('bcryptjs');

exports.crearDocente = async (req, res) => {
    const { nombreUsuario, contrasena, nombreCompleto, asignaciones } = req.body;

    try {
        let usuario = await Usuario.findOne({ nombreUsuario });
        if (usuario) {
            return res.status(400).json({ msg: 'El nombre de usuario ya existe' });
        }

        usuario = new Usuario({
            nombreUsuario,
            contrasena,
            rol: 'docente',
            nombreCompleto,
            asignaciones: asignaciones || []
        });

        const salt = await bcrypt.genSalt(10);
        usuario.contrasena = await bcrypt.hash(contrasena, salt);

        await usuario.save();

        res.json({ msg: 'Docente creado exitosamente', docente: usuario });

    } catch (error) {
        console.error('Error al crear docente:', error.message);
        res.status(500).send('Error del servidor');
    }
};

exports.obtenerDocentes = async (req, res) => {
    try {
        const docentes = await Usuario.find({ rol: 'docente' }).select('-contrasena');
        res.json(docentes);
    } catch (error) {
        console.error('Error al obtener docentes:', error.message);
        res.status(500).send('Error del servidor');
    }
};

exports.actualizarDocente = async (req, res) => {
    const { id } = req.params;
    const { nombreUsuario, nombreCompleto, asignaciones, contrasena } = req.body;

    try {
        let usuario = await Usuario.findById(id);

        if (!usuario) {
            return res.status(404).json({ msg: 'Docente no encontrado' });
        }

        // Que no se repita el nombre del usuario
        if (nombreUsuario !== usuario.nombreUsuario) {
            const existe = await Usuario.findOne({ nombreUsuario });
            if (existe) {
                return res.status(400).json({ msg: 'El nombre de usuario ya está en uso' });
            }
        }

        usuario.nombreUsuario = nombreUsuario;
        usuario.nombreCompleto = nombreCompleto;
        usuario.asignaciones = asignaciones || [];

        // Si envia contraseñz que se actualice
        if (contrasena && contrasena.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            usuario.contrasena = await bcrypt.hash(contrasena, salt);
        }

        await usuario.save();

        res.json({ msg: 'Docente actualizado correctamente', docente: usuario });

    } catch (error) {
        console.error('Error al actualizar docente:', error.message);
        res.status(500).send('Error del servidor');
    }
};
