/* ===========================================
   Estado global
   ============================================ */
const estadoApp = {
    pantallaActual: "pantalla-bienvenida",
    rolUsuario: null,
    nombreUsuario: null,
    actividadActual: null,
    puntuacion: 0,
    ejercicios: [],
    indiceEjercicioActual: 0,
    totalEjercicios: 5,
    respuestasCorrectas: 0,
    tiempoInicio: null,
    nivelEstudiante: {
        suma: 1,
        resta: 1,
        multiplicacion: 1,
    },
};

let idEstudianteEditando = null;

let idEstudianteSeleccionadoRep = null;

/* ===========================================
   Sonidos
   ============================================ */
const sonidoClic = new Audio("assets/sonidos/clic.mp3");
const sonidoSuma = new Audio("assets/sonidos/suma.mp3");
const sonidoResta = new Audio("assets/sonidos/explosion.mp3");
const sonidoCorrecto = new Audio("assets/sonidos/correcto.mp3");
const sonidoIncorrecto = new Audio("assets/sonidos/incorrecto.mp3");
const sonidoMultiplicacion = new Audio("assets/sonidos/multiplicacion.mp3");
const sonidoSeleccionar = new Audio("assets/sonidos/seleccionar.mp3");
const sonidoAtras = new Audio("assets/sonidos/atras.mp3");
const sonidoIngresar = new Audio("assets/sonidos/ingresar.mp3");
const sonidoGanar = new Audio("assets/sonidos/ganar.mp3");
const sonidoDespegue = new Audio("assets/sonidos/despegue.mp3");

// Funcion para tener la URL de la foto del estudiante
function obtenerUrlFoto(fotoPath) {
    const defecto = 'assets/svg/perfil.svg';
    if (!fotoPath) return defecto;

    if (/^https?:\/\//i.test(fotoPath)) return fotoPath;

    if (fotoPath.startsWith('//')) return window.location.protocol + fotoPath;

    if (fotoPath.startsWith('/')) return window.location.origin + fotoPath;

    return window.location.origin + '/' + fotoPath;
}

function obtenerNombreEstudiante(est) {
    if (!est) return '';
    if (est.nombres || est.apellidos) {
        const n = (est.nombres || '').trim();
        const a = (est.apellidos || '').trim();
        if (n && a) return `${n} ${a}`;
        return n || a || (est.nombreCompleto || '');
    }
    return est.nombreCompleto || '';
}

/* ===========================================
   Funciones de manejo del nivel del estudiante
   ============================================ */
function actualizarNivelEstudiante(tipoActividad, precision) {
    const nivelActual = estadoApp.nivelEstudiante[tipoActividad];
    if (precision >= 80 && nivelActual < 10) {
        estadoApp.nivelEstudiante[tipoActividad]++;
    } else if (precision < 50 && nivelActual > 1) {
        estadoApp.nivelEstudiante[tipoActividad]--;
    }
}

/* ===========================================
   Logica del Sistema de estrellas y cometas de fondo
   ============================================ */
const cometa1 = document.getElementById("comet1");
const cometa2 = document.getElementById("comet2");

function crearEstrella() {
    const estrella = document.createElement("div");
    estrella.classList.add("fondo-espacial__estrella");
    estrella.style.left = Math.floor(Math.random() * 100) + "vw";
    estrella.style.top = Math.floor(Math.random() * 100) + "vh";
    const tamano = Math.random() * 3 + 1;
    estrella.style.width = tamano + "px";
    estrella.style.height = tamano + "px";
    estrella.style.animation = `parpadeo ${Math.random() * 2 + 3}s infinite`;
    return estrella;
}

function generarEstrellas() {
    const numeroEstrellas = 200;
    const contenedorEstrellas = document.getElementById("stars");
    if (contenedorEstrellas) {
        for (let i = 0; i < numeroEstrellas; i++) {
            contenedorEstrellas.appendChild(crearEstrella());
        }
    }
}
generarEstrellas();

function animarCometa(cometa) {
    if (!cometa) return;
    const inicioX = Math.random() * 100 + "vw";
    const inicioY = Math.random() * 100 + "vh";
    const finX = Math.random() * 100 + "vw";
    const finY = Math.random() * 100 + "vh";
    cometa.style.setProperty("--startX", inicioX);
    cometa.style.setProperty("--startY", inicioY);
    cometa.style.setProperty("--endX", finX);
    cometa.style.setProperty("--endY", finY);
    cometa.style.animation = `mover-cometa ${Math.random() * 2 + 1.5}s linear`;
    setTimeout(() => {
        cometa.style.animation = "";
        setTimeout(() => animarCometa(cometa), Math.random() * 10000 + 5000);
    }, 2000);
}

if (cometa1 && cometa2) {
    setTimeout(() => animarCometa(cometa1), Math.random() * 5000);
    setTimeout(() => animarCometa(cometa2), Math.random() * 5000 + 3000);
}

/* ===========================================
   Manejo de Pantallas
   ============================================ */
function mostrarPantalla(idPantalla) {
    //Ocultar todas las pantallas
    document.querySelectorAll(".pantalla").forEach((p) => {
        p.classList.remove("pantalla--activa");
        p.style.display = "none";
    });

    //Mostrar la pantalla seleccionada
    const pantalla = document.getElementById(idPantalla);
    if (pantalla) {
        pantalla.style.display = "block";
        setTimeout(() => {
            pantalla.classList.add("pantalla--activa");
        }, 10);
        estadoApp.pantallaActual = idPantalla;
    }

    if (idPantalla === "pantalla-bienvenida") {
        document.getElementById("form-login-docente").reset();
        document.getElementById("form-login-representante").reset();
        document.getElementById("form-login-estudiante").reset();
        if (document.getElementById("form-login-admin")) document.getElementById("form-login-admin").reset();
    } else if (idPantalla === 'pantalla-ver-estudiantes') {
        cargarEstudiantes();
    } else if (idPantalla === 'progress-screen') {
        cargarProgresoEstudiante();
    } else if (idPantalla === 'pantalla-misiones') {
        cargarProgresoEstudiante();
    } else if (idPantalla === 'pantalla-registrar-estudiante') {
        if (estadoApp.rolUsuario !== 'docente') {
            mostrarNotificacion('Acceso Denegado', 'Solo los docentes pueden registrar estudiantes.');
            mostrarPantalla('pantalla-bienvenida');
            return;
        }
        cargarOpcionesAsignacionDocente();
    }
}

async function cargarProgresoEstudiante() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Obtener datos del estudiante, solo el nombre y foto
        const respuestaEstudiante = await fetch('/api/estudiantes/mis-datos', {
            headers: { 'x-auth-token': token }
        });

        if (respuestaEstudiante.ok) {
            const estudiante = await respuestaEstudiante.json();

            const nombreProgresoEl = document.getElementById('progreso-nombre-estudiante');
            if (nombreProgresoEl) nombreProgresoEl.textContent = obtenerNombreEstudiante(estudiante);

            const fotoProgresoEl = document.getElementById('progreso-foto-estudiante');
            if (fotoProgresoEl) {
                try {
                    fotoProgresoEl.src = obtenerUrlFoto(estudiante.foto);
                    fotoProgresoEl.alt = obtenerNombreEstudiante(estudiante) || 'Foto estudiante';
                    fotoProgresoEl.onerror = () => { fotoProgresoEl.src = 'assets/svg/perfil.svg'; };
                } catch (err) {
                    fotoProgresoEl.src = 'assets/svg/perfil.svg';
                }
            }
        }

        // Obtener progreso del estudiante
        const respuesta = await fetch('/api/estudiantes/progreso', {
            headers: { 'x-auth-token': token }
        });

        if (!respuesta.ok) return;

        const progresos = await respuesta.json();
        const totalEjerciciosSpan = document.querySelector('.progreso-general__texto');
        let totalEjerciciosGlobal = 0;

        // Resetear visualmente
        ['suma', 'resta', 'multiplicacion'].forEach(op => {
            const ejEl = document.getElementById(`progreso-${op}-ejercicios`);
            const ptEl = document.getElementById(`progreso-${op}-puntaje`);
            if (ejEl) ejEl.textContent = 0;
            if (ptEl) ptEl.textContent = 0;
            actualizarEstrellasUI(op, 0);
            const nivelCardEl = document.getElementById(`nivel-${op}`);
            if (nivelCardEl) nivelCardEl.textContent = 'Nivel 1';
        });

        // El progreso
        progresos.forEach(p => {
            const op = p.operacion;
            const ejerciciosEl = document.getElementById(`progreso-${op}-ejercicios`);
            const puntajeEl = document.getElementById(`progreso-${op}-puntaje`);

            if (ejerciciosEl) ejerciciosEl.textContent = p.ejerciciosCompletados;
            if (puntajeEl) puntajeEl.textContent = p.puntajeMaximo;

            const nivelCardEl = document.getElementById(`nivel-${op}`);
            if (nivelCardEl) nivelCardEl.textContent = `Nivel ${p.nivel}`;

            const estrellas = Math.min(5, p.nivel);

            actualizarEstrellasUI(op, estrellas);

            totalEjerciciosGlobal += p.ejerciciosCompletados;
        });

        if (totalEjerciciosSpan) {
            totalEjerciciosSpan.textContent = `Has completado ${totalEjerciciosGlobal} ejercicios en total`;
        }

    } catch (e) { console.error(e); }
}

function actualizarEstrellasUI(operacion, cantidadEstrellas) {
    const contenedor = document.getElementById(`progreso-${operacion}-estrellas`);
    if (!contenedor) return;

    // Poner las estrellas
    let html = '';
    for (let i = 0; i < cantidadEstrellas; i++) {
        html += `<span class="estrellas__estrella estrellas__estrella--llena"><img src="assets/svg/estrella.svg" alt="Estrella"></span>`;
    }
    contenedor.innerHTML = html;
}

/* ===========================================
   Gestion de Sesion 
   ============================================ */
function manejarLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    if (typeof idEstudianteSeleccionadoRep !== 'undefined') idEstudianteSeleccionadoRep = null;
    if (typeof idEstudianteEditando !== 'undefined') idEstudianteEditando = null;

    if (typeof deseleccionarEstudianteRep === 'function') {
        deseleccionarEstudianteRep();
    }


    const listaEstudiantes = document.getElementById('rep-students-list');
    if (listaEstudiantes) listaEstudiantes.innerHTML = '';


    document.getElementById('form-login-representante').reset();
    document.getElementById('form-login-docente').reset();
    document.getElementById('form-login-estudiante').reset();
    if (document.getElementById('form-login-admin')) document.getElementById('form-login-admin').reset();

    mostrarPantalla('pantalla-bienvenida');
}

/* ===========================================
   Formateo de tiempo 
   ============================================ */
function formatearTiempoRelativo(fecha) {
    if (!fecha) return 'Sin actividad registrada';

    const ahora = new Date();
    const fechaActividad = new Date(fecha);
    const diferenciaMs = ahora - fechaActividad;
    const diferenciaMinutos = Math.floor(diferenciaMs / (1000 * 60));
    const diferenciaHoras = Math.floor(diferenciaMs / (1000 * 60 * 60));
    const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

    function formatearHora(fecha) {
        let horas = fecha.getHours();
        const minutos = fecha.getMinutes().toString().padStart(2, '0');
        const ampm = horas >= 12 ? 'PM' : 'AM';
        horas = horas % 12 || 12;
        return `${horas}:${minutos} ${ampm}`;
    }

    // Menos de 1 hora 
    if (diferenciaMinutos < 60) {
        if (diferenciaMinutos < 1) return 'Hace un momento';
        if (diferenciaMinutos === 1) return 'Hace 1 minuto';
        return `Hace ${diferenciaMinutos} minutos`;
    }

    // Menos de 24 horas pero el mismo día
    if (diferenciaDias === 0) {
        return `Hoy, ${formatearHora(fechaActividad)}`;
    }

    // Ayer
    if (diferenciaDias === 1) {
        return `Ayer, ${formatearHora(fechaActividad)}`;
    }

    // Menos de 7 días
    if (diferenciaDias < 7) {
        return `Hace ${diferenciaDias} días`;
    }

    // Más de 7 días
    const dia = fechaActividad.getDate();
    const mes = fechaActividad.toLocaleDateString('es-ES', { month: 'short' });
    return `${dia} ${mes}, ${formatearHora(fechaActividad)}`;
}

