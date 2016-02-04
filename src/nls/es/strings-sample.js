/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define({
    // HEAD
    TITLE: "PRIMEROS PASOS CON BRACKETS",
    DESCRIPTION: "Una guía interactiva de primeros pasos para Brackets.",

    // BODY
    GETTING_STARTED: "PRIMEROS PASOS CON BRACKETS",
    GETTING_STARTED_GUIDE: "¡Ésta es tu guía!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "HECHO CON <3 Y JAVASCRIPT",
    WELCOME:
        "Bienvenido a Brackets, un nuevo editor de código abierto que entiende el diseño web. Es un editor de\n" +
        "código liviano y potente al mismo tiempo que incluye herramientas visuales dentro del mismo para\n" +
        "que puedas obtener la ayuda que necesites cuando la necesites.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "¿QUÉ ES BRACKETS?",
    EDITOR: "Brackets es un editor diferente.",
    EDITOR_DESCRIPTION:
        "Brackets tiene varias características únicas como la Edición rápida y la Vista previa dinámica y muchas\n" +
        "más que no vas a encontrar en otros editores. Además, Brackets está escrito en JavaScript, HTML y CSS.\n" +
        "Esto significa que la mayoría de quienes usan Brackets tienen las habilidades necesarias para modificar y\n" +
        "extender el editor. De hecho, nosotros usamos Brackets todos los días para desarrollar Brackets. Para\n" +
        "saber más sobre cómo utilizar estas características únicas, continúa leyendo.",

    // GET STARTED WITH YOUR OWN FILES
    PROJECTS_COMMENT: "EMPIEZA CON TUS PROPIOS ARCHIVOS",
    PROJECTS: "Proyectos en Brackets",
    PROJECTS_DESCRIPTION:
        "Para poder editar tu propio código en Brackets, puedes simplemente abrir la carpeta que contiene los\n" +
        "archivos. Brackets considera a la carpeta abierta como el \"proyecto\"; características como las Sugerencias\n" +
        "de código, la Vista previa dinámica y la Edición rápida solo utilizan los archivos contenidos dentro de\n" +
        "la carpeta actualmente abierta.",
    PROJECTS_SAMP:
        "Una vez que estés listo para salir del proyecto de ejemplo y editar tu propio código, puedes usar el menú\n" +
        "despegable en la barra de la izquierda para cambiar de carpeta. En estos momentos, el menú despegable dice\n" +
        "\"Primeros Pasos\" - la cual es la carpeta que contiene el archivo que estás viendo en estos momentos. Haz\n" +
        "clic en el menú despegable y selecciona \"Abrir carpeta…\" para abrir tu carpeta.\n" +
        "También puedes usar el menú despegable para abrir las carpetas que abriste recientemente, incluyendo este\n" +
        "proyecto de ejemplo.",

    // THE RELATIONSHIP BETWEEN HTML, CSS AND JAVASCRIPT
    QUICK_EDIT_COMMENT: "LA RELACIÓN ENTRE HTML, CSS Y JAVASCRIPT",
    QUICK_EDIT: "Edición rápida de CSS y JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "Se acabó aquello de estar saltando de documento en documento perdiendo de vista lo que estás haciendo. Mientras\n" +
        "estás escribiendo HTML, usa el atajo de teclado <kbd>Cmd/Ctrl + E</kbd> para abrir un editor rápido en\n" +
        "línea con todo el contenido CSS relacionado. Ajusta tu CSS y oprime <kbd>ESC</kbd> para volver a tu HTML,\n" +
        "o simplemente mantenga las reglas CSS abiertas para que pasen a formar parte de tu editor de HTML. Si\n" +
        "pulsas <kbd>ESC</kbd> fuera de un editor rápido, todos se cerrarán a la vez. La edición rápida también\n" +
        "funciona con archivos LESS y SCSS, incluyendo las reglas anidadas.",
    QUICK_EDIT_SAMP:
        "¿Quieres verlo funcionando? Coloca tu cursor sobre la etiqueta <!-- <samp> --> y oprime\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. Deberías ver aparecer un editor rápido de CSS más arriba, mostrando la regla de\n" +
        "CSS que le afecta. La edición rápida funciona también en atributos de tipo clase e id. También puedes\n" +
        "utilizarlo en tus archivos LESS o SCSS.\n" +
        "\n" +
        "Puedes crear nuevas reglas de la misma manera. Haz clic en una de las etiquetas <!-- <p> --> de más arriba\n" +
        "y oprime <kbd>Cmd/Ctrl + E</kbd>. Todavía no hay reglas para ese elemento, pero puedes hacer clic en el\n" +
        "botón Nueva Regla para añadir una nueva regla a las etiquetas <!-- <p> -->.",
    QUICK_EDIT_SCREENSHOT: "Una captura de pantalla con un Editor Rápido de CSS",
    QUICK_EDIT_OTHERS:
        "También puedes usar el mismo atajo para editar otras cosas--como funciones en JavaScript, colores y\n" +
        "funciones de temporización de animaciones--y estamos añadiendo más y más continuamente.",
    QUICK_EDIT_NOTE:
        "Por ahora, no se pueden anidar editores en línea, por lo que sólo puedes usar la característica de\n" +
        "Edición Rápida cuando el cursor está en un editor \"completo\".",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "LIVE PREVIEW",
    LIVE_PREVIEW: "Visualiza cambios en archivos HTML y CSS en vivo en el navegador",
    LIVE_PREVIEW_INTRO:
        "¿Conoces ese baile de \"guardar/recargar\" que llevamos años haciendo? ¿Ése en el que haces cambios en tu\n" +
        "editor, oprimes guardar, cambias al navegador y recargas para por fin poder ver el resultado? Con\n" +
        "Brackets, ya no tienes que hacerlo.",
    LIVE_PREVIEW_DESCRIPTION:
        "¡Brackets abrirá una <em>conexión en vivo</em> con tu navegador local y le enviará los cambios en el\n" +
        "archivo HTML y CSS conforme escribas! Puede que ya estés haciendo algo parecido con las herramientas de\n" +
        "desarrollo del navegador, pero con Brackets ya no necesitas copiar y pegar el código final de vuelta a tu\n" +
        "editor. ¡Tu código se ejecuta en el navegador, pero vive en tu editor!",
    LIVE_PREVIEW_HIGHLIGHT: "Resaltado en vivo de elementos HTML y reglas CSS",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Brackets te ayuda a ver cómo los cambios en HTML y CSS afectan a tu página. Cuando tu cursor se encuentre\n" +
        "sobre una regla de CSS, Brackets resaltará todos los elementos afectados en el navegador. Del mismo modo,\n" +
        "cuando estés editando un archivo HTML, Brackets también resaltará los elementos correspondientes en tu navegador.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Si tienes instalado Google Chrome, puedes probarlo tú mismo. Haz clic sobre el icono del rayo de la\n" +
        "esquina superior derecha o presiona <kbd>Cmd/Ctrl + Alt + P</kbd>. Cuando la Vista previa dinámica está\n" +
        "funcionando en un documento HTML, todos los documentos CSS relacionados se pueden editar en tiempo real.\n" +
        "El icono pasará de gris a dorado cuando Brackets consiga establecer una conexión con tu navegador.\n" +
        "\n" +
        "Ahora, coloca el cursor sobre la etiqueta <!-- <img> --> que se encuentra un poco más arriba. Observa\n" +
        "cómo aparece el resaltado azul alrededor de la imagen en Chrome. Luego, utiliza <kbd>Cmd/Ctrl + E</kbd>\n" +
        "para abrir las reglas de CSS existentes. Intenta cambiar el tamaño del borde de 10px a 20px o el color\n" +
        "del fondo de \"transparent\" a \"hotpink\". Si Brackets y tu navegador están funcionando en paralelo, verás\n" +
        "los cambios reflejados de manera instantánea en tu navegador. Genial, ¿verdad?",
    LIVE_PREVIEW_NOTE:
        "Actualmente, Brackets sólo soporta Vista previa dinámica para HTML y CSS. Aún así, en la versión actual,\n" +
        "los cambios en archivos JavaScript son recargados automáticamente en el navegador cuando guardas. En estos\n" +
        "momentos estamos trabajando en el soporte de Vista previa dinámica para JavaScript. Las actualizaciones\n" +
        "automáticas sólo son posibles en Google Chrome, pero esperamos poder trasladar esta funcionalidad a todos\n" +
        "los grandes navegadores.",

    // QUICK VIEW
    QUICK_VIEW: "Vista Rápida",
    QUICK_VIEW_DESCRIPTION:
        "Para aquellos que todavía no han memorizado las equivalencias de color entre Hex y RGB, Brackets permite\n" +
        "ver exactamente qué color se está utilizando rápida y fácilmente. Tanto en CSS como en HTML, simplemente\n" +
        "mueve el cursor sobre cualquier valor de color o gradiente y Brackets mostrará una previsualización del\n" +
        "mismo de manera automática. Lo mismo sirve para imágenes: simplemente pasa el cursor sobre la dirección\n" +
        "de una imagen en Brackets, y éste mostrará una vista en miniatura de la misma.",
    QUICK_VIEW_SAMP:
        "Para probar la previsualización tú mismo, coloca el cursor en la etiqueta <!-- <body> --> al principio de\n" +
        "este documento y oprime <kbd>Cmd/Ctrl + E</kbd> para abrir un editor CSS. Ahora, simplemente mueve el\n" +
        "cursor sobre cualquiera de los colores dentro del CSS. También puedes verlo funcionando en gradientes\n" +
        "abriendo un editor de CSS en la etiqueta <!-- <html> --> y pasando el cursor por cualquiera de los valores\n" +
        "para las imágenes de fondo. Para probar la vista previa de imágenes, coloca el cursor sobre la imagen\n" +
        "incluida antes en éste documento.",

    // EXTENSIONS
    EXTENSIONS: "¿Necesitas algo más? ¡Prueba una extensión!",
    EXTENSIONS_DESCRIPTION:
        "Además de todas las bondades naturales de Brackets, nuestra amplia y creciente comunidad de desarrolladores\n" +
        "de extensiones ha creado cientos de extensiones que añaden útiles funcionalidades. Si hay algo que\n" +
        "necesitas que Brackets no soporta, es bastante probable que alguien haya construido una extensión para\n" +
        "ello. Para navegar o buscar en la lista de extensiones disponibles, selecciona <strong>Archivo >\n" +
        "Gestionar extensiones...</strong> y haz clic en la pestaña \"Disponibles\". Cuando encuentres una que\n" +
        "quieras, simplemente presiona el botón \"Instalar\" a su derecha.",

    // LET US KNOW WHAT YOU THINK
    GET_INVOLVED_COMMENT: "HAZNOS SABER LO QUE PIENSAS",
    GET_INVOLVED: "Involúcrate",
    GET_INVOLVED_DESCRIPTION:
        "Brackets es un proyecto de código abierto. Desarrolladores web de todo el mundo están contribuyendo\n" +
        "a construir un mejor editor de código. Haznos saber lo que piensas, comparte tus ideas o contribuye\n" +
        "directamente al proyecto.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Blog del equipo de Brackets",
    URLNAME_BRACKETS_GITHUB: "Brackets en GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Registro de Extensiones de Brackets",
    URLNAME_BRACKETS_WIKI: "Wiki de Brackets",
    URLNAME_BRACKETS_MAILING_LIST: "Lista de correo de los desarrolladores de Brackets",
    URLNAME_BRACKETS_TWITTER: "@brackets en Twitter",
    BRACKETS_CHAT_INFO_BEFORE: "Habla con los desarrolladores de Brackets por IRC en",
    BRACKETS_CHAT_FREENODE: "#brackets en Freenode",
    BRACKETS_CHAT_INFO_AFTER: ""
});
