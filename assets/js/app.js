/* Nexo IA — comportamiento de la página
   La página funciona sin JavaScript: este archivo solo agrega mejoras
   (mensajes de WhatsApp ya escritos, menú móvil, selector de negocio y validación del formulario). */
(function () {
  'use strict';

  var NUMERO_WHATSAPP = '593992471150';

  /** Arma el enlace de WhatsApp con un mensaje ya escrito. */
  function enlaceWhatsApp(texto) {
    return 'https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(texto);
  }

  /* 1) Enlaces de WhatsApp con mensaje: <a data-mensaje="..."> */
  function prepararEnlacesWhatsApp(raiz) {
    var enlaces = (raiz || document).querySelectorAll('a[data-mensaje]');
    for (var i = 0; i < enlaces.length; i++) {
      enlaces[i].href = enlaceWhatsApp(enlaces[i].getAttribute('data-mensaje'));
    }
  }

  /* 2) Menú en celulares */
  function prepararMenu() {
    var boton = document.querySelector('.menu-boton');
    var menu = document.getElementById('menu-principal');
    if (!boton || !menu) return;
    function cerrar() {
      menu.classList.remove('abierto');
      boton.setAttribute('aria-expanded', 'false');
      boton.setAttribute('aria-label', 'Abrir menú');
    }
    boton.addEventListener('click', function () {
      var abierto = menu.classList.toggle('abierto');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) cerrar();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('abierto')) {
        cerrar();
        boton.focus();
      }
    });
  }

  /* 3) Selector "¿Qué tipo de negocio tienes?" */
  var NEGOCIOS = {
    tienda: {
      antes: ['El inventario nunca cuadra', 'Cerrar caja te toma una hora', 'Te quedas sin productos sin darte cuenta'],
      despues: ['Inventario y ventas al día, en tiempo real', 'La IA te avisa qué pedir y cuándo', 'Cierre de caja automático en minutos'],
      cta: 'Quiero esto para mi tienda',
      mensaje: 'Hola Neytan, tengo una tienda y quiero saber cómo me puede ayudar Nexo IA.'
    },
    consultorio: {
      antes: ['Citas cruzadas y pacientes que no llegan', 'WhatsApp lleno de las mismas preguntas', 'Historias y datos en papel'],
      despues: ['Asistente que agenda citas por WhatsApp las 24 horas', 'Recordatorios automáticos para cada paciente', 'El historial de cada paciente en un solo lugar'],
      cta: 'Quiero esto para mi consultorio',
      mensaje: 'Hola Neytan, tengo un consultorio y quiero saber cómo me puede ayudar Nexo IA.'
    },
    restaurante: {
      antes: ['Pedidos que se confunden en cocina', 'No sabes qué plato te deja más ganancia', 'Mensajes sin responder en horas pico'],
      despues: ['Menú digital con QR y pedidos ordenados', 'Reportes de los platos que más venden', 'Asistente que toma pedidos por WhatsApp'],
      cta: 'Quiero esto para mi restaurante',
      mensaje: 'Hola Neytan, tengo un restaurante y quiero saber cómo me puede ayudar Nexo IA.'
    },
    otro: {
      antes: ['Tareas repetitivas que se comen tu día', 'Datos regados en Excel, cuadernos y chats', 'Decisiones sin números claros'],
      despues: ['Automatizamos lo repetitivo con IA', 'Toda tu información en un solo sistema', 'Paneles que te dicen qué hacer'],
      cta: 'Cuéntanos de tu negocio',
      mensaje: 'Hola Neytan, quiero saber cómo Nexo IA puede ayudar a mi negocio.'
    }
  };

  function llenarLista(lista, textos) {
    var items = lista.querySelectorAll('li span');
    for (var i = 0; i < items.length && i < textos.length; i++) {
      items[i].textContent = textos[i];
    }
  }

  function prepararSelector() {
    var opciones = document.querySelectorAll('.selector__opcion');
    var listaAntes = document.getElementById('lista-antes');
    var listaDespues = document.getElementById('lista-despues');
    var cta = document.getElementById('cta-negocio');
    if (!opciones.length || !listaAntes || !listaDespues || !cta) return;

    function elegir(clave) {
      var datos = NEGOCIOS[clave];
      if (!datos) return;
      for (var i = 0; i < opciones.length; i++) {
        opciones[i].setAttribute('aria-pressed', opciones[i].getAttribute('data-negocio') === clave ? 'true' : 'false');
      }
      llenarLista(listaAntes, datos.antes);
      llenarLista(listaDespues, datos.despues);
      cta.querySelector('span').textContent = datos.cta;
      cta.setAttribute('data-mensaje', datos.mensaje);
      cta.href = enlaceWhatsApp(datos.mensaje);
    }

    for (var i = 0; i < opciones.length; i++) {
      opciones[i].addEventListener('click', function () {
        elegir(this.getAttribute('data-negocio'));
      });
    }
  }

  /* 4) Formulario de contacto: valida y envía la solicitud por WhatsApp (no guarda datos) */
  var PATRON_CELULAR = /^(09\d{8}|\+?5939\d{8})$/;

  function limpiarTelefono(valor) {
    return valor.replace(/[\s()-]/g, '');
  }

  function validar(datos) {
    return {
      nombre: datos.nombre.trim().length < 2,
      telefono: !PATRON_CELULAR.test(limpiarTelefono(datos.telefono)),
      acepta: !datos.acepta
    };
  }

  function armarMensaje(datos) {
    var texto = 'Hola Neytan, soy ' + datos.nombre.trim() + '.' +
      '\nMi WhatsApp: ' + limpiarTelefono(datos.telefono) +
      '\nMe interesa: ' + datos.servicio;
    if (datos.mensaje.trim()) texto += '\nSobre mi negocio: ' + datos.mensaje.trim();
    return texto;
  }

  function prepararFormulario() {
    var form = document.getElementById('formulario-contacto');
    if (!form) return;
    var campos = {
      nombre: document.getElementById('campo-nombre'),
      telefono: document.getElementById('campo-telefono'),
      acepta: document.getElementById('campo-acepto')
    };
    var errores = {
      nombre: document.getElementById('error-nombre'),
      telefono: document.getElementById('error-telefono'),
      acepta: document.getElementById('error-acepto')
    };
    var exito = document.getElementById('mensaje-exito');
    var respaldo = document.getElementById('enlace-respaldo');

    function mostrarError(clave, hayError) {
      campos[clave].setAttribute('aria-invalid', hayError ? 'true' : 'false');
      errores[clave].hidden = !hayError;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var datos = {
        nombre: campos.nombre.value,
        telefono: campos.telefono.value,
        servicio: document.getElementById('campo-servicio').value,
        mensaje: document.getElementById('campo-mensaje').value,
        acepta: campos.acepta.checked
      };
      var resultado = validar(datos);
      var orden = ['nombre', 'telefono', 'acepta'];
      var primero = null;
      for (var i = 0; i < orden.length; i++) {
        mostrarError(orden[i], resultado[orden[i]]);
        if (resultado[orden[i]] && !primero) primero = campos[orden[i]];
      }
      if (primero) {
        exito.hidden = true;
        primero.focus();
        return;
      }
      var url = enlaceWhatsApp(armarMensaje(datos));
      respaldo.href = url;
      exito.hidden = false;
      window.open(url, '_blank', 'noopener');
    });

    // Al corregir un campo, se quita su error
    ['nombre', 'telefono'].forEach(function (clave) {
      campos[clave].addEventListener('input', function () {
        if (campos[clave].getAttribute('aria-invalid') === 'true') {
          var datos = { nombre: campos.nombre.value, telefono: campos.telefono.value, acepta: campos.acepta.checked };
          mostrarError(clave, validar(datos)[clave]);
        }
      });
    });
    campos.acepta.addEventListener('change', function () {
      if (campos.acepta.checked) mostrarError('acepta', false);
    });
  }

  // Exponer funciones puras para las pruebas automáticas
  window.NexoIA = { enlaceWhatsApp: enlaceWhatsApp, validar: validar, armarMensaje: armarMensaje, limpiarTelefono: limpiarTelefono };

  function iniciar() {
    prepararEnlacesWhatsApp();
    prepararMenu();
    prepararSelector();
    prepararFormulario();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
