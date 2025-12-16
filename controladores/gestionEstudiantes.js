const Usuario = require('../modelos/Usuario');
const Estudiante = require('../modelos/Estudiante');
const Progreso = require('../modelos/Progreso');
const SesionEjercicio = require('../modelos/SesionEjercicio');
const bcrypt = require('bcryptjs');
/* ===========================================
    Funcion para formatear cedulas
   ============================================ */
function normalizeCedulaRaw(cedula) {
    if (!cedula) return '';
    return cedula.toString().replace(/\s+/g, '').replace(/-/g, '').toUpperCase();
}

function formatCedula(cedulaRaw) {
    if (!cedulaRaw) return cedulaRaw;
    const raw = normalizeCedulaRaw(cedulaRaw);
    if (/^[VE]/i.test(raw)) {
        return raw.charAt(0).toUpperCase() + '-' + raw.slice(1);
    }
    return raw;
}
/* ===========================================
    Registar Estudiante y Pre-autorizar Representante
   ============================================ */
exports.registrarEstudianteYPreautorizar = async (req, res) => {
    try {
        const { nombres, apellidos, edad, sexo, grado, cedulaRepresentante, nombreRepresentante } = req.body;
        const docenteId = req.usuario.id;
        const cedRaw = cedulaRepresentante || '';
        const variants = [];
        const formatted = formatCedula(cedRaw);
        const normalized = normalizeCedulaRaw(cedRaw);
        if (cedRaw) variants.push(cedRaw);
        if (formatted && !variants.includes(formatted)) variants.push(formatted);
        if (normalized && !variants.includes(normalized)) variants.push(normalized);

        let representante = await Usuario.findOne({ cedula: { $in: variants } });

        if (!representante) {
            const cedToStore = formatted || cedRaw;
            representante = new Usuario({
                nombreUsuario: `PRE_${cedToStore}`,
                contrasena: await bcrypt.hash(cedToStore, 10),
                rol: 'representante',
                nombreCompleto: nombreRepresentante || 'Representante',
                cedula: cedToStore
            });
            await representante.save();
        } else {
            if (nombreRepresentante && (!representante.nombreCompleto || representante.nombreCompleto.startsWith('PRE_') || representante.nombreCompleto !== nombreRepresentante)) {
                representante.nombreCompleto = nombreRepresentante;
                if (!representante.cedula && formatted) representante.cedula = formatted;
                await representante.save();
            }
        }
        const randomSuffix = Math.floor(Math.random() * 1000);
        const usuarioEstudianteNombre = `${nombres.split(' ')[0]}.${apellidos.split(' ')[0]}.${randomSuffix}`.toLowerCase();

        const nuevoUsuarioEstudiante = new Usuario({
            nombreUsuario: usuarioEstudianteNombre,
            contrasena: await bcrypt.hash('estudiante123', 10), // CONTRASEÑA POR DEFECTO
            rol: 'estudiante',
            nombreCompleto: `${nombres} ${apellidos}`,
        });
        await nuevoUsuarioEstudiante.save();
        const nuevoEstudiante = new Estudiante({
            nombreUsuario: usuarioEstudianteNombre,
            contrasena: 'estudiante123',
            nombres: nombres,
            apellidos: apellidos,
            nombreCompleto: `${nombres} ${apellidos}`,
            grado: grado,
            edad: edad,
            sexo: sexo,
            representante: representante._id,
            docente: docenteId
        });

        await nuevoEstudiante.save();

        res.json({
            msg: 'Estudiante registrado y Representante pre-autorizado con éxito',
            datos: {
                estudiante: `${nombres} ${apellidos}`,
                representante: nombreRepresentante,
                estado_representante: 'Pre-autorizado (Debe completar registro)'
            }
        });

    } catch (error) {
        console.error('Error en registrarEstudianteYPreautorizar:', error);
        res.status(500).json({ msg: 'Hubo un error al registrar al estudiante', error: error.message });
    }
};
/* ===========================================
    Obtener lista de estudiantes del docente
   ============================================ */