/* ===========================================
   Formateo de duracion
   ============================================ */
function formatearDuracion(segundos) {
    if (!segundos || segundos < 0) return '0s';

    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;

    let resultado = '';
    if (horas > 0) resultado += `${horas}h `;
    if (minutos > 0) resultado += `${minutos}m `;
    if (segs > 0 || resultado === '') resultado += `${segs}s`;

    return resultado.trim();
}


/* ===========================================
   Modal de Notificaciones
   ============================================ */
function mostrarNotificacion(titulo, mensaje) {
    document.getElementById('notificacion-titulo').textContent = titulo;
    document.getElementById('notificacion-mensaje').textContent = mensaje;
    const overlay = document.getElementById('notificacion-overlay');
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function ocultarNotificacion() {
    const overlay = document.getElementById('notificacion-overlay');
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function configurarModalNotificacion() {
    const overlay = document.getElementById('notificacion-overlay');
    if (overlay) {
        overlay.addEventListener('click', e => e.target === overlay && ocultarNotificacion());
        document.getElementById('btn-cerrar-notificacion').addEventListener('click', ocultarNotificacion);
    }
}


/* ===========================================
   Logica de Autenticacion
   ============================================ */
async function procesarLogin(nombreUsuario, contrasena, rol) {
    sonidoIngresar.play();

    const btnSubmit = document.querySelector(`#form-login-${rol} button[type="submit"]`);
    if (btnSubmit) btnSubmit.disabled = true;

    try {
        console.log(`Intentando login para: ${nombreUsuario} con rol: ${rol}`);

        const respuesta = await fetch('/api/autenticacion/iniciar-sesion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombreUsuario, contrasena, rol }),
        });

        let datos;
        const contentType = respuesta.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            datos = await respuesta.json();
        } else {
            const textoError = await respuesta.text();
            throw new Error(textoError || `Error desconocido del servidor (${respuesta.status})`);
        }

        // Verificar si la respuesta fue exitosa
        if (!respuesta.ok) {
            throw new Error(datos.msg || 'Ocurrió un error al procesar la solicitud');
        }

        // --- LOGIN EXITOSO :) ---
        console.log('Login exitoso:', datos);
        localStorage.setItem('token', datos.token);
        estadoApp.rolUsuario = datos.usuario.rol;
        estadoApp.nombreUsuario = datos.usuario.nombre;
        estadoApp.idUsuario = datos.usuario.id;
        estadoApp.asignaciones = datos.usuario.asignaciones || []; // Guardar asignaciones

        // Redireccion segun sea el rol
        switch (datos.usuario.rol) {
            case 'docente':
                mostrarPantalla('pantalla-docente');
                cargarEstudiantesDashboard();
                break;
            case 'admin':
                mostrarPantalla('pantalla-admin');
                cargarDocentes();
                break;
            case 'representante':
                mostrarPantalla('pantalla-representante');
                if (typeof deseleccionarEstudianteRep === 'function') {
                    deseleccionarEstudianteRep();
                }
                cargarProgresoRepresentante();
                break;
            case 'estudiante':
                const nombreElem = document.getElementById('nombre-estudiante-misiones');
                if (nombreElem) nombreElem.textContent = estadoApp.nombreUsuario;
                mostrarPantalla('pantalla-misiones');
                break;
            default:
                mostrarNotificacion('Error', 'Rol de usuario desconocido');
        }

    } catch (error) {
        console.error('Error capturado en login:', error);

        let mensajeUsuario = error.message;
        let tituloAlerta = 'Aviso del Sistema';

        // Clasificacion y manejo de errores para intentar dar un mensaje de error mas preciso
        if (mensajeUsuario.includes('contraseña')) {
            tituloAlerta = 'Datos Incorrectos';
        } else if (mensajeUsuario.includes('usuario')) {
            tituloAlerta = 'Usuario No Encontrado';
        } else if (mensajeUsuario.includes('rol') || mensajeUsuario.includes('permiso')) {
            tituloAlerta = 'Acceso Denegado';
        }

        // Si es error de conexion
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            tituloAlerta = 'Error de Conexión';
            mensajeUsuario = "No se pudo conectar con el servidor. Verifique que el sistema esté encendido (Base de Datos).";
        }

        // Si es un error HTML
        if (mensajeUsuario.trim().startsWith('<')) {
            tituloAlerta = 'Error del Servidor';
            mensajeUsuario = "Error interno del servidor. Contacte al soporte.";
        }

        mostrarNotificacion(tituloAlerta, mensajeUsuario);

    } finally {
        // Rehabilitar botón
        if (btnSubmit) btnSubmit.disabled = false;
    }
}




/* ===========================================
   Funciones de manejo de roles y navegacion
   ============================================ */
function seleccionarRol(rol) {
    sonidoSeleccionar.play();
    estadoApp.rolUsuario = rol;
    mostrarPantalla(`pantalla-login-${rol}`);
}

function manejarLoginDocente(evento) {
    evento.preventDefault();
    const nombreUsuario = document.getElementById('usuario-docente').value;
    const contrasena = document.getElementById('contrasena-docente').value;
    procesarLogin(nombreUsuario, contrasena, 'docente');
}

function manejarLoginAdmin(evento) {
    evento.preventDefault();
    const nombreUsuario = document.getElementById('usuario-admin').value;
    const contrasena = document.getElementById('contrasena-admin').value;
    procesarLogin(nombreUsuario, contrasena, 'admin');
}

/* ===========================================
   Gestion de Admin
   ============================================ */
let idDocenteEditando = null;

// Agregar fila de asignacion
function agregarFilaAsignacion(gradoVal = '', seccionVal = '') {
    const contenedor = document.getElementById('contenedor-asignaciones');
    const template = document.getElementById('template-fila-asignacion');
    if (!contenedor || !template) return;

    if (contenedor.children.length === 0) {
        const clone = template.content.cloneNode(true);
        const fila = clone.querySelector('.asignacion-row');

        const btnEliminar = clone.querySelector('.boton-eliminar-fila');
        if (btnEliminar) btnEliminar.remove();

        if (gradoVal) clone.querySelector('.selector-grado').value = gradoVal;
        if (seccionVal) clone.querySelector('.selector-seccion').value = seccionVal;

        contenedor.appendChild(clone);
        return;
    }

    // Agregar nueva fila con el boton de eliminar
    const clone = template.content.cloneNode(true);

    if (gradoVal) clone.querySelector('.selector-grado').value = gradoVal;
    if (seccionVal) clone.querySelector('.selector-seccion').value = seccionVal;

    const btnEliminar = clone.querySelector('.boton-eliminar-fila');
    if (btnEliminar) {
        btnEliminar.onclick = function (e) {
            const fila = e.target.closest('.asignacion-row');
            if (fila) fila.remove();
        };
    }

    contenedor.appendChild(clone);
}

function cargarDatosDocente(doc) {
    idDocenteEditando = doc._id;
    document.querySelector('.tarjeta-formulario__titulo').textContent = 'Editar Docente';
    document.querySelector('#form-registro-docente button[type="submit"] p').textContent = 'Guardar Cambios';

    document.getElementById('reg-doc-nombre').value = doc.nombreCompleto;
    document.getElementById('reg-doc-usuario').value = doc.nombreUsuario;
    document.getElementById('reg-doc-contrasena').value = "";
    document.getElementById('reg-doc-contrasena').required = false;

    // Cargar asignaciones
    const contenedor = document.getElementById('contenedor-asignaciones');
    contenedor.innerHTML = '';

    if (doc.asignaciones && doc.asignaciones.length > 0) {
        doc.asignaciones.forEach((asig, index) => {
            agregarFilaAsignacion(asig.grado, asig.seccion);
        });
    } else if (doc.grado) {
        agregarFilaAsignacion(doc.grado, doc.seccion);
    } else {
        agregarFilaAsignacion();
    }

    // Scroll arriba cuando ya hay una lista larga de docentes
    document.querySelector('.columna-formulario').scrollIntoView({ behavior: 'smooth' });
}

async function cargarDocentes() {
    try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch('/api/admin/docentes', {
            headers: { 'x-auth-token': token }
        });
        const docentes = await respuesta.json();

        const contenedor = document.getElementById('lista-docentes');
        const template = document.getElementById('template-tarjeta-docente');

        if (!contenedor || !template) return;
        contenedor.innerHTML = '';

        if (docentes.length === 0) {
            contenedor.innerHTML = '<p class="mensaje-vacio">No hay docentes registrados</p>';
            return;
        }

        docentes.forEach(doc => {
            const clone = template.content.cloneNode(true);

            const nombreEl = clone.querySelector('.lista-estudiantes__nombre');
            if (nombreEl) nombreEl.textContent = doc.nombreCompleto;

            const gradoEl = clone.querySelector('.lista-estudiantes__grado');
            let textoAsignaciones = "Sin asignaciones";
            if (doc.asignaciones && doc.asignaciones.length > 0) {
                textoAsignaciones = doc.asignaciones.map(a => `${a.grado} "${a.seccion}"`).join(', ');
            } else if (doc.grado) {
                textoAsignaciones = `${doc.grado} "${doc.seccion}"`;
            }

            if (gradoEl) gradoEl.textContent = `Usuario: ${doc.nombreUsuario} | Cursos: ${textoAsignaciones}`;

            // Boton Editar
            const btnEditar = clone.querySelector('.boton-editar-docente');
            if (btnEditar) {
                btnEditar.onclick = () => cargarDatosDocente(doc);
            }

            contenedor.appendChild(clone);
        });

    } catch (error) {
        console.error('Error al cargar docentes:', error);
        mostrarNotificacion('Error', 'No se pudieron cargar los docentes');
    }
}

async function manejarRegistroDocente(evento) {
    evento.preventDefault();

    const contenedor = document.getElementById('contenedor-asignaciones');
    const filas = contenedor.querySelectorAll('.asignacion-row');
    const asignaciones = [];

    filas.forEach(fila => {
        const grado = fila.querySelector('.selector-grado').value;
        const seccion = fila.querySelector('.selector-seccion').value;
        if (grado && seccion) {
            asignaciones.push({ grado, seccion });
        }
    });

    if (asignaciones.length === 0) {
        mostrarNotificacion('Error', 'Debe asignar al menos un grado y sección');
        return;
    }

    const datos = {
        nombreCompleto: document.getElementById('reg-doc-nombre').value,
        nombreUsuario: document.getElementById('reg-doc-usuario').value,
        contrasena: document.getElementById('reg-doc-contrasena').value,
        asignaciones: asignaciones
    };

    try {
        const token = localStorage.getItem('token');
        let url = '/api/admin/crear-docente';
        let method = 'POST';

        if (idDocenteEditando) {
            url = `/api/admin/docente/${idDocenteEditando}`;
            method = 'PUT';
            if (!datos.contrasena) delete datos.contrasena;
        }

        const respuesta = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(datos)
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.msg || 'Error al guardar docente');
        }

        mostrarNotificacion('Éxito', idDocenteEditando ? 'Docente actualizado correctamente' : 'Docente creado correctamente');

        document.getElementById('form-registro-docente').reset();
        document.getElementById('reg-doc-contrasena').required = true;
        document.querySelector('.tarjeta-formulario__titulo').textContent = 'Registrar Nuevo Docente';
        document.querySelector('#form-registro-docente button[type="submit"] p').textContent = 'Registrar Docente';
        idDocenteEditando = null;

        contenedor.innerHTML = '';
        agregarFilaAsignacion();

        cargarDocentes();

    } catch (error) {
        mostrarNotificacion('Error', error.message);
    }
}

/* ===========================================
   Gestion de Docente
   ============================================ */

