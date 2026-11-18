/* Pruebas automáticas del sitio de Nexo IA.
   Ejecutar desde la carpeta pruebas/:  npm install && npm test  */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { JSDOM } = require('jsdom');

const raiz = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(raiz, 'assets/js/app.js'), 'utf8');

function cargarPagina() {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://nexo-ia-ec.github.io/' });
  const abiertas = [];
  dom.window.open = (url) => { abiertas.push(url); return null; };
  dom.window.eval(js);
  // jsdom aún está "cargando": disparamos DOMContentLoaded para iniciar el script como lo haría el navegador
  if (dom.window.document.readyState === 'loading') {
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  }
  return { dom, w: dom.window, d: dom.window.document, abiertas };
}

let aprobadas = 0;
const fallidas = [];
function prueba(nombre, fn) {
  try { fn(); aprobadas++; console.log('  ✓ ' + nombre); }
  catch (e) { fallidas.push(nombre); console.log('  ✗ ' + nombre + '\n      ' + e.message); }
}

console.log('Enlaces de WhatsApp');
prueba('todos los enlaces con data-mensaje apuntan al número 593992471150 con texto', () => {
  const { d } = cargarPagina();
  const enlaces = d.querySelectorAll('a[data-mensaje]');
  assert.ok(enlaces.length >= 10, 'esperaba al menos 10 enlaces, hay ' + enlaces.length);
  enlaces.forEach((a) => {
    assert.ok(a.href.startsWith('https://wa.me/593992471150?text='), a.href);
    assert.strictEqual(decodeURIComponent(a.href.split('text=')[1]), a.getAttribute('data-mensaje'));
    assert.strictEqual(a.getAttribute('target'), '_blank');
    assert.ok((a.getAttribute('rel') || '').includes('noopener'));
  });
});
prueba('ningún mensaje menciona un nombre distinto a Neytan', () => {
  const { d } = cargarPagina();
  d.querySelectorAll('a[data-mensaje]').forEach((a) => assert.ok(a.getAttribute('data-mensaje').startsWith('Hola Neytan')));
});

console.log('Selector de negocio');
prueba('al elegir Restaurante cambian las listas, el botón y su mensaje', () => {
  const { d } = cargarPagina();
  d.querySelector('[data-negocio="restaurante"]').click();
  assert.strictEqual(d.querySelector('[data-negocio="restaurante"]').getAttribute('aria-pressed'), 'true');
  assert.strictEqual(d.querySelector('[data-negocio="tienda"]').getAttribute('aria-pressed'), 'false');
  assert.strictEqual(d.querySelector('#lista-antes li span').textContent, 'Pedidos que se confunden en cocina');
  assert.strictEqual(d.querySelector('#lista-despues li span').textContent, 'Menú digital con QR y pedidos ordenados');
  const cta = d.getElementById('cta-negocio');
  assert.strictEqual(cta.querySelector('span').textContent, 'Quiero esto para mi restaurante');
  assert.ok(decodeURIComponent(cta.href).includes('tengo un restaurante'));
});
prueba('solo un tipo de negocio queda seleccionado a la vez', () => {
  const { d } = cargarPagina();
  ['consultorio', 'otro', 'tienda'].forEach((n) => {
    d.querySelector('[data-negocio="' + n + '"]').click();
    const activos = d.querySelectorAll('.selector__opcion[aria-pressed="true"]');
    assert.strictEqual(activos.length, 1);
    assert.strictEqual(activos[0].getAttribute('data-negocio'), n);
  });
});

console.log('Validación del formulario');
const { w: ventana } = cargarPagina();
const { validar, limpiarTelefono, armarMensaje } = ventana.NexoIA;
const base = { nombre: 'Ana', telefono: '0991234567', servicio: 'Automatización de tareas', mensaje: '', acepta: true };
prueba('acepta un celular de Ecuador válido (0991234567, 099 123 4567, +593991234567)', () => {
  ['0991234567', '099 123 4567', '099-123-4567', '+593991234567', '593991234567'].forEach((t) => {
    assert.strictEqual(validar({ ...base, telefono: t }).telefono, false, t);
  });
});
prueba('rechaza números inválidos', () => {
  ['', '12345', '0891234567', '09912345', '099123456789', 'abc0991234', '+59399123456'].forEach((t) => {
    assert.strictEqual(validar({ ...base, telefono: t }).telefono, true, t);
  });
});
prueba('exige nombre de al menos 2 letras y la autorización', () => {
  assert.strictEqual(validar({ ...base, nombre: ' ' }).nombre, true);
  assert.strictEqual(validar({ ...base, nombre: 'A' }).nombre, true);
  assert.strictEqual(validar({ ...base, acepta: false }).acepta, true);
  assert.strictEqual(JSON.stringify(validar(base)), JSON.stringify({ nombre: false, telefono: false, acepta: false }));
});
prueba('el mensaje armado incluye los datos y limpia el teléfono', () => {
  const m = armarMensaje({ ...base, nombre: '  Ana  ', telefono: '099 123 4567', mensaje: 'Tengo una ferretería' });
  assert.strictEqual(m, 'Hola Neytan, soy Ana.\nMi WhatsApp: 0991234567\nMe interesa: Automatización de tareas\nSobre mi negocio: Tengo una ferretería');
  assert.strictEqual(limpiarTelefono('(099) 123-4567'), '0991234567');
});