exports.obtenerEstudiantes = async (req, res) => {
    try {
        const docenteId = req.usuario.id;
        const usuarioRol = req.usuario.rol;

        let query = {};
        if (usuarioRol === 'docente') {
            const docente = await Usuario.findById(docenteId);
            if (docente && docente.asignaciones && docente.asignaciones.length > 0) {
                // Filtrar estudiantes que coincidan con ALGUNA de las asignaciones del docente
                // OJO: Los estudiantes tienen 'grado' y 'seccion' (seccion falta en modelo estudiante? no, la seccion la determina el docente, pero el estudiante deberia tenerla para filtrar)
                // EL MODELO ESTUDIANTE NO TIENE SECCION EXPLICITA EN EL SCHEMA ORIGINAL QUE VI, PERO EL DOCENTE SI.
                // SI EL ESTUDIANTE ESTA ASOCIADO POR ID DE DOCENTE, ENTONCES BASTA CON FILTRAR POR DOCENTE ID?
                // REVISANDO LOGICA ANTERIOR: query = { docente: docenteId };
                // Si el estudiante ya esta linkeado al docente, entonces ya son "sus" estudiantes.
                // LA ASIGNACION DE GRADO/SECCION ES PARA:
                // 1. Mostrarle al docente solo los de sus grados (si tuviera estudiantes de otros, pero aqui linkeamos por ID).
                // 2. RESTRINGIR EL REGISTRO: Cuando el docente crea un estudiante, solo puede ponerle un grado/seccion valido.

                // ENTONCES, para obtenerEstudiantes, SI SOLAMENTE TRAEMOS LOS QUE TIENEN EL ID DEL DOCENTE, ¿ES SUFICIENTE?
                // SI, porque la relacion es Estudiante -> Docente.
                // PERO, si queremos filtrar visualmente, ya lo haremos en el frontend o aqui.
                // DE MOMENTO, MANTENEMOS EL FILTRO POR ID, PERO AÑADIMOS LOGICA DE VALIDADCION EN EL REGISTRO.
                query = { docente: docenteId };
            } else {
                // Si no tiene asignaciones, igual traemos los que tengan su ID (casos legacy o error)
                query = { docente: docenteId };
            }
        }
        // Si es admin, query se queda vacio {} para traer todos

        const estudiantes = await Estudiante.find(query).populate('representante', 'nombreCompleto cedula').populate('docente', 'nombreCompleto asignaciones'); // Poblamos asignaciones para mostrar info si se requiere
        res.json(estudiantes);
    } catch (error) {
        console.error('Error al obtener estudiantes:', error);
        res.status(500).json({ msg: 'Error al obtener estudiantes', error: error.message });
    }
};
exports.actualizarEstudiante = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombres, apellidos, edad, sexo, grado, cedulaRepresentante, nombreRepresentante } = req.body;

        const estudiante = await Estudiante.findById(id);
        if (!estudiante) return res.status(404).json({ msg: 'Estudiante no encontrado' });

        if (nombres !== undefined) estudiante.nombres = nombres;
        if (apellidos !== undefined) estudiante.apellidos = apellidos;
        if (nombres || apellidos) estudiante.nombreCompleto = `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`.trim();
        if (grado !== undefined) estudiante.grado = grado;
        if (edad !== undefined) estudiante.edad = edad;
        if (sexo !== undefined) estudiante.sexo = sexo;
        if (cedulaRepresentante) {
            const cedRaw = cedulaRepresentante || '';
            const variants = [];
            const formatted = formatCedula(cedRaw);
            const normalized = normalizeCedulaRaw(cedRaw);
            if (cedRaw) variants.push(cedRaw);
            if (formatted && !variants.includes(formatted)) variants.push(formatted);
            if (normalized && !variants.includes(normalized)) variants.push(normalized);

            let representante = await Usuario.findOne({ cedula: { $in: variants } });
            if (!representante) {
                const cedToStore = formatted || cedRaw;
                representante = new Usuario({
                    nombreUsuario: `PRE_${cedToStore}`,
                    contrasena: await bcrypt.hash(cedToStore, 10),
                    rol: 'representante',
                    nombreCompleto: nombreRepresentante || 'Representante',
                    cedula: cedToStore
                });
                await representante.save();
            } else {
                if (nombreRepresentante && (!representante.nombreCompleto || representante.nombreCompleto.startsWith('PRE_') || representante.nombreCompleto !== nombreRepresentante)) {
                    representante.nombreCompleto = nombreRepresentante;
                    if (!representante.cedula && formatted) representante.cedula = formatted;
                    await representante.save();
                }
            }
            estudiante.representante = representante._id;
        }

        await estudiante.save();

        const actualizado = await Estudiante.findById(estudiante._id).populate('representante', 'nombreCompleto cedula');
        res.json({ msg: 'Estudiante actualizado', estudiante: actualizado });
    } catch (error) {
        console.error('Error en actualizarEstudiante:', error);
        res.status(500).json({ msg: 'Error al actualizar estudiante', error: error.message });
    }
};

/* ===========================================
    Funciones para representante
   ============================================ */

exports.obtenerMiEstudiante = async (req, res) => {
    try {
        const representanteId = req.usuario.id;
        const estudiante = await Estudiante.findOne({ representante: representanteId });

        if (!estudiante) {
            return res.status(404).json({ msg: 'No se encontró un estudiante asociado a su cuenta.' });
        }

        res.json(estudiante);
    } catch (error) {
        console.error('Error al obtener mi estudiante:', error);
        res.status(500).json({ msg: 'Error del servidor al obtener datos del estudiante' });
    }
};
exports.obtenerEstudiantesPorRepresentante = async (req, res) => {
    try {
        const representanteId = req.usuario.id;
        const estudiantes = await Estudiante.find({ representante: representanteId }).populate('representante', 'nombreCompleto cedula');
        res.json(estudiantes);
    } catch (error) {
        console.error('Error al obtener estudiantes por representante:', error);
        res.status(500).json({ msg: 'Error al obtener estudiantes asociados al representante' });
    }
};

// Subir foto del estudiante
exports.subirFotoEstudiante = async (req, res) => {
    try {
        const representanteId = req.usuario.id;

        if (!req.file) {
            return res.status(400).json({ msg: 'No se subió ninguna imagen.' });
        }
        let estudiante;
        const estudianteId = req.query.id;

        if (estudianteId) {
            estudiante = await Estudiante.findOne({ _id: estudianteId, representante: representanteId });
        } else {
            estudiante = await Estudiante.findOne({ representante: representanteId });
        }

        if (!estudiante) {
            return res.status(404).json({ msg: 'Estudiante no encontrado o no pertenece a este representante.' });
        }
        estudiante.foto = `uploads/${req.file.filename}`;
        await estudiante.save();

        res.json({
            msg: 'Foto actualizada con éxito',
            foto: estudiante.foto
        });

    } catch (error) {
        console.error('Error al subir foto:', error);
        res.status(500).json({ msg: 'Error al subir la imagen' });
    }
};
/* ===========================================
    Gestion de progreso
   ============================================ */
exports.guardarProgreso = async (req, res) => {
    try {
        const { operacion, puntuacion, tiempoTotal, ejercicios } = req.body;
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        const estudiante = await Estudiante.findOne({ nombreUsuario: usuario.nombreUsuario });

        if (!estudiante) {
            return res.status(404).json({ msg: 'Registro de estudiante no encontrado' });
        }

        let progreso = await Progreso.findOne({ estudianteId: estudiante._id, operacion });

        if (!progreso) {
            progreso = new Progreso({
                estudianteId: estudiante._id,
                operacion,
                nivel: 1,
                puntajeMaximo: 0,
                ejerciciosCompletados: 0
            });
        }

        // Actualizar datos
        progreso.ejerciciosCompletados += 5;
        if (puntuacion > progreso.puntajeMaximo) {
            progreso.puntajeMaximo = puntuacion;
        }
        if (puntuacion >= 80 && progreso.nivel < 10) {
            progreso.nivel += 1;
        }
        progreso.ultimaActividad = new Date();

        await progreso.save();
        if (tiempoTotal && ejercicios && ejercicios.length > 0) {
            const sesion = new SesionEjercicio({
                estudianteId: estudiante._id,
                operacion,
                nivel: progreso.nivel,
                puntuacionFinal: puntuacion,
                tiempoTotal,
                ejercicios
            });
            await sesion.save();
        }

        res.json({ msg: 'Progreso guardado', progreso });

    } catch (error) {
        console.error('Error al guardar progreso:', error);
        res.status(500).json({ msg: 'Error al guardar el progreso' });
    }
};
/* ===========================================
   Obtener progreso del estudiante
   ============================================ */

