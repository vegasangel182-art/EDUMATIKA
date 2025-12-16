# PROYECTO EDUMATIKA - Documentación

## ¿Qué es EDUMATIKA?

Bienvenido a la documentación de **EDUMATIKA**.
Es una plataforma educativa diseñada para el aprendizaje de matemáticas básicas (sumas, restas y multiplicaciones) de una forma divertida. El proyecto está dirigido a estudiantes de 4to grado de la Escuela Básica “José Félix Ribas”.

EDUMATIKA es una página web que funciona como un juego. Los estudiantes pueden entrar, elegir una misión (suma, resta o multiplicación) y resolver ejercicios.

Además, permite que los padres (representantes) y los profesores vean cómo va progresando el estudiante.

---

## ¿Con qué se construyó?

Para desarrollar este proyecto, se han utilizado varias herramientas de programación:

### La parte visual (Frontend)
Es lo que se visualiza en la pantalla:
*   **HTML**: Para la estructura de la página.
*   **CSS**: Para el estilo, colores de la temática, fondo de estrellas y adaptabilidad a celulares y computadoras.
*   **JavaScript**: Para la lógica del lado del cliente, funcionamiento de botones, efectos de sonido y conexión con la base de datos.
*   **Imágenes SVG**: Se usaron iconos vectoriales para evitar la pixelación.

### La parte lógica (Backend)
Es lo que funciona "por detrás" en el servidor:
*   **Node.js**: Permite ejecutar JavaScript en el servidor.
*   **Express**: Ayuda a organizar las rutas (direcciones de la página).
*   **Seguridad**: Se utilizó JWT para sesiones seguras y Bcrypt para la encriptación de contraseñas.

### La Base de Datos
*   **MongoDB**: Almacena toda la información: usuarios, notas, progreso, etc.

---

## Requisitos de Instalación

Para ejecutar este proyecto, es necesario instalar:

1.  **Node.js**: Entorno de ejecución de JavaScript. (Versión 14 o superior).
2.  **MongoDB**: Base de datos utilizada para almacenar información de usuarios, notas y progreso.
3.  **MongoDB Compass**: Herramienta visual recomendada para explorar la base de datos.

---

## Guía de Instalación

Pasos a seguir para la instalación y ejecución del proyecto:

1.  **Descargar el código**: Descargar la carpeta del proyecto desde el repositorio.
2.  **Instalar dependencias**: Abrir la terminal (consola) en la carpeta del proyecto y ejecutar el comando:
    npm install

    Esto descargará todos los paquetes necesarios.

3.  **Configurar variables de entorno (.env)**:
    Crear un archivo llamado `.env` en la raíz y pegar el siguiente contenido:
    MONGO_URI=mongodb://localhost:27017/edumatika
    JWT_SECRET=mi_clave_secreta_escolar

4.  **Instalar MongoDB** (Si no está instalado):

    Pasos para instalar y preparar MongoDB Community para el proyecto EDUMATIKA:

    1. Ingresar al sitio oficial de MongoDB: [https://www.mongodb.com/](https://www.mongodb.com/)
    2. Buscar **MongoDB Community Server** y descargar el instalador.
    3. Ejecutar el instalador y aceptar los términos.
    4. En "Service Configuration", **desmarcar** la opción "Install MongoD as Service". Esto evitará que el servidor inicie automáticamente con Windows, permitiendo iniciarlo manualmente cuando sea necesario.
    5. Mantener marcada la instalación de MongoDB Compass.
    6. Añadir el comando `mongod` a las variables de entorno. Agregar la ruta de la carpeta `bin` (ej: `C:\Program Files\MongoDB\Server\8.2\bin`) al Path del sistema.
    7. Descargar **MongoDB Shell** desde el apartado de tools en la web oficial. Extraer la carpeta en `C:\Program Files\MongoDB`.
    8. Agregar la ruta de la carpeta `bin` de MongoDB Shell al Path (ej: `C:\Program Files\MongoDB\mongosh-2.5.10-win32-x64\bin`).
    9. Crear las carpetas `data/db` en la raíz del Disco Local C (`C:\data\db`) para el almacenamiento de datos.

    Al finalizar, al ejecutar el comando `mongod` en la consola, el servidor debería iniciar correctamente.

5.  **Iniciar la Base de Datos**:
    Asegurarse de que MongoDB esté en ejecución. Si se instaló manualmente, abrir una terminal y ejecutar:
    mongod

6.  **Iniciar el proyecto**:
    En la terminal del proyecto ejecutar:
    npm run dev
    Se mostrará un mensaje indicando que el servidor está listo.

7.  **Acceder a la página**:
    Abrir el navegador y dirigirse a: `http://localhost:5000`

---

## ¿Cómo se usa?

Existen 4 tipos de usuarios (Roles):

### 1. Estudiante
*   Ingresa con su usuario.
*   Elige una misión: **Suma**, **Resta** o **Multiplicación**.
*   Resuelve ejercicios y gana puntos.
*   Cuenta con sonidos y animaciones interactivas.

### 2. Representante
*   Se registra con sus datos personales.
*   Puede visualizar a sus estudiantes asociados.
*   Consulta notas y observaciones dejadas por el docente.
*   Puede gestionar la foto o contraseña del estudiante.

### 3. Docente
*   Encargado de administrar el salón.
*   Credenciales de prueba: Usuario: `docente` / Contraseña: `admin123`
*   Visualiza la lista completa de estudiantes.
*   Revisa actividades detalladas y errores.
*   Envía observaciones a los representantes.

### 4. Administrador
*   Usuario encargado de registrar profesores y asignarles grados y secciones.
*   **Nota importante**: Al iniciar la aplicación por primera vez, el sistema crea automáticamente un usuario administrador por defecto con las siguientes credenciales:
    *   **Usuario**: `admin`
    *   **Contraseña**: `admin123`

---

## Organización de Carpetas

La estructura del código es la siguiente:

*   **/assets**: Contiene imágenes y sonidos.
*   **/controladores**: Funciones lógicas (guardar, borrar, buscar).
*   **/modelos**: Definición de esquemas de datos (usuarios, estudiantes).
*   **/rutas**: Direcciones web del sistema api.
*   **app.js**: Código principal del frontend.
*   **styles.css**: Hoja de estilos.
*   **server.js**: Archivo principal de inicialización del servidor.

---

# Proyecto Educativo - Escuela Básica “José Félix Ribas”
Desarrollado por: Angel Vegas 