console.log('Formulario en la página');
prueba('enviar vacío muestra errores, marca aria-invalid y no abre WhatsApp', () => {
  const { d, w, abiertas } = cargarPagina();
  const form = d.getElementById('formulario-contacto');
  form.dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }));
  ['nombre', 'telefono', 'acepto'].forEach((c) => assert.strictEqual(d.getElementById('campo-' + c).getAttribute('aria-invalid'), 'true', c));
  ['nombre', 'telefono', 'acepto'].forEach((c) => assert.strictEqual(d.getElementById('error-' + c).hidden, false, c));
  assert.strictEqual(d.activeElement.id, 'campo-nombre', 'el foco debe ir al primer campo con error');
  assert.strictEqual(abiertas.length, 0);
  assert.strictEqual(d.getElementById('mensaje-exito').hidden, true);
});
prueba('enviar con datos válidos abre WhatsApp con el mensaje y muestra la confirmación', () => {
  const { d, w, abiertas } = cargarPagina();
  d.getElementById('campo-nombre').value = 'Carlos';
  d.getElementById('campo-telefono').value = '0987654321';
  d.getElementById('campo-servicio').value = 'Asistente de IA para WhatsApp';
  d.getElementById('campo-acepto').checked = true;
  d.getElementById('formulario-contacto').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }));
  assert.strictEqual(abiertas.length, 1);
  assert.ok(decodeURIComponent(abiertas[0]).includes('soy Carlos.'));
  assert.strictEqual(d.getElementById('mensaje-exito').hidden, false);
  assert.strictEqual(d.getElementById('enlace-respaldo').href, abiertas[0]);
  ['nombre', 'telefono', 'acepto'].forEach((c) => assert.strictEqual(d.getElementById('error-' + c).hidden, true, c));
});

console.log('Menú móvil');
prueba('el botón abre y cierra el menú y actualiza aria-expanded', () => {
  const { d } = cargarPagina();
  const boton = d.querySelector('.menu-boton');
  const menu = d.getElementById('menu-principal');
  boton.click();
  assert.ok(menu.classList.contains('abierto'));
  assert.strictEqual(boton.getAttribute('aria-expanded'), 'true');
  menu.querySelector('a').click();
  assert.ok(!menu.classList.contains('abierto'));
  assert.strictEqual(boton.getAttribute('aria-expanded'), 'false');
});

console.log('Estructura y accesibilidad');
prueba('hay un solo h1, idioma español y enlace para saltar al contenido', () => {
  const { d } = cargarPagina();
  assert.strictEqual(d.querySelectorAll('h1').length, 1);
  assert.strictEqual(d.documentElement.lang, 'es');
  const saltar = d.querySelector('a.saltar');
  assert.ok(saltar && d.querySelector(saltar.getAttribute('href')));
});
prueba('todas las imágenes tienen texto alternativo y tamaño declarado', () => {
  const { d } = cargarPagina();
  d.querySelectorAll('img').forEach((img) => {
    assert.ok(img.hasAttribute('alt'), img.src);
    assert.ok(img.getAttribute('width') && img.getAttribute('height'), img.src);
  });
});
prueba('cada campo del formulario tiene su etiqueta', () => {
  const { d } = cargarPagina();
  d.querySelectorAll('#formulario-contacto input, #formulario-contacto select, #formulario-contacto textarea').forEach((c) => {
    assert.ok(d.querySelector('label[for="' + c.id + '"]'), c.id);
  });
});
prueba('los enlaces internos (#) llevan a secciones que existen', () => {
  const { d } = cargarPagina();
  d.querySelectorAll('a[href^="#"]').forEach((a) => assert.ok(d.querySelector(a.getAttribute('href')), a.getAttribute('href')));
});
prueba('los archivos locales referenciados existen', () => {
  const { d } = cargarPagina();
  const refs = [];
  d.querySelectorAll('[src], link[href]').forEach((el) => {
    const v = el.getAttribute('src') || el.getAttribute('href');
    if (v && !/^(https?:|mailto:|#|data:)/.test(v)) refs.push(v);
  });
  ['privacidad.html'].forEach((r) => refs.push(r));
  refs.forEach((r) => assert.ok(fs.existsSync(path.join(raiz, r)), r));
});

console.log('\n' + aprobadas + ' pruebas aprobadas, ' + fallidas.length + ' fallidas');
if (fallidas.length) process.exit(1);