exports.obtenerProgreso = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        const estudiante = await Estudiante.findOne({ nombreUsuario: usuario.nombreUsuario });

        if (!estudiante) {
            return res.status(404).json({ msg: 'Estudiante no encontrado' });
        }

        const progresos = await Progreso.find({ estudianteId: estudiante._id });
        res.json(progresos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener progreso' });
    }
};
exports.obtenerProgresoEstudiante = async (req, res) => {
    try {
        const { id } = req.params;
        const progresos = await Progreso.find({ estudianteId: id });
        res.json(progresos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener progreso del estudiante' });
    }
};

exports.obtenerMisDatos = async (req, res) => {
    try {

        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        const estudiante = await Estudiante.findOne({ nombreUsuario: usuario.nombreUsuario });

        if (!estudiante) {
            return res.status(404).json({ msg: 'Estudiante no encontrado' });
        }

        res.json({
            nombres: estudiante.nombres || null,
            apellidos: estudiante.apellidos || null,
            nombreCompleto: estudiante.nombreCompleto,
            foto: estudiante.foto,
            grado: estudiante.grado
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener datos del estudiante' });
    }
};
exports.actualizarPasswordEstudiante = async (req, res) => {
    try {
        const representanteId = req.usuario.id;
        const { nuevaPassword } = req.body;
        const estudianteIdParam = req.query.estudianteId || req.body.estudianteId;
        if (!nuevaPassword || nuevaPassword.length < 6) {
            return res.status(400).json({ msg: 'La contraseña debe tener al menos 6 caracteres' });
        }
        let estudiante;
        if (estudianteIdParam) {
            estudiante = await Estudiante.findOne({ _id: estudianteIdParam, representante: representanteId });
        } else {
            estudiante = await Estudiante.findOne({ representante: representanteId });
        }
        if (!estudiante) {
            return res.status(404).json({ msg: 'Estudiante no encontrado.' });
        }
        const usuarioEstudiante = await Usuario.findOne({ nombreUsuario: estudiante.nombreUsuario });
        if (!usuarioEstudiante) {
            return res.status(404).json({ msg: 'Usuario del estudiante no encontrado.' });
        }
        usuarioEstudiante.contrasena = await bcrypt.hash(nuevaPassword, 10);
        await usuarioEstudiante.save();
        estudiante.contrasena = nuevaPassword;
        await estudiante.save();

        res.json({
            msg: 'Contraseña actualizada exitosamente',
            success: true
        });

    } catch (error) {
        console.error('Error al actualizar contraseña:', error);
        res.status(500).json({ msg: 'Error al actualizar la contraseña' });
    }
};
exports.obtenerSesionesEstudiante = async (req, res) => {
    try {
        const { id } = req.params;
        const sesiones = await SesionEjercicio.find({ estudianteId: id })
            .sort({ fecha: -1 })
            .limit(20);

        res.json(sesiones);
    } catch (error) {
        console.error('Error al obtener sesiones:', error);
        res.status(500).json({ msg: 'Error al obtener sesiones del estudiante' });
    }
};
exports.actualizarObservacionesSesion = async (req, res) => {
    try {
        const { sesionId } = req.params;
        const { observaciones } = req.body;

        const sesion = await SesionEjercicio.findById(sesionId);

        if (!sesion) {
            return res.status(404).json({ msg: 'Sesión no encontrada' });
        }

        sesion.observaciones = observaciones;
        sesion.revisado = true;
        await sesion.save();

        res.json({ msg: 'Observaciones guardadas exitosamente', sesion });
    } catch (error) {
        console.error('Error al actualizar observaciones:', error);
        res.status(500).json({ msg: 'Error al guardar observaciones' });
    }
};

/* ===========================================
   Obtener observaciones para el representante
   ============================================ */

exports.obtenerObservacionesEstudiante = async (req, res) => {
    try {
        const representanteId = req.usuario.id;
        const estudianteIdParam = req.query.estudianteId;

        if (estudianteIdParam) {
            const sesiones = await SesionEjercicio.find({
                estudianteId: estudianteIdParam,
                revisado: true,
                observaciones: { $ne: '' }
            }).sort({ fecha: -1 }).limit(20);
            return res.json(sesiones);
        }
        const estudiantes = await Estudiante.find({ representante: representanteId }).select('_id');
        if (!estudiantes || estudiantes.length === 0) {
            return res.json([]);
        }

        const ids = estudiantes.map(e => e._id);
        const sesionesConObservaciones = await SesionEjercicio.find({
            estudianteId: { $in: ids },
            revisado: true,
            observaciones: { $ne: '' }
        }).sort({ fecha: -1 }).limit(50);

        res.json(sesionesConObservaciones);
    } catch (error) {
        console.error('Error al obtener observaciones:', error);
        res.status(500).json({ msg: 'Error al obtener observaciones' });
    }
};
