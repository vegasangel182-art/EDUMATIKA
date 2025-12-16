const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const conectarDB = require('./config/database');
const Usuario = require('./modelos/Usuario');
const bcrypt = require('bcryptjs');

dotenv.config();

const crearAdminInicial = async () => {
    try {
        const adminExistente = await Usuario.findOne({ rol: 'admin' });
        if (!adminExistente) {

            const salt = await bcrypt.genSalt(10);
            const contrasenaHasheada = await bcrypt.hash('admin123', salt);
            const nuevoAdmin = new Usuario({
                nombreUsuario: 'admin',
                contrasena: contrasenaHasheada,
                rol: 'admin',
                nombreCompleto: 'Super Administrador',
                cedula: 'admin-001'
            });
            await nuevoAdmin.save();
            console.log('Usuario admin inicial creado exitosamente (Usuario: admin, Clave: admin123)');

        } else {
            console.log('El usuario admin ya existe.');
        }
    } catch (error) {
        console.error('Error al crear el usuario admin inicial:', error);
    }
};

const iniciarServidor = async () => {
    await conectarDB();
    await crearAdminInicial();

    const app = express();

    app.use(cors());
    app.use(express.json());

    app.use(express.static(path.join(__dirname, '/')));
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // Rutas de la API
    app.use('/api/autenticacion', require('./Rutas/autenticacion'));
    app.use('/api/estudiantes', require('./Rutas/estudiantes'));
    app.use('/api/admin', require('./Rutas/admin'));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {

    });
};

iniciarServidor();