async function manejarRegistroEstudiante(evento) {
    evento.preventDefault();

    const selectorGradoSeccion = document.getElementById('reg-est-grado-seccion');
    const valorSeleccionado = selectorGradoSeccion.value;

    if (!valorSeleccionado) {
        mostrarNotificacion('Error', 'Debe seleccionar un grado y sección válido');
        return;
    }

    const [grado, seccion] = valorSeleccionado.split('|');

    const datos = {
        nombres: document.getElementById('reg-est-nombres').value,
        apellidos: document.getElementById('reg-est-apellidos').value,
        edad: document.getElementById('reg-est-edad').value,
        sexo: document.getElementById('reg-est-sexo').value,
        grado: `${grado} Grado / Sección ${seccion}`,
        cedulaRepresentante: `${document.getElementById('reg-est-cedula-nacionalidad').value}-${document.getElementById('reg-est-cedula-numero').value}`,
        nombreRepresentante: document.getElementById('reg-est-nombre-rep').value
    };
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay sesión activa de docente.');
        let respuesta, data;

        if (idEstudianteEditando) {
            respuesta = await fetch(`/api/estudiantes/${idEstudianteEditando}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(datos)
            });
            data = await respuesta.json();
            if (!respuesta.ok) {
                const errorMsg = data.error ? `${data.msg}: ${data.error}` : (data.msg || 'Error al actualizar estudiante');
                throw new Error(errorMsg);
            }

            mostrarNotificacion('Actualización Exitosa', 'Los datos del estudiante se han actualizado.');
            idEstudianteEditando = null;
        } else {
            respuesta = await fetch('/api/estudiantes/registrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(datos)
            });
            data = await respuesta.json();
            if (!respuesta.ok) {
                const errorMsg = data.error ? `${data.msg}: ${data.error}` : (data.msg || 'Error al registrar estudiante');
                throw new Error(errorMsg);
            }

            mostrarNotificacion('Registro Exitoso', `El estudiante ha sido registrado. El representante ha sido PRE-AUTORIZADO.`);
        }

        document.getElementById('form-registro-estudiante').reset();
        const titulo = document.querySelector('#pantalla-registrar-estudiante .formulario-login__titulo');
        if (titulo) titulo.textContent = 'Registrar Nuevo Estudiante';
        mostrarPantalla('pantalla-docente');
        cargarEstudiantesDashboard();

    } catch (error) {
        console.error(error);
        mostrarNotificacion('Error de Registro', error.message);
    }
}

function cargarOpcionesAsignacionDocente() {
    const selector = document.getElementById('reg-est-grado-seccion');
    if (!selector) return;

    selector.innerHTML = '<option value="" disabled selected>Seleccione...</option>';

    const asignaciones = estadoApp.asignaciones || [];

    if (asignaciones.length === 0) {
        selector.innerHTML += '<option value="" disabled>No hay asignaciones</option>';
        return;
    }

    asignaciones.forEach(asig => {
        const option = document.createElement('option');
        option.value = `${asig.grado}|${asig.seccion}`;
        option.textContent = `${asig.grado} Grado - Sección "${asig.seccion}"`;
        selector.appendChild(option);
    });

    if (asignaciones.length === 1) {
        selector.value = `${asignaciones[0].grado}|${asignaciones[0].seccion}`;
    }
}
function manejarLoginRepresentante(evento) {
    evento.preventDefault();
    const nombreUsuario = document.getElementById('usuario-representante').value;
    const contrasena = document.getElementById('contrasena-representante').value;
    procesarLogin(nombreUsuario, contrasena, 'representante');
}

function manejarLoginEstudiante(evento) {
    evento.preventDefault();
    const nombreUsuario = document.getElementById('usuario-estudiante').value;
    const contrasena = document.getElementById('contrasena-estudiante').value;
    procesarLogin(nombreUsuario, contrasena, 'estudiante');
}

/* ===========================================
   Completar Registro de parte del representante
   ============================================ */
async function manejarRegistroRepresentante(evento) {
    evento.preventDefault();
    const datos = {
        cedula: `${document.getElementById('reg-cedula-nacionalidad').value}-${document.getElementById('reg-cedula-numero').value}`,
        nombreUsuario: document.getElementById('reg-usuario').value,
        contrasena: document.getElementById('reg-contrasena').value
    };

    try {
        const respuesta = await fetch('/api/autenticacion/registrar-representante', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.msg || 'Error al completar registro');
        }

        // Todo bien en el registro y login del Reprensentante
        mostrarNotificacion('Registro Completado', 'Su cuenta ha sido activada exitosamente. Bienvenido/a.');

        // Guardar sesion
        localStorage.setItem('token', data.token);
        estadoApp.rolUsuario = data.usuario.rol;
        estadoApp.nombreUsuario = data.usuario.nombre;
        document.getElementById('form-registro-representante').reset();
        mostrarPantalla('pantalla-representante');
        cargarProgresoRepresentante();

    } catch (error) {
        console.error('Error registro rep:', error);
        mostrarNotificacion('Error de Registro', error.message);
    }
}

/* ===========================================
    Funciones de paneles Representante y Docente
    ============================================ */

function mostrarSeccionDocente(seccion, botonActivo) {
    document.getElementById('seccion-por-revisar').style.display = 'none';
    document.getElementById('seccion-revisados').style.display = 'none';
    document.getElementById(`seccion-${seccion}`).style.display = 'block';
    document.getElementById('btn-por-revisar').setAttribute('aria-pressed', 'false');
    document.getElementById('btn-revisados').setAttribute('aria-pressed', 'false');
    botonActivo.setAttribute('aria-pressed', 'true');
    sonidoClic.play();
}


/* ===========================================
   Logica de los ejercicios
   ============================================ */
function actualizarInsigniasNivel() {
    document.getElementById("nivel-suma").textContent = `Nivel ${estadoApp.nivelEstudiante.suma}`;
    document.getElementById("nivel-resta").textContent = `Nivel ${estadoApp.nivelEstudiante.resta}`;
    document.getElementById("nivel-multiplicacion").textContent = `Nivel ${estadoApp.nivelEstudiante.multiplicacion}`;
}

function iniciarActividad(tipo) {
    estadoApp.actividadActual = tipo;
    estadoApp.puntuacion = 0;
    estadoApp.indiceEjercicioActual = 0;
    estadoApp.respuestasCorrectas = 0;
    estadoApp.tiempoInicio = Date.now();

    const elementoTipoActividad = document.getElementById("tipo-actividad");
    const elementoOperador = document.getElementById("operador");

    switch (tipo) {
        case "suma":
            elementoTipoActividad.textContent = "Suma";
            elementoOperador.textContent = "+";
            sonidoSuma.play();
            break;
        case "resta":
            elementoTipoActividad.textContent = "Resta";
            elementoOperador.textContent = "-";
            sonidoResta.play();
            break;
        case "multiplicacion":
            elementoTipoActividad.textContent = "Multiplicación";
            elementoOperador.textContent = "x";
            sonidoMultiplicacion.play();
            break;
    }

    generarEjercicios(tipo);
    mostrarEjercicio(0);
    mostrarPantalla("pantalla-actividad");
}

function generarEjercicios(tipo) {
    estadoApp.ejercicios = [];
    const nivelActual = estadoApp.nivelEstudiante[tipo];
    for (let i = 0; i < estadoApp.totalEjercicios; i++) {
        const ejercicio = generarEjercicioAdaptativo(tipo, nivelActual);
        ejercicio.intentos = 0;
        ejercicio.acertado = false;
        estadoApp.ejercicios.push(ejercicio);
    }
}

function generarEjercicioAdaptativo(tipo, nivel) {
    let numero1, numero2, respuesta;
    const rangos = {
        suma: [
            { minimo: 1, maximo: 5 }, { minimo: 1, maximo: 10 }, { minimo: 5, maximo: 15 },
            { minimo: 10, maximo: 20 }, { minimo: 10, maximo: 30 }, { minimo: 20, maximo: 40 },
            { minimo: 20, maximo: 50 }, { minimo: 30, maximo: 60 }, { minimo: 40, maximo: 80 },
            { minimo: 50, maximo: 100 },
        ],
        resta: [
            { minimo: 1, maximo: 5 }, { minimo: 1, maximo: 10 }, { minimo: 5, maximo: 15 },
            { minimo: 10, maximo: 20 }, { minimo: 10, maximo: 30 }, { minimo: 20, maximo: 40 },
            { minimo: 20, maximo: 50 }, { minimo: 30, maximo: 60 }, { minimo: 40, maximo: 80 },
            { minimo: 50, maximo: 100 },
        ],
        multiplicacion: [
            { minimo: 1, maximo: 2 }, { minimo: 1, maximo: 3 }, { minimo: 1, maximo: 4 },
            { minimo: 1, maximo: 5 }, { minimo: 2, maximo: 6 }, { minimo: 2, maximo: 7 },
            { minimo: 2, maximo: 8 }, { minimo: 2, maximo: 9 }, { minimo: 2, maximo: 10 },
        ],
    };

    const rango = rangos[tipo][nivel - 1] || rangos[tipo][0];

    switch (tipo) {
        case "suma":
            numero1 = Math.floor(Math.random() * (rango.maximo - rango.minimo + 1)) + rango.minimo;
            numero2 = Math.floor(Math.random() * (rango.maximo - rango.minimo + 1)) + rango.minimo;
            respuesta = numero1 + numero2;
            break;
        case "resta":
            numero1 = Math.floor(Math.random() * (rango.maximo - rango.minimo + 1)) + rango.minimo;
            numero2 = Math.floor(Math.random() * (rango.maximo - rango.minimo + 1)) + rango.minimo;
            if (numero1 < numero2) {
                [numero1, numero2] = [numero2, numero1];
            }
            respuesta = numero1 - numero2;
            break;
        case "multiplicacion":
            numero1 = Math.floor(Math.random() * (rango.maximo - rango.minimo + 1)) + rango.minimo;
            numero2 = Math.floor(Math.random() * (rango.maximo - rango.minimo + 1)) + rango.minimo;
            respuesta = numero1 * numero2;
            break;
    }
    return { numero1, numero2, respuesta };
}

function mostrarEjercicio(indice) {
    const ejercicio = estadoApp.ejercicios[indice];
    document.getElementById("num1").textContent = ejercicio.numero1;
    document.getElementById("num2").textContent = ejercicio.numero2;
    document.getElementById("entrada-respuesta").value = "";
    document.getElementById("entrada-respuesta").focus();
    document.getElementById("puntuacion-actual").textContent = estadoApp.puntuacion;
    const porcentajeProgreso = (indice / estadoApp.totalEjercicios) * 100;
    document.getElementById("progreso-ejercicio").style.width = porcentajeProgreso + "%";
    document.getElementById("numero-ejercicio").textContent = indice + 1;
    document.getElementById("feedback").textContent = "";
    document.getElementById("feedback").className = "feedback";
    generarElementosVisuales(ejercicio.numero1, ejercicio.numero2);
}

function generarElementosVisuales(numero1, numero2) {
    const contenedor = document.getElementById("visual-elements");
    contenedor.innerHTML = "";
    const rutasImagenes = [
        "assets/svg/satelite.svg", "assets/svg/asteroide.svg", "assets/svg/tierra.svg",
        "assets/svg/naveVerde.svg", "assets/svg/saturno.svg", "assets/svg/marte.svg",
    ];
    const rutaImagen = rutasImagenes[Math.floor(Math.random() * rutasImagenes.length)];

    if (estadoApp.actividadActual === "suma") {
        for (let i = 0; i < numero1; i++) {
            const imagen = document.createElement("img");
            imagen.className = "contenedor-ejercicio__item-visual";
            imagen.src = rutaImagen;
            imagen.alt = "Elemento visual";
            imagen.style.animationDelay = i * 0.1 + "s";
            contenedor.appendChild(imagen);
        }
        const mas = document.createElement("span");
        mas.className = "contenedor-ejercicio__item-visual contenedor-ejercicio__operador";
        mas.textContent = "+";
        contenedor.appendChild(mas);
        for (let i = 0; i < numero2; i++) {
            const imagen = document.createElement("img");
            imagen.className = "contenedor-ejercicio__item-visual";
            imagen.src = rutaImagen;
            imagen.alt = "Elemento visual";
            imagen.style.animationDelay = (numero1 + i + 1) * 0.1 + "s";
            contenedor.appendChild(imagen);
        }
    } else if (estadoApp.actividadActual === "resta") {
        for (let i = 0; i < numero1; i++) {
            const envoltorio = document.createElement("div");
            envoltorio.className = "contenedor-ejercicio__item-wrapper";
            envoltorio.style.animationDelay = i * 0.1 + "s";
            const imagen = document.createElement("img");
            imagen.className = "contenedor-ejercicio__item-visual";
            imagen.src = rutaImagen;
            imagen.alt = "Elemento visual";
            if (i >= numero1 - numero2) {
                envoltorio.classList.add("contenedor-ejercicio__item-wrapper--eliminado");
            }
            envoltorio.appendChild(imagen);
            contenedor.appendChild(envoltorio);
        }
    } else if (estadoApp.actividadActual === "multiplicacion") {
        const cuadricula = document.createElement("div");
        cuadricula.className = "contenedor-ejercicio__grid-multiplicacion";
        cuadricula.style.gridTemplateColumns = `repeat(${numero2}, 1fr)`;
        const totalElementos = numero1 * numero2;
        for (let i = 0; i < totalElementos; i++) {
            const imagen = document.createElement("img");
            imagen.className = "contenedor-ejercicio__item-visual contenedor-ejercicio__item-visual--grid";
            imagen.src = rutaImagen;
            imagen.alt = "Elemento visual";
            imagen.style.animationDelay = i * 0.05 + "s";
            cuadricula.appendChild(imagen);
        }
        const etiqueta = document.createElement("div");
        etiqueta.className = "contenedor-ejercicio__grid-label";
        etiqueta.innerHTML = `<span>${numero1} filas</span> × <span>${numero2} columnas</span>`
        contenedor.appendChild(etiqueta);
        contenedor.appendChild(cuadricula);
    }
}


function verificarRespuesta() {
    const respuestaUsuario = Number.parseInt(document.getElementById("entrada-respuesta").value, 10);
    const ejercicioActual = estadoApp.ejercicios[estadoApp.indiceEjercicioActual];
    const elementoRetroalimentacion = document.getElementById("feedback");

    if (isNaN(respuestaUsuario)) {
        elementoRetroalimentacion.textContent = "¡Ingresa un número!";
        elementoRetroalimentacion.className = "retroalimentacion retroalimentacion--incorrecta";
        sonidoIncorrecto.play();
        return;
    }

    // Incrementar intentos
    ejercicioActual.intentos++;

    if (respuestaUsuario === ejercicioActual.respuesta) {
        estadoApp.puntuacion += 20;
        estadoApp.respuestasCorrectas++;
        ejercicioActual.acertado = true;
        elementoRetroalimentacion.textContent = "¡Muy bien!";
        elementoRetroalimentacion.className = "retroalimentacion retroalimentacion--correcta";
        sonidoCorrecto.play();
        document.getElementById("puntuacion-actual").textContent = estadoApp.puntuacion;

        setTimeout(() => {
            estadoApp.indiceEjercicioActual++;
            if (estadoApp.indiceEjercicioActual < estadoApp.totalEjercicios) {
                mostrarEjercicio(estadoApp.indiceEjercicioActual);
            } else {
                mostrarResultados();
            }
        }, 1000);
    } else {
        estadoApp.puntuacion = Math.max(0, estadoApp.puntuacion - 5);
        document.getElementById("puntuacion-actual").textContent = estadoApp.puntuacion;
        elementoRetroalimentacion.textContent = "¡Intenta de nuevo!";
        elementoRetroalimentacion.className = "retroalimentacion retroalimentacion--incorrecta";
        sonidoIncorrecto.play();
        const answerInput = document.getElementById("entrada-respuesta");
        if (answerInput) answerInput.value = "";
    }
}

function mostrarResultados() {
    const tiempoTranscurrido = Math.floor((Date.now() - estadoApp.tiempoInicio) / 1000);
    const precision = (estadoApp.respuestasCorrectas / estadoApp.totalEjercicios) * 100;
    actualizarNivelEstudiante(estadoApp.actividadActual, precision);
    estadoApp.puntuacion = Math.max(0, estadoApp.puntuacion);

    document.getElementById("puntos-finales").textContent = estadoApp.puntuacion;
    document.getElementById("respuestas-correctas").textContent = `${estadoApp.respuestasCorrectas}/${estadoApp.totalEjercicios}`;
    document.getElementById("tiempo-ejercicio").textContent = tiempoTranscurrido;

    const elementoMensaje = document.getElementById("mensaje-resultados");
    const puntuacionFinal = estadoApp.puntuacion;
    const nivelActual = estadoApp.nivelEstudiante[estadoApp.actividadActual];
    sonidoGanar.play();
    sonidoDespegue.play();

    if (puntuacionFinal === 100) {
        elementoMensaje.textContent = `¡Perfecto! ¡Eres un genio de las matemáticas! Nivel ${nivelActual}`;
    } else if (puntuacionFinal >= 80) {
        elementoMensaje.textContent = `¡Excelente trabajo! ¡Sigue así! Nivel ${nivelActual}`;
    } else if (puntuacionFinal >= 60) {
        elementoMensaje.textContent = `¡Buen trabajo! ¡Puedes mejorar aún más! Nivel ${nivelActual}`;
    } else {
        elementoMensaje.textContent = `¡Sigue practicando! ¡Tú puedes! Nivel ${nivelActual}`;
    }

    mostrarPantalla("pantalla-resultados");

    // Guardar progreso
    guardarProgresoBackend(estadoApp.actividadActual, estadoApp.puntuacion);
}

async function guardarProgresoBackend(operacion, puntuacion) {
    try {
        const token = localStorage.getItem('token');
        if (!token || estadoApp.rolUsuario !== 'estudiante') return;

        const tiempoTotal = Math.floor((Date.now() - estadoApp.tiempoInicio) / 1000);

        const ejerciciosDetalle = estadoApp.ejercicios.map(ej => ({
            numero1: ej.numero1,
            numero2: ej.numero2,
            respuestaCorrecta: ej.respuesta,
            intentos: ej.intentos,
            acertado: ej.acertado
        }));

        const respuesta = await fetch('/api/estudiantes/progreso', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({
                operacion,
                puntuacion,
                tiempoTotal,
                ejercicios: ejerciciosDetalle
            })
        });

        if (respuesta.ok) {
            console.log("Progreso guardado en la nube");
        }

    } catch (error) {
        console.error('Error guardando progreso', error);
    }
}

function siguienteActividad() {
    if (estadoApp.actividadActual) {
        iniciarActividad(estadoApp.actividadActual);
    }
}

/* ===========================================
   Funciones para el modal de terminos y condiciones
   ============================================ */
function mostrarTerminos(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const overlay = document.getElementById('terminos-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function ocultarTerminos() {
    const overlay = document.getElementById('terminos-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function configurarModalTerminos() {
    const overlay = document.getElementById('terminos-overlay');
    if (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                ocultarTerminos();
            }
        });
    }
}


/* ===========================================
   Inicializacion
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('form-login-estudiante').addEventListener('submit', manejarLoginEstudiante);
    document.getElementById('form-login-representante').addEventListener('submit', manejarLoginRepresentante);
    document.getElementById('form-login-docente').addEventListener('submit', manejarLoginDocente);

    document.getElementById('form-registro-representante').addEventListener('submit', manejarRegistroRepresentante);
    document.getElementById('form-registro-estudiante').addEventListener('submit', manejarRegistroEstudiante);

    document.getElementById('answer-form').addEventListener('submit', (e) => {
        e.preventDefault();
        verificarRespuesta();
    });

    const formEditarPassword = document.getElementById('form-editar-password');
    if (formEditarPassword) {
        formEditarPassword.addEventListener('submit', editarPasswordEstudiante);
    }

    document.querySelectorAll('.btn-logout').forEach(btn => btn.addEventListener('click', manejarLogout));

    configurarModalTerminos();
    configurarModalNotificacion();

    mostrarPantalla(estadoApp.pantallaActual);

    // Restaurar sesion en caso de que exista un token
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/api/autenticacion/perfil', {
            headers: { 'x-auth-token': token }
        })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Sesión inválida');
            })
            .then(usuario => {
                estadoApp.rolUsuario = usuario.rol;
                estadoApp.nombreUsuario = usuario.nombreUsuario;
                console.log('Sesión restaurada:', usuario.rol);
                switch (usuario.rol) {
                    case 'estudiante': mostrarPantalla('pantalla-misiones'); break;
                    case 'docente':
                        mostrarPantalla('pantalla-docente');
                        cargarEstudiantesDashboard();
                        break;
                    case 'representante':
                        mostrarPantalla('pantalla-representante');
                        cargarProgresoRepresentante();
                        break;
                }
            })
            .catch(() => {
                localStorage.removeItem('token');
            });
    }
});

/* ===========================================
   Gestion de Estudiantes
   ============================================ */
async function cargarEstudiantes() {
    const contenedor = document.getElementById('lista-estudiantes-body');
    if (!contenedor) return;

    contenedor.innerHTML = '<div class="mensaje-carga">Cargando estudiantes...</div>';

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            contenedor.innerHTML = '<div class="mensaje-error">Sesión expirada</div>';
            return;
        }

        const respuesta = await fetch('/api/estudiantes', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        if (!respuesta.ok) throw new Error('Error al obtener estudiantes');

        const estudiantes = await respuesta.json();

        if (estudiantes.length === 0) {
            contenedor.innerHTML = '<div class="mensaje-vacio">No hay estudiantes registrados</div>';
            return;
        }

        const templateRow = document.getElementById('template-estudiante-row');
        if (!templateRow) return;

        contenedor.innerHTML = '';
        const fragment = document.createDocumentFragment();
        estudiantes.forEach(est => {
            const nombreRep = est.representante?.nombreCompleto || 'Sin asignar';
            const cedulaRep = est.representante?.cedula || '---';
            const clone = templateRow.content.cloneNode(true);
            const nombreEl = clone.querySelector('.tabla-estudiantes__nombre');
            if (nombreEl) nombreEl.textContent = obtenerNombreEstudiante(est);
            const gradoEl = clone.querySelector('.tabla-estudiantes__grado');
            if (gradoEl) gradoEl.textContent = est.grado;
            const edadEl = clone.querySelector('.tabla-estudiantes__edad');
            if (edadEl) edadEl.textContent = `${est.edad} años`;
            const sexoEl = clone.querySelector('.tabla-estudiantes__sexo');
            if (sexoEl) sexoEl.textContent = est.sexo;
            const repNombreEl = clone.querySelector('.tabla-estudiantes__rep-nombre');
            if (repNombreEl) repNombreEl.textContent = nombreRep;
            const repCedulaEl = clone.querySelector('.tabla-estudiantes__rep-cedula');
            if (repCedulaEl) repCedulaEl.textContent = cedulaRep;
            const btnEditar = clone.querySelector('.btn-editar');
            if (btnEditar) btnEditar.addEventListener('click', () => abrirEditorEstudiante(est._id));
            fragment.appendChild(clone);
        });
        contenedor.appendChild(fragment);

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<div class="mensaje-error">Error al cargar datos</div>';
    }
}
/* ===========================================
    Panel del Representante
   ============================================ */

async function abrirGestionEstudiantes(studentId) {
    if (!studentId) studentId = idEstudianteSeleccionadoRep;

    if (!studentId) {
        mostrarNotificacion('Seleccione Estudiante', 'Por favor seleccione el estudiante en la parte superior antes de gestionar.');
        return;
    }

    mostrarPantalla('pantalla-gestion-estudiante-representante');
    idEstudianteEditando = studentId;
    const nombreEl = document.getElementById('gestion-nombre-estudiante');
    const usuarioEl = document.getElementById('gestion-usuario-estudiante');
    const gradoEl = document.getElementById('gestion-grado-estudiante');
    const edadEl = document.getElementById('gestion-edad-estudiante');
    const sexoEl = document.getElementById('gestion-sexo-estudiante');
    const fotoEl = document.getElementById('gestion-foto-estudiante');
    const passEl = document.getElementById('gestion-password-estudiante');

    try {
        const token = localStorage.getItem('token');
        const headers = { 'Accept': 'application/json', 'x-auth-token': token, 'Authorization': `Bearer ${token}` };
        let estudiante = null;
        try {
            const respList = await fetch('/api/estudiantes/por-representante', { headers });
            if (respList.ok) {
                const lista = await respList.json();
                estudiante = lista.find(s => (s._id || s.id) === studentId || (s.id && s.id === studentId));
            }
        } catch (e) {
            console.warn('No se pudo listar estudiantes por representante:', e);
        }
        if (!estudiante) {
            const resp = await fetch('/api/estudiantes/mi-estudiante', { method: 'GET', headers: { 'x-auth-token': token } });
            if (resp.ok) {
                const single = await resp.json();
                if ((single._id || single.id) === studentId) estudiante = single;
            }
        }

        if (!estudiante) {
            mostrarNotificacion('Error', 'No se pudo cargar la información del estudiante seleccionado.');
            return;
        }

        nombreEl.textContent = obtenerNombreEstudiante(estudiante);
        usuarioEl.textContent = estudiante.nombreUsuario || '';
        gradoEl.textContent = estudiante.grado || '';
        edadEl.textContent = estudiante.edad ? `${estudiante.edad} años` : '';
        sexoEl.textContent = estudiante.sexo || '';

        if (estudiante.contrasena) {
            passEl.value = estudiante.contrasena;
        } else {
            passEl.value = "********";
        }
        if (fotoEl) {
            try {
                fotoEl.src = obtenerUrlFoto(estudiante.foto);
                fotoEl.alt = obtenerNombreEstudiante(estudiante) || 'Foto del estudiante';
                fotoEl.onerror = () => { fotoEl.src = 'assets/svg/perfil.svg'; };
            } catch (err) {
                fotoEl.src = 'assets/svg/perfil.svg';
            }
        }

    } catch (error) {
        console.error(error);
        mostrarNotificacion('Error', 'No se pudo cargar la información del estudiante.');
    }
}

function togglePasswordVisibility(idInput) {
    const input = document.getElementById(idInput);
    const icon = document.getElementById('icon-toggle-password');

    if (input.type === "password") {
        input.type = "text";
        if (icon) {
            icon.src = "assets/svg/eye-slash.svg";
            icon.alt = "Ocultar contraseña";
        }
    } else {
        input.type = "password";
        if (icon) {
            icon.src = "assets/svg/eye.svg";
            icon.alt = "Mostrar contraseña";
        }
    }
}

async function subirFotoEstudiante() {
    const input = document.getElementById('input-foto-estudiante');
    if (input.files && input.files[0]) {
        const formData = new FormData();
        formData.append('foto', input.files[0]);

        try {
            let url = '/api/estudiantes/mi-estudiante/foto';
            if (typeof idEstudianteEditando !== 'undefined' && idEstudianteEditando) {
                url += `?id=${encodeURIComponent(idEstudianteEditando)}`;
            }

            const respuesta = await fetch(url, {
                method: 'POST',
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                },
                body: formData
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                document.getElementById('gestion-foto-estudiante').src = datos.foto;
                mostrarNotificacion('Éxito', 'Foto actualizada con éxito');
                if (typeof idEstudianteEditando !== 'undefined' && idEstudianteEditando) {
                    const listItemImg = document.querySelector(`.rep-student-item[data-id="${idEstudianteEditando}"] img`);
                    if (listItemImg) {
                        try {
                            listItemImg.src = datos.foto;
                        } catch (e) { console.error(e) }
                    }
                    if (typeof idEstudianteSeleccionadoRep !== 'undefined' && idEstudianteSeleccionadoRep === idEstudianteEditando) {
                        const dashFoto = document.getElementById('rep-dashboard-foto-estudiante');
                        if (dashFoto) dashFoto.src = datos.foto;
                        const mainFoto = document.getElementById('progreso-foto-estudiante');
                        if (mainFoto) mainFoto.src = datos.foto;
                    }
                }
            } else {
                mostrarNotificacion('Error', datos.msg || 'Error al subir foto');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error', 'Error al conectar con el servidor');
        }
    }
}

// --- Editar contasena ---
function mostrarModalEditarPassword() {
    const modal = document.getElementById('modal-editar-password');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.getElementById('nueva-password').value = '';
        document.getElementById('confirmar-password').value = '';
        document.getElementById('mensaje-error-password').textContent = '';
    }
}

function ocultarModalEditarPassword() {
    const modal = document.getElementById('modal-editar-password');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

async function editarPasswordEstudiante(evento) {
    evento.preventDefault();

    const nuevaPassword = document.getElementById('nueva-password').value;
    const confirmarPassword = document.getElementById('confirmar-password').value;
    const mensajeError = document.getElementById('mensaje-error-password');

    // Validaciones
    if (nuevaPassword.length < 6) {
        mensajeError.textContent = 'La contraseña debe tener al menos 6 caracteres';
        return;
    }

    if (nuevaPassword !== confirmarPassword) {
        mensajeError.textContent = 'Las contraseñas no coinciden';
        return;
    }

    try {
        const respuesta = await fetch('/api/estudiantes/mi-estudiante/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ nuevaPassword })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            ocultarModalEditarPassword();
            mostrarNotificacion('Contraseña Actualizada', 'La contraseña del estudiante ha sido actualizada exitosamente.');
            const passEl = document.getElementById('gestion-password-estudiante');
            if (passEl) {
                passEl.value = nuevaPassword;
            }
        } else {
            mensajeError.textContent = datos.msg || 'Error al actualizar la contraseña';
        }
    } catch (error) {
        console.error('Error:', error);
        mensajeError.textContent = 'Error al conectar con el servidor';
    }
}

async function cargarProgresoRepresentante() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        idEstudianteSeleccionadoRep = null;
        const headers = { 'Accept': 'application/json', 'x-auth-token': token, 'Authorization': `Bearer ${token}` };
        let estudiantes = [];
        try {
            const respList = await fetch('/api/estudiantes/por-representante', { headers });
            if (respList.ok) {
                estudiantes = await respList.json();
            }
        } catch (e) {
            console.warn('Error al obtener lista por representante', e);
        }
        renderRepStudentsList(estudiantes);
        if (!idEstudianteSeleccionadoRep) {
            const nombreRepEl = document.getElementById('rep-dashboard-nombre-estudiante');
            const gradoRepEl = document.getElementById('rep-dashboard-grado-estudiante');
            const fotoRepEl = document.getElementById('rep-dashboard-foto-estudiante');
            const listaObserv = document.getElementById('lista-observaciones-representante');

            if (nombreRepEl) nombreRepEl.textContent = '';
            if (gradoRepEl) gradoRepEl.textContent = '';
            if (fotoRepEl) {
                fotoRepEl.src = 'assets/svg/perfil.svg';
                fotoRepEl.alt = 'Foto estudiante';
            }
            if (listaObserv) listaObserv.innerHTML = '<li class="recomendaciones-representante__item">Seleccione un estudiante para ver observaciones.</li>';

            ['suma', 'resta', 'multiplicacion'].forEach(op => {
                const nivelEl = document.getElementById(`rep-progreso-${op}-nivel`);
                const ejerciciosEl = document.getElementById(`rep-progreso-${op}-ejercicios`);
                const puntajeEl = document.getElementById(`rep-progreso-${op}-puntaje`);
                if (nivelEl) nivelEl.textContent = 1;
                if (ejerciciosEl) ejerciciosEl.textContent = 0;
                if (puntajeEl) puntajeEl.textContent = 0;
                actualizarEstrellasUI_Rep(op, 0);
            });

            const ultimaActividadEl = document.getElementById('rep-ultima-actividad');
            if (ultimaActividadEl) ultimaActividadEl.textContent = 'Última actividad: -';
            const totalSpan = document.querySelector('#pantalla-representante .progreso-general__texto');
            if (totalSpan) totalSpan.textContent = 'Seleccione un estudiante para ver su progreso.';
            const tarjetas = document.getElementById('rep-tarjetas-progreso');
            if (tarjetas) tarjetas.style.display = 'none';
            const infoSmall = document.getElementById('rep-info-estudiante');
            if (infoSmall) infoSmall.style.display = 'none';
            const avatarLarge = document.getElementById('progreso-foto-estudiante');
            if (avatarLarge) avatarLarge.style.display = 'none';
            const repProgresoGeneral = document.getElementById('rep-progreso-general');
            if (repProgresoGeneral) repProgresoGeneral.style.display = 'none';
            const repRecomend = document.getElementById('rep-recomendaciones');
            if (repRecomend) repRecomend.style.display = 'none';
            const instr = document.getElementById('rep-instruction');
            if (instr) instr.style.display = 'block';

            return;
        }

        const seleccionado = estudiantes.find(e => (e._id || e.id) == seleccionadoId) || null;
        const nombreRepEl = document.getElementById('rep-dashboard-nombre-estudiante');
        const gradoRepEl = document.getElementById('rep-dashboard-grado-estudiante');
        const fotoRepEl = document.getElementById('rep-dashboard-foto-estudiante');

        if (nombreRepEl) nombreRepEl.textContent = obtenerNombreEstudiante(seleccionado) || '';
        if (gradoRepEl) gradoRepEl.textContent = (seleccionado && seleccionado.grado) || '';
        if (fotoRepEl) {
            try {
                fotoRepEl.src = obtenerUrlFoto((seleccionado && seleccionado.foto) || '');
                fotoRepEl.alt = obtenerNombreEstudiante(seleccionado) || 'Foto estudiante';
                fotoRepEl.onerror = () => { fotoRepEl.src = 'assets/svg/perfil.svg'; };
            } catch (err) {
                fotoRepEl.src = 'assets/svg/perfil.svg';
            }
        }
        const infoSmall = document.getElementById('rep-info-estudiante');
        if (infoSmall) infoSmall.style.display = 'block';

        try {
            const respProgreso = await fetch(`/api/estudiantes/progreso/${encodeURIComponent(seleccionadoId)}`, { headers });
            if (!respProgreso.ok) return;
            const progresos = await respProgreso.json();

            let totalEjerciciosGlobal = 0;
            ['suma', 'resta', 'multiplicacion'].forEach(op => {
                const nivelEl = document.getElementById(`rep-progreso-${op}-nivel`);
                const ejerciciosEl = document.getElementById(`rep-progreso-${op}-ejercicios`);
                const puntajeEl = document.getElementById(`rep-progreso-${op}-puntaje`);
                if (nivelEl) nivelEl.textContent = 1;
                if (ejerciciosEl) ejerciciosEl.textContent = 0;
                if (puntajeEl) puntajeEl.textContent = 0;
                actualizarEstrellasUI_Rep(op, 0);
            });

            progresos.forEach(p => {
                const op = p.operacion;
                const nivelEl = document.getElementById(`rep-progreso-${op}-nivel`);
                const ejerciciosEl = document.getElementById(`rep-progreso-${op}-ejercicios`);
                const puntajeEl = document.getElementById(`rep-progreso-${op}-puntaje`);
                if (ejerciciosEl) ejerciciosEl.textContent = p.ejerciciosCompletados;
                if (puntajeEl) puntajeEl.textContent = p.puntajeMaximo;
                if (nivelEl) nivelEl.textContent = p.nivel;
                const estrellas = Math.min(5, p.nivel);
                actualizarEstrellasUI_Rep(op, estrellas);
                totalEjerciciosGlobal += p.ejerciciosCompletados;
            });

            const panelRep = document.getElementById('pantalla-representante');
            if (panelRep) {
                const totalSpan = panelRep.querySelector('.progreso-general__texto');
                if (totalSpan) totalSpan.textContent = `Ha completado ${totalEjerciciosGlobal} ejercicios en total`;
            }
            const respSesiones = await fetch(`/api/estudiantes/sesiones/${encodeURIComponent(seleccionadoId)}`, { headers });
            if (respSesiones.ok) {
                const sesiones = await respSesiones.json();
                const ultimaActividadEl = document.getElementById('rep-ultima-actividad');
                if (ultimaActividadEl) {
                    if (sesiones && sesiones.length > 0) {
                        const ultimaSesion = sesiones[0];
                        const textoActividad = formatearTiempoRelativo(ultimaSesion.fecha);
                        ultimaActividadEl.textContent = `Última actividad: ${textoActividad}`;
                    } else {
                        ultimaActividadEl.textContent = 'Última actividad: Sin actividad registrada';
                    }
                }
            }

            cargarObservacionesRepresentante(seleccionadoId);
            const tarjetas = document.getElementById('rep-tarjetas-progreso');
            if (tarjetas) tarjetas.style.display = 'grid';
            const instr = document.getElementById('rep-instruction');
            if (instr) instr.style.display = 'none';
            const avatarLarge = document.getElementById('progreso-foto-estudiante');
            if (avatarLarge) avatarLarge.style.display = 'block';
            const repProgresoGeneral = document.getElementById('rep-progreso-general');
            if (repProgresoGeneral) repProgresoGeneral.style.display = 'block';
            const repRecomend = document.getElementById('rep-recomendaciones');
            if (repRecomend) repRecomend.style.display = 'block';
        } catch (e) {
            console.error('Error cargando progreso/actividades del representante:', e);
        }

    } catch (e) { console.error(e); }
}

// Funcion para cargar observaciones del docente en el panel del representante
async function cargarObservacionesRepresentante(estudianteId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        let url = '/api/estudiantes/observaciones';
        if (estudianteId) url += `?estudianteId=${encodeURIComponent(estudianteId)}`;

        const respuesta = await fetch(url, {
            headers: { 'x-auth-token': token }
        });

        if (!respuesta.ok) return;

        const sesionesConObservaciones = await respuesta.json();
        const listaObservaciones = document.getElementById('lista-observaciones-representante');

        if (!listaObservaciones) return;

        if (sesionesConObservaciones.length === 0) {
            listaObservaciones.innerHTML = '<li class="recomendaciones-representante__item">No hay observaciones del docente aún.</li>';
            return;
        }

        const templateObs = document.getElementById('template-observacion-item');
        if (!templateObs) {
            let html = '';
            sesionesConObservaciones.forEach(sesion => {
                const fecha = formatearTiempoRelativo(sesion.fecha);
                const operacionNombre = sesion.operacion.charAt(0).toUpperCase() + sesion.operacion.slice(1);
                html += `
                    <li class="recomendaciones-representante__item">
                        <strong>${operacionNombre} - Nivel ${sesion.nivel}</strong> (${fecha})<br>
                        ${sesion.observaciones}
                    </li>
                `;
            });
            listaObservaciones.innerHTML = html;
            return;
        }

        listaObservaciones.innerHTML = '';
        const fragObs = document.createDocumentFragment();
        sesionesConObservaciones.forEach(sesion => {
            const fecha = formatearTiempoRelativo(sesion.fecha);
            const operacionNombre = sesion.operacion.charAt(0).toUpperCase() + sesion.operacion.slice(1);
            const clone = templateObs.content.cloneNode(true);
            const tituloEl = clone.querySelector('.observacion-titulo');
            const fechaEl = clone.querySelector('.observacion-fecha');
            const textEl = clone.querySelector('.observacion-text');
            if (tituloEl) tituloEl.textContent = `${operacionNombre} - Nivel ${sesion.nivel}`;
            if (fechaEl) fechaEl.textContent = ` (${fecha})`;
            if (textEl) textEl.textContent = sesion.observaciones || '';
            fragObs.appendChild(clone);
        });
        listaObservaciones.appendChild(fragObs);

    } catch (e) {
        console.error('Error al cargar observaciones:', e);
    }
}

function actualizarEstrellasUI_Rep(operacion, cantidadEstrellas) {
    const contenedor = document.getElementById(`rep-progreso-${operacion}-estrellas`);
    if (!contenedor) return;
    const templateStar = document.getElementById('template-estrella');
    contenedor.innerHTML = '';
    if (templateStar) {
        const frag = document.createDocumentFragment();
        for (let i = 0; i < cantidadEstrellas; i++) {
            frag.appendChild(templateStar.content.cloneNode(true));
        }
        contenedor.appendChild(frag);
    } else {
        for (let i = 0; i < cantidadEstrellas; i++) {
            const span = document.createElement('span');
            span.className = 'estrellas__estrella estrellas__estrella--llena';
            const img = document.createElement('img');
            img.src = 'assets/svg/estrella.svg';
            img.alt = 'Estrella';
            span.appendChild(img);
            contenedor.appendChild(span);
        }
    }
}

// Cargar lista de estudiantes asociados al representante 
async function cargarEstudiantesRepresentante() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const headers = { 'Accept': 'application/json', 'x-auth-token': token, 'Authorization': `Bearer ${token}` };
        const resp = await fetch('/api/estudiantes/por-representante', { headers });
        if (!resp.ok) {
            console.error('Error cargando estudiantes por representante', resp.status);
            return;
        }
        const misEstudiantes = await resp.json();
        renderRepStudentsList(misEstudiantes);

    } catch (e) {
        console.error('Error cargarEstudiantesRepresentante:', e);
    }
}

function renderRepStudentsList(estudiantes) {
    const cont = document.querySelector('#pantalla-representante #rep-students-list') || document.querySelector('#progress-screen #rep-students-list') || document.getElementById('rep-students-list');
    if (!cont) return;
    cont.innerHTML = '';

    if (!estudiantes || estudiantes.length === 0) {
        cont.innerHTML = '<div class="mensaje-vacio">No hay estudiantes asociados a este representante.</div>';
        return;
    }

    estudiantes.forEach(est => {
        const item = document.createElement('div');
        item.className = 'rep-student-item';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.dataset.id = est._id || est.id || '';

        const img = document.createElement('img');
        try { img.src = obtenerUrlFoto(est.foto); } catch (e) { img.src = 'assets/svg/perfil.svg'; }
        img.alt = obtenerNombreEstudiante(est) || 'Estudiante';
        img.onerror = () => { img.src = 'assets/svg/perfil.svg'; };

        const nombre = document.createElement('div');
        nombre.className = 'rep-student-name';
        nombre.textContent = obtenerNombreEstudiante(est).split(' ').slice(0, 2).join(' ');

        item.appendChild(img);
        item.appendChild(nombre);

        item.addEventListener('click', () => seleccionarEstudianteRep(item, est));
        item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') seleccionarEstudianteRep(item, est); });

        cont.appendChild(item);
    });
}

function seleccionarEstudianteRep(itemEl, estudiante) {
    document.querySelectorAll('.rep-student-item').forEach(i => i.classList.remove('selected'));
    if (itemEl) itemEl.classList.add('selected');

    idEstudianteSeleccionadoRep = estudiante && (estudiante._id || estudiante.id) ? (estudiante._id || estudiante.id) : null;

    const listaEstudiantes = document.getElementById('rep-students-list');
    if (listaEstudiantes) listaEstudiantes.style.display = 'none';

    const nombreRepEl = document.getElementById('rep-dashboard-nombre-estudiante');
    const gradoRepEl = document.getElementById('rep-dashboard-grado-estudiante');
    const fotoRepEl = document.getElementById('rep-dashboard-foto-estudiante');

    if (idEstudianteSeleccionadoRep && estudiante) {
        const tarjetas = document.getElementById('rep-tarjetas-progreso');
        if (tarjetas) tarjetas.style.display = 'grid';
        const instr = document.getElementById('rep-instruction');
        if (instr) instr.style.display = 'none';
        const infoSmall = document.getElementById('rep-info-estudiante');
        if (infoSmall) infoSmall.style.display = 'block';

        const btnCambiar = document.getElementById('btn-cambiar-estudiante');
        if (btnCambiar) btnCambiar.style.display = 'block';

        const repProgresoGeneral = document.getElementById('rep-progreso-general');
        if (repProgresoGeneral) repProgresoGeneral.style.display = 'block';
        const repRecomend = document.getElementById('rep-recomendaciones');
        if (repRecomend) repRecomend.style.display = 'block';
        if (nombreRepEl) nombreRepEl.textContent = obtenerNombreEstudiante(estudiante) || '';
        if (gradoRepEl) gradoRepEl.textContent = estudiante.grado || '';
        if (fotoRepEl) {
            try {
                fotoRepEl.src = obtenerUrlFoto(estudiante.foto);
                fotoRepEl.alt = obtenerNombreEstudiante(estudiante) || 'Foto estudiante';
                fotoRepEl.onerror = () => { fotoRepEl.src = 'assets/svg/perfil.svg'; };
            } catch (err) { fotoRepEl.src = 'assets/svg/perfil.svg'; }
        }

        cargarObservacionesRepresentante(idEstudianteSeleccionadoRep);

        (async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const headers = { 'Accept': 'application/json', 'x-auth-token': token, 'Authorization': `Bearer ${token}` };

                const respProgreso = await fetch(`/api/estudiantes/progreso/${encodeURIComponent(idEstudianteSeleccionadoRep)}`, { headers });
                if (respProgreso.ok) {
                    const progresos = await respProgreso.json();
                    let totalEjerciciosGlobal = 0;
                    ['suma', 'resta', 'multiplicacion'].forEach(op => {
                        const nivelEl = document.getElementById(`rep-progreso-${op}-nivel`);
                        const ejerciciosEl = document.getElementById(`rep-progreso-${op}-ejercicios`);
                        const puntajeEl = document.getElementById(`rep-progreso-${op}-puntaje`);
                        if (nivelEl) nivelEl.textContent = 1;
                        if (ejerciciosEl) ejerciciosEl.textContent = 0;
                        if (puntajeEl) puntajeEl.textContent = 0;
                        actualizarEstrellasUI_Rep(op, 0);
                    });

                    progresos.forEach(p => {
                        const op = p.operacion;
                        const nivelEl = document.getElementById(`rep-progreso-${op}-nivel`);
                        const ejerciciosEl = document.getElementById(`rep-progreso-${op}-ejercicios`);
                        const puntajeEl = document.getElementById(`rep-progreso-${op}-puntaje`);
                        if (ejerciciosEl) ejerciciosEl.textContent = p.ejerciciosCompletados;
                        if (puntajeEl) puntajeEl.textContent = p.puntajeMaximo;
                        if (nivelEl) nivelEl.textContent = p.nivel;
                        const estrellas = Math.min(5, p.nivel);
                        actualizarEstrellasUI_Rep(op, estrellas);
                        totalEjerciciosGlobal += p.ejerciciosCompletados;
                    });

                    const panelRep = document.getElementById('pantalla-representante');
                    if (panelRep) {
                        const totalSpan = panelRep.querySelector('.progreso-general__texto');
                        if (totalSpan) totalSpan.textContent = `Ha completado ${totalEjerciciosGlobal} ejercicios en total`;
                    }
                }

                // Última sesion de actividad
                const respSesiones = await fetch(`/api/estudiantes/sesiones/${encodeURIComponent(idEstudianteSeleccionadoRep)}`, { headers });
                if (respSesiones.ok) {
                    const sesiones = await respSesiones.json();
                    const ultimaActividadEl = document.getElementById('rep-ultima-actividad');
                    if (ultimaActividadEl) {
                        if (sesiones && sesiones.length > 0) {
                            const ultimaSesion = sesiones[0];
                            const textoActividad = formatearTiempoRelativo(ultimaSesion.fecha);
                            ultimaActividadEl.textContent = `Última actividad: ${textoActividad}`;
                        } else {
                            ultimaActividadEl.textContent = 'Última actividad: Sin actividad registrada';
                        }
                    }
                }
            } catch (e) {
                console.error('Error cargando progreso del estudiante seleccionado:', e);
            }
        })();
    } else {
        const tarjetas = document.getElementById('rep-tarjetas-progreso');
        if (tarjetas) tarjetas.style.display = 'none';
        const instr = document.getElementById('rep-instruction');
        if (instr) instr.style.display = 'block';
        const infoSmall = document.getElementById('rep-info-estudiante');
        if (infoSmall) infoSmall.style.display = 'none';

        const repProgresoGeneral = document.getElementById('rep-progreso-general');
        if (repProgresoGeneral) repProgresoGeneral.style.display = 'none';
        const repRecomend = document.getElementById('rep-recomendaciones');
        if (repRecomend) repRecomend.style.display = 'none';
        if (nombreRepEl) nombreRepEl.textContent = '';
        if (gradoRepEl) gradoRepEl.textContent = '';
        if (fotoRepEl) {
            fotoRepEl.src = 'assets/svg/perfil.svg';
            fotoRepEl.alt = 'Foto estudiante';
        }
        const listaObserv = document.getElementById('lista-observaciones-representante');
        if (listaObserv) listaObserv.innerHTML = '<li class="recomendaciones-representante__item">Seleccione un estudiante para ver observaciones.</li>';
    }
}

// Cargar observaciones del docente para un estudiante especifico
async function cargarObservacionesRepresentante(estudianteId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        let url = '/api/estudiantes/observaciones';
        if (estudianteId) url += `?estudianteId=${encodeURIComponent(estudianteId)}`;

        const respuesta = await fetch(url, { headers: { 'x-auth-token': token } });
        if (!respuesta.ok) return;
        const sesionesConObservaciones = await respuesta.json();
        const listaObservaciones = document.getElementById('lista-observaciones-representante');
        if (!listaObservaciones) return;
        if (sesionesConObservaciones.length === 0) {
            listaObservaciones.innerHTML = '<li class="recomendaciones-representante__item">No hay observaciones del docente aún.</li>';
            return;
        }
        const templateObs = document.getElementById('template-observacion-item');
        if (!templateObs) {
            listaObservaciones.innerHTML = sesionesConObservaciones.map(s => `<li class="recomendaciones-representante__item"><strong>${s.operacion} - Nivel ${s.nivel}</strong> (${formatearTiempoRelativo(s.fecha)})<br>${s.observaciones}</li>`).join('');
            return;
        }
        listaObservaciones.innerHTML = '';
        const fragObs = document.createDocumentFragment();
        sesionesConObservaciones.forEach(sesion => {
            const fecha = formatearTiempoRelativo(sesion.fecha);
            const operacionNombre = sesion.operacion.charAt(0).toUpperCase() + sesion.operacion.slice(1);
            const clone = templateObs.content.cloneNode(true);
            const tituloEl = clone.querySelector('.observacion-titulo');
            const fechaEl = clone.querySelector('.observacion-fecha');
            const textEl = clone.querySelector('.observacion-text');
            if (tituloEl) tituloEl.textContent = `${operacionNombre} - Nivel ${sesion.nivel}`;
            if (fechaEl) fechaEl.textContent = ` (${fecha})`;
            if (textEl) textEl.textContent = sesion.observaciones || '';
            fragObs.appendChild(clone);
        });
        listaObservaciones.appendChild(fragObs);

    } catch (e) {
        console.error('Error cargarObservacionesRepresentante:', e);
    }
}

/* ===========================================
    Dashboard Docente
   ============================================ */
async function cargarEstudiantesDashboard() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Obtener todos los estudiantes
        const respuesta = await fetch('/api/estudiantes', {
            headers: { 'x-auth-token': token }
        });

        if (!respuesta.ok) return;
        const estudiantes = await respuesta.json();

        // Clasificar estudiantes segun sus sesiones
        const estudiantesPorRevisar = [];
        const estudiantesRevisados = [];

        // Para cada estudiante, obtener sus sesiones y clasificarlo
        for (const est of estudiantes) {
            const respSesiones = await fetch(`/api/estudiantes/sesiones/${est._id}`, {
                headers: { 'x-auth-token': token }
            });

            if (respSesiones.ok) {
                const sesiones = await respSesiones.json();

                if (sesiones.length === 0) {
                    continue;
                }

                const tieneSesionesSinRevisar = sesiones.some(s => !s.revisado);

                if (tieneSesionesSinRevisar) {
                    estudiantesPorRevisar.push(est);
                } else {
                    estudiantesRevisados.push(est);
                }
            }
        }

        const contenedorPorRevisar = document.getElementById('seccion-por-revisar');
        if (contenedorPorRevisar) {
            if (estudiantesPorRevisar.length === 0) {
                contenedorPorRevisar.innerHTML = `
                    <div class="mensaje-vacio">
                        <h3>No hay estudiantes por revisar</h3>
                        <p>Todos los estudiantes han sido revisados.</p>
                    </div>
                `;
            } else {
                const templateCard = document.getElementById('template-estudiante-card');
                if (!templateCard) {
                    let htmlCards = '';
                    estudiantesPorRevisar.slice(0, 6).forEach(est => {
                        const nombreCorto = obtenerNombreEstudiante(est).split(' ').slice(0, 2).join(' ');
                        htmlCards += `
                            <div class="lista-estudiantes__tarjeta">
                                <div class="lista-estudiantes__avatar"><img src="${est.foto || 'assets/svg/perfil.svg'}" alt="Avatar"></div>
                                <div class="lista-estudiantes__detalles">
                                    <h4 class="lista-estudiantes__nombre">${nombreCorto}</h4>
                                    <p class="lista-estudiantes__grado">${est.grado}</p>
                                </div>
                                <button class="boton boton--usuarios" onclick="verProgresoEstudiante('${est._id}', '${obtenerNombreEstudiante(est)}')">
                                    <p>Ver detalles</p>
                                </button>
                            </div>
                        `;
                    });
                    contenedorPorRevisar.innerHTML = htmlCards;
                } else {
                    contenedorPorRevisar.innerHTML = '';
                    const frag = document.createDocumentFragment();
                    estudiantesPorRevisar.slice(0, 6).forEach(est => {
                        const nombreCorto = obtenerNombreEstudiante(est).split(' ').slice(0, 2).join(' ');
                        const clone = templateCard.content.cloneNode(true);
                        const img = clone.querySelector('.card-foto');
                        const nombreEl = clone.querySelector('.lista-estudiantes__nombre');
                        const gradoEl = clone.querySelector('.lista-estudiantes__grado');
                        const btn = clone.querySelector('.card-ver-detalles');
                        if (img) {
                            try { img.src = obtenerUrlFoto(est.foto); } catch (e) { img.src = 'assets/svg/perfil.svg'; }
                        }
                        if (nombreEl) nombreEl.textContent = nombreCorto;
                        if (gradoEl) gradoEl.textContent = est.grado;
                        if (btn) btn.addEventListener('click', () => verProgresoEstudiante(est._id, obtenerNombreEstudiante(est)));
                        const btnEditCard = clone.querySelector('.btn-editar');
                        if (btnEditCard) btnEditCard.addEventListener('click', () => abrirEditorEstudiante(est._id));
                        frag.appendChild(clone);
                    });
                    contenedorPorRevisar.appendChild(frag);
                }
            }
        }

        // Actualizar seccion de los revisados
        const contenedorRevisados = document.getElementById('seccion-revisados');
        if (contenedorRevisados) {
            if (estudiantesRevisados.length === 0) {
                contenedorRevisados.innerHTML = `
                    <div class="mensaje-vacio">
                        <h3>No hay estudiantes revisados</h3>
                        <p>Cuando envíes las observaciones y marques a un estudiante como revisado, aparecerán aquí.</p>
                    </div>
                `;
            } else {
                const templateCard = document.getElementById('template-estudiante-card');
                if (!templateCard) {
                    let htmlCards = '';
                    estudiantesRevisados.slice(0, 6).forEach(est => {
                        const nombreCorto = obtenerNombreEstudiante(est).split(' ').slice(0, 2).join(' ');
                        htmlCards += `
                            <div class="lista-estudiantes__tarjeta">
                                <div class="lista-estudiantes__avatar"><img src="${est.foto || 'assets/svg/perfil.svg'}" alt="Avatar"></div>
                                <div class="lista-estudiantes__detalles">
                                    <h4 class="lista-estudiantes__nombre">${nombreCorto}</h4>
                                    <p class="lista-estudiantes__grado">${est.grado}</p>
                                </div>
                                <button class="boton boton--usuarios" onclick="verProgresoEstudiante('${est._id}', '${obtenerNombreEstudiante(est)}')">
                                    <p>Ver detalles</p>
                                </button>
                            </div>
                        `;
                    });
                    contenedorRevisados.innerHTML = htmlCards;
                } else {
                    contenedorRevisados.innerHTML = '';
                    const frag = document.createDocumentFragment();
                    estudiantesRevisados.slice(0, 6).forEach(est => {
                        const nombreCorto = obtenerNombreEstudiante(est).split(' ').slice(0, 2).join(' ');
                        const clone = templateCard.content.cloneNode(true);
                        const img = clone.querySelector('.card-foto');
                        const nombreEl = clone.querySelector('.lista-estudiantes__nombre');
                        const gradoEl = clone.querySelector('.lista-estudiantes__grado');
                        const btn = clone.querySelector('.card-ver-detalles');
                        if (img) {
                            try { img.src = obtenerUrlFoto(est.foto); } catch (e) { img.src = 'assets/svg/perfil.svg'; }
                        }
                        if (nombreEl) nombreEl.textContent = nombreCorto;
                        if (gradoEl) gradoEl.textContent = est.grado;
                        if (btn) btn.addEventListener('click', () => verProgresoEstudiante(est._id, obtenerNombreEstudiante(est)));
                        const btnEditCard = clone.querySelector('.btn-editar');
                        if (btnEditCard) btnEditCard.addEventListener('click', () => abrirEditorEstudiante(est._id));
                        frag.appendChild(clone);
                    });
                    contenedorRevisados.appendChild(frag);
                }
            }
        }

    } catch (e) {
        console.error('Error al cargar dashboard:', e);
    }
}

async function verProgresoEstudiante(id, nombre) {
    try {
        const token = localStorage.getItem('token');

        // Obtener sesiones del estudiante
        const resp = await fetch(`/api/estudiantes/sesiones/${id}`, {
            headers: { 'x-auth-token': token }
        });

        if (!resp.ok) {
            mostrarNotificacion('Error', 'No se pudieron cargar las sesiones del estudiante');
            return;
        }

        const sesiones = await resp.json();

        if (sesiones.length === 0) {
            mostrarNotificacion('Sin Actividad', `${nombre} aún no ha completado ninguna sesión de ejercicios.`);
            return;
        }

        const container = document.getElementById('detalles-estudiante-body');
        const nombreEl = document.getElementById('detalles-estudiante-nombre');
        const fotoEl = document.getElementById('detalles-estudiante-foto');
        const gradoEl = document.getElementById('detalles-estudiante-grado');

        if (!container || !nombreEl) {
            mostrarNotificacion('Error', 'No se pudo mostrar los detalles (pantalla no encontrada)');
            return;
        }

        nombreEl.textContent = nombre || 'Estudiante';
        try {
            const listaResp = await fetch('/api/estudiantes', { headers: { 'x-auth-token': token, 'Accept': 'application/json' } });
            if (listaResp.ok) {
                const lista = await listaResp.json();
                const estudiante = lista.find(s => s._id === id || s.id === id) || null;
                if (estudiante && fotoEl) {
                    try {
                        const urlFoto = obtenerUrlFoto(estudiante.foto);
                        fotoEl.src = urlFoto;
                        fotoEl.alt = obtenerNombreEstudiante(estudiante) || nombre || 'Foto del estudiante';
                        fotoEl.onerror = () => { fotoEl.src = 'assets/svg/perfil.svg'; };
                        console.debug('Asignada foto estudiante:', urlFoto);
                    } catch (err) {
                        console.warn('Error al asignar foto del estudiante, usando fallback:', err);
                        fotoEl.src = 'assets/svg/perfil.svg';
                    }
                }
                if (estudiante && gradoEl && estudiante.grado) gradoEl.textContent = estudiante.grado;
                if (estudiante && nombreEl) nombreEl.textContent = obtenerNombreEstudiante(estudiante) || nombre || 'Estudiante';
            }
        } catch (e) {
            console.warn('No se pudo cargar los datos del estudiante:', e);
        }
        container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.style.maxHeight = '500px';
        wrapper.style.overflowY = 'auto';

        const titulo = document.createElement('h3');
        titulo.style.marginBottom = '15px';
        titulo.style.color = 'white';
        titulo.textContent = `Sesiones de ${nombre}`;
        wrapper.appendChild(titulo);

        const templateSesion = document.getElementById('template-sesion-detalle');
        const templateEj = document.getElementById('template-ejercicio-row');

        sesiones.forEach((sesion) => {
            const fecha = formatearTiempoRelativo(sesion.fecha);
            const duracion = formatearDuracion(sesion.tiempoTotal);
            const aciertos = sesion.ejercicios.filter(ej => ej.acertado).length;
            const total = sesion.ejercicios.length;
            const operacionNombre = sesion.operacion.charAt(0).toUpperCase() + sesion.operacion.slice(1);

            if (!templateSesion) {
                const fallback = document.createElement('div');
                fallback.textContent = `${operacionNombre} - Nivel ${sesion.nivel} (${fecha})`;
                wrapper.appendChild(fallback);
                return;
            }

            const clone = templateSesion.content.cloneNode(true);
            const opEl = clone.querySelector('.sesion-operacion');
            const fechaEl = clone.querySelector('.sesion-fecha');
            const tiempoEl = clone.querySelector('.sesion-tiempo');
            const puntosEl = clone.querySelector('.sesion-puntos');
            const aciertosEl = clone.querySelector('.sesion-aciertos');
            const ejerciciosContainer = clone.querySelector('.sesion-ejercicios');
            const textarea = clone.querySelector('.sesion-textarea');
            const btnGuardar = clone.querySelector('.sesion-guardar');

            if (opEl) opEl.textContent = `${operacionNombre} - Nivel ${sesion.nivel}`;
            if (fechaEl) fechaEl.textContent = fecha;
            if (tiempoEl) tiempoEl.textContent = duracion;
            if (puntosEl) puntosEl.textContent = sesion.puntuacionFinal;
            if (aciertosEl) aciertosEl.textContent = `${aciertos}/${total}`;

            if (ejerciciosContainer) {
                ejerciciosContainer.innerHTML = '';
                sesion.ejercicios.forEach((ej) => {
                    if (templateEj) {
                        const ejClone = templateEj.content.cloneNode(true);
                        const estadoEl = ejClone.querySelector('.ejercicio-estado');
                        const textEl = ejClone.querySelector('.ejercicio-text');
                        const intentosEl = ejClone.querySelector('.ejercicio-intentos');
                        const operador = sesion.operacion === 'suma' ? '+' : sesion.operacion === 'resta' ? '-' : '×';
                        const estado = ej.acertado ? '✓' : '✗';
                        if (estadoEl) {
                            estadoEl.textContent = estado;
                            estadoEl.style.color = ej.acertado ? '#4caf50' : '#f44336';
                        }
                        if (textEl) textEl.textContent = `${ej.numero1} ${operador} ${ej.numero2} = ${ej.respuestaCorrecta}`;
                        if (intentosEl) intentosEl.textContent = `(${ej.intentos} intento${ej.intentos !== 1 ? 's' : ''})`;
                        ejerciciosContainer.appendChild(ejClone);
                    } else {
                        const div = document.createElement('div');
                        div.textContent = `${ej.numero1} ${ej.numero2} = ${ej.respuestaCorrecta}`;
                        ejerciciosContainer.appendChild(div);
                    }
                });
            }

            if (textarea) {
                textarea.id = `obs-${sesion._id}`;
                textarea.value = sesion.observaciones || '';
            }
            if (btnGuardar) {
                btnGuardar.addEventListener('click', () => guardarObservaciones(sesion._id));
            }

            wrapper.appendChild(clone);
        });

        container.appendChild(wrapper);
        mostrarPantalla('pantalla-detalles-estudiante');

    } catch (e) {
        console.error(e);
        mostrarNotificacion('Error', 'Error al cargar las sesiones del estudiante');
    }
}

async function abrirEditorEstudiante(id) {
    try {
        const token = localStorage.getItem('token');
        if (!token) { mostrarNotificacion('Error', 'No hay sesión activa'); return; }

        mostrarPantalla('pantalla-registrar-estudiante');

        const titulo = document.querySelector('#pantalla-registrar-estudiante .formulario-login__titulo');
        if (titulo) titulo.textContent = 'Editar Estudiante';

        try {
            console.log('abrirEditorEstudiante token present:', token ? (token.slice(0, 8) + '...') : 'null');
        } catch (e) { console.log('abrirEditorEstudiante token logging error', e); }

        try {
            const perfilResp = await fetch('/api/autenticacion/perfil', {
                headers: {
                    'x-auth-token': token,
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Accept': 'application/json'
                }
            });
            if (!perfilResp.ok) {
                console.error('abrirEditorEstudiante perfil validation failed', perfilResp.status);
                try {
                    console.error('perfil response content-type:', perfilResp.headers.get('content-type'));
                    const bodyText = await perfilResp.text().catch(() => '');
                    console.error('perfil response body (snippet):', bodyText.slice(0, 400));
                } catch (e) { console.error('error logging perfil response details', e); }
                localStorage.removeItem('token');
                mostrarNotificacion('Sesión', 'Sesión expirada. Por favor inicie sesión de nuevo.');
                mostrarPantalla('pantalla-login-docente');
                return;
            }
        } catch (e) {
            console.error('abrirEditorEstudiante perfil validation error', e);
        }



        const listaResp = await fetch('/api/estudiantes', {
            headers: {
                'x-auth-token': token,
                'Authorization': token ? `Bearer ${token}` : '',
                'Accept': 'application/json'
            }
        });

        if (!listaResp.ok) {
            const txt = await listaResp.text().catch(() => '');
            console.error('abrirEditorEstudiante lista fetch failed', listaResp.status);
            console.error('lista response content-type:', listaResp.headers.get('content-type'));
            console.error('lista response body (snippet):', (txt || '').slice(0, 400));
            if (listaResp.status === 401 || listaResp.status === 403) {
                localStorage.removeItem('token');
                mostrarNotificacion('Sesión', 'Sesión expirada o no autorizada. Inicie sesión nuevamente.');
                mostrarPantalla('pantalla-login-docente');
                return;
            }
            mostrarNotificacion('Error', `No se pudieron cargar los datos de estudiantes (${listaResp.status})`);
            return;
        }

        let estudiantesList = [];
        try {
            estudiantesList = await listaResp.json();
        } catch (e) {
            const txt = await listaResp.text().catch(() => '');
            console.error('abrirEditorEstudiante lista JSON parse error', e, txt.slice(0, 400));
            mostrarNotificacion('Error', 'Respuesta inválida del servidor al obtener la lista de estudiantes');
            return;
        }

        const estudiante = estudiantesList.find(s => s._id === id || s.id === id);
        if (!estudiante) {
            mostrarNotificacion('Error', 'Estudiante no encontrado en la lista.');
            return;
        }

        idEstudianteEditando = id;

        const setIf = (fieldId, value) => {
            const el = document.getElementById(fieldId);
            if (el) el.value = value == null ? '' : value;
        };

        setIf('reg-est-nombres', estudiante.nombres || estudiante.nombreCompleto || '');
        if (estudiante.nombres && estudiante.apellidos) {
            setIf('reg-est-nombres', estudiante.nombres);
            setIf('reg-est-apellidos', estudiante.apellidos);
        } else if (estudiante.nombreCompleto && !estudiante.apellidos) {
            const parts = (estudiante.nombreCompleto || '').split(' ');
            setIf('reg-est-nombres', parts.slice(0, -1).join(' ') || parts[0] || '');
            setIf('reg-est-apellidos', parts.slice(-1).join(' ') || '');
        }

        setIf('reg-est-edad', estudiante.edad);
        if (estudiante.sexo) {
            const s = document.getElementById('reg-est-sexo');
            if (s) s.value = estudiante.sexo;
        }
        setIf('reg-est-grado', estudiante.grado);

        if (estudiante.representante && typeof estudiante.representante === 'object') {
            const rep = estudiante.representante;
            if (rep.nombreCompleto) setIf('reg-est-nombre-rep', rep.nombreCompleto);
            if (rep.cedula) {
                const ced = String(rep.cedula || '');
                if (ced.includes('-')) {
                    const [nac, num] = ced.split('-');
                    if (nac) setIf('reg-est-cedula-nacionalidad', nac);
                    if (num) setIf('reg-est-cedula-numero', num);
                } else {
                    const m = ced.match(/^\s*([VEve])?\s*-?\s*(\d+)\s*$/);
                    if (m) {
                        if (m[1]) setIf('reg-est-cedula-nacionalidad', m[1].toUpperCase());
                        setIf('reg-est-cedula-numero', m[2]);
                    } else {
                        const first = ced.charAt(0).toUpperCase();
                        const rest = ced.slice(1).replace(/\D/g, '');
                        if (first && /[VE]/i.test(first)) setIf('reg-est-cedula-nacionalidad', first);
                        if (rest) setIf('reg-est-cedula-numero', rest);
                    }
                }
            }
        } else {
            if (estudiante.cedulaRepresentante) {
                const [nac, num] = (estudiante.cedulaRepresentante || '').split('-');
                if (nac) setIf('reg-est-cedula-nacionalidad', nac);
                if (num) setIf('reg-est-cedula-numero', num);
            }
            if (estudiante.nombreRepresentante) setIf('reg-est-nombre-rep', estudiante.nombreRepresentante);
        }

    } catch (e) {
        console.error('abrirEditorEstudiante error', e);
        mostrarNotificacion('Error', 'Error al abrir el editor: ' + (e && e.message ? e.message : e));
    }
}
/* ===========================================
    Funcion para guardar observaciones de una sesion
   ============================================ */
async function guardarObservaciones(sesionId) {
    try {
        const token = localStorage.getItem('token');
        const textarea = document.getElementById(`obs-${sesionId}`);
        const observaciones = textarea.value;

        const respuesta = await fetch(`/api/estudiantes/sesiones/${sesionId}/observaciones`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ observaciones })
        });

        if (respuesta.ok) {
            mostrarNotificacion('Éxito', 'Observaciones guardadas correctamente');
            setTimeout(() => {
                ocultarNotificacion();
                cargarEstudiantesDashboard();
            }, 1500);
        } else {
            mostrarNotificacion('Error', 'No se pudieron guardar las observaciones');
        }
    } catch (error) {
        console.error('Error al guardar observaciones:', error);
        mostrarNotificacion('Error', 'Error al guardar las observaciones');
    }
}

function deseleccionarEstudianteRep() {
    idEstudianteSeleccionadoRep = null;
    idEstudianteEditando = null;
    document.querySelectorAll('.rep-student-item').forEach(i => i.classList.remove('selected'));
    const tarjetas = document.getElementById('rep-tarjetas-progreso');
    if (tarjetas) tarjetas.style.display = 'none';

    const infoSmall = document.getElementById('rep-info-estudiante');
    if (infoSmall) infoSmall.style.display = 'none';
    const btnCambiar = document.getElementById('btn-cambiar-estudiante');
    if (btnCambiar) btnCambiar.style.display = 'none';

    const repProgresoGeneral = document.getElementById('rep-progreso-general');
    if (repProgresoGeneral) repProgresoGeneral.style.display = 'none';

    const repRecomend = document.getElementById('rep-recomendaciones');
    if (repRecomend) repRecomend.style.display = 'none';

    const listaEstudiantes = document.getElementById('rep-students-list');
    if (listaEstudiantes) {
        listaEstudiantes.style.display = 'flex';
    }

    const instr = document.getElementById('rep-instruction');
    if (instr) instr.style.display = 'block';
}

window.deseleccionarEstudianteRep = deseleccionarEstudianteRep;