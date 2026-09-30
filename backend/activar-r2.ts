/**
 * Activación asistida de Cloudflare R2.
 *
 * Toma las claves del token R2 (las que se copian del panel de Cloudflare),
 * las escribe en `backend/.env` sin tocar el resto del archivo y luego corre
 * `npm run diagnose:r2` para comprobar de verdad que se puede subir, leer,
 * borrar y que la URL pública sirve el archivo. Termina con el mismo código de
 * salida del diagnóstico (`0` = listo).
 *
 * Uso:
 *   npm run r2:activar -- <access-key-id> <secret-access-key>
 *   npm run r2:activar -- <access-key-id> <secret-access-key> --public-url https://pub-xxxx.r2.dev
 *   npm run r2:activar -- <id> <secret> --bucket mibautizo-recuerdos --prefix imagenes
 *
 * Opciones:
 *   --bucket <nombre>      cambia R2_BUCKET
 *   --public-url <url>     cambia R2_PUBLIC_URL
 *   --prefix <carpeta>     cambia R2_PREFIX
 *   --env <ruta>           archivo .env a modificar (por defecto backend/.env)
 *   --dry-run              muestra qué cambiaría sin escribir nada
 *   --sin-diagnostico      solo escribe las claves, no verifica
 *   --forzar               acepta claves con formato inesperado (no 32/64 hex)
 *
 * También se pueden pasar las claves por variables de entorno:
 *   R2_NUEVO_ACCESS_KEY_ID / R2_NUEVO_SECRET_ACCESS_KEY
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function argValor(nombre: string): string {
  const i = process.argv.indexOf(nombre);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1].trim();
  const conIgual = process.argv.find((a) => a.startsWith(`${nombre}=`));
  return conIgual ? conIgual.slice(nombre.length + 1).trim() : '';
}

const tieneFlag = (nombre: string) => process.argv.includes(nombre);

/** Argumentos posicionales, ignorando los flags y los valores de los flags. */
function posicionales(): string[] {
  const flagsConValor = ['--bucket', '--public-url', '--prefix', '--env'];
  const salida: string[] = [];
  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (arg.startsWith('-')) {
      if (flagsConValor.includes(arg)) i += 1; // saltar su valor
      continue;
    }
    if (flagsConValor.some((f) => arg.startsWith(`${f}=`))) continue;
    salida.push(arg.trim());
  }
  return salida;
}

const mala = (msg: string) => {
  console.log(`❌ ${msg}`);
  process.exitCode = 1;
};

const pos = posicionales();
const nuevoId = (pos[0] || process.env.R2_NUEVO_ACCESS_KEY_ID || '').trim();
const nuevoSecret = (pos[1] || process.env.R2_NUEVO_SECRET_ACCESS_KEY || '').trim();
const nuevoBucket = argValor('--bucket');
const nuevaUrl = argValor('--public-url').replace(/\/+$/, '');
const nuevoPrefijo = argValor('--prefix');
const rutaEnv = argValor('--env') || path.join(__dirname, '.env');
const dryRun = tieneFlag('--dry-run');
const sinDiagnostico = tieneFlag('--sin-diagnostico');
const forzar = tieneFlag('--forzar');

/** Oculta todo menos los primeros 4 caracteres. */
const ocultar = (valor: string) => `${valor.slice(0, 4)}…(${valor.length})`;

interface Cambio {
  clave: string;
  valor: string;
  actual: string;
}

/** Valor actual de una clave en el .env (sin comillas), o '' si no está definida. */
function valorActual(contenido: string, clave: string): string {
  const linea = contenido.split(/\r?\n/).find((l) => l.trim().startsWith(`${clave}=`));
  if (!linea) return '';
  return linea
    .slice(linea.indexOf('=') + 1)
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
}

/** Reemplaza la primera línea `CLAVE=`; si no existe, la agrega al final. */
function aplicarCambio(contenido: string, clave: string, valor: string): string {
  const lineas = contenido.split(/\r?\n/);
  const i = lineas.findIndex((l) => l.trim().startsWith(`${clave}=`));
  if (i !== -1) {
    lineas[i] = `${clave}=${valor}`;
    return lineas.join('\n');
  }
  const sufijo = contenido.endsWith('\n') ? '' : '\n';
  return `${contenido}${sufijo}${clave}=${valor}\n`;
}


function main() {
  console.log('='.repeat(60));
  console.log('🔐 Activar Cloudflare R2 en MiBautizo');
  console.log('='.repeat(60));

  if (!nuevoId || !nuevoSecret) {
    mala('Faltan las claves del token R2.');
    console.log('');
    console.log('   npm run r2:activar -- <access-key-id> <secret-access-key>');
    console.log('');
    console.log('   Se copian en Cloudflare → R2 → Manage R2 API Tokens → Create API Token');
    console.log('   (permiso "Object Read & Write" + "Apply to specific buckets only").');
    console.log('   El Secret Access Key solo se muestra una vez, al crear el token.');
    return;
  }

  const avisos: string[] = [];
  if (!/^[0-9a-f]{32}$/i.test(nuevoId)) {
    avisos.push(`El Access Key ID no tiene el formato habitual (32 hex): ${ocultar(nuevoId)}`);
  }
  if (!/^[0-9a-f]{64}$/i.test(nuevoSecret)) {
    avisos.push(
      `El Secret Access Key no tiene el formato habitual (64 hex): ${ocultar(nuevoSecret)}`
    );
  }
  if (avisos.length > 0) {
    avisos.forEach((a) => console.log(`⚠️  ${a}`));
    if (!forzar) {
      mala('Revisa que copiaste los valores completos (o usa --forzar si estás seguro).');
      return;
    }
  }

  if (!fs.existsSync(rutaEnv)) {
    mala(`No existe el archivo ${rutaEnv}`);
    return;
  }
  const original = fs.readFileSync(rutaEnv, 'utf8');

  const cambios: Cambio[] = [
    {
      clave: 'R2_ACCESS_KEY_ID',
      valor: nuevoId,
      actual: valorActual(original, 'R2_ACCESS_KEY_ID'),
    },
    {
      clave: 'R2_SECRET_ACCESS_KEY',
      valor: nuevoSecret,
      actual: valorActual(original, 'R2_SECRET_ACCESS_KEY'),
    },
  ];
  for (const [clave, valor] of [
    ['R2_BUCKET', nuevoBucket],
    ['R2_PUBLIC_URL', nuevaUrl],
    ['R2_PREFIX', nuevoPrefijo],
  ] as const) {
    if (valor) cambios.push({ clave, valor, actual: valorActual(original, clave) });
  }

  console.log(`📄 Archivo: ${rutaEnv}`);
  console.log('');
  let contenido = original;
  let escritos = 0;
  for (const cambio of cambios) {
    const mostrar =
      cambio.clave === 'R2_SECRET_ACCESS_KEY' ? ocultar(cambio.valor) : cambio.valor || '(vacío)';
    if (cambio.actual === cambio.valor) {
      console.log(`▶️  ${cambio.clave}=${mostrar}  (sin cambios)`);
      continue;
    }
    console.log(`✏️  ${cambio.clave}: ${cambio.actual || '(vacío)'} → ${mostrar}`);
    contenido = aplicarCambio(contenido, cambio.clave, cambio.valor);
    escritos += 1;
  }

  if (escritos === 0) {
    console.log('');
    console.log('✅ El .env ya tenía esos valores: no hay nada que escribir.');
  } else if (dryRun) {
    console.log('');
    console.log(`🧪 --dry-run: se escribirían ${escritos} valor(es). No se tocó el archivo.`);
  } else {
    fs.writeFileSync(rutaEnv, contenido, 'utf8');
    console.log('');
    console.log(`✅ ${escritos} valor(es) escritos en el .env (el resto del archivo intacto).`);
  }

  if (sinDiagnostico || dryRun) {
    console.log('');
    console.log('ℹ️  Verificación pendiente: npm run diagnose:r2');
    return;
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('🧪 Verificando el bucket (subir / leer / borrar / URL pública)');
  console.log('='.repeat(60));
  const resultado = spawnSync('npm', ['run', 'diagnose:r2'], { stdio: 'inherit', cwd: __dirname });
  process.exitCode = resultado.status ?? 1;
}

try {
  main();
} catch (error: any) {
  mala(error?.message || String(error));
}
