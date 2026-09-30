/**
 * Script de diagnóstico - Verificar configuración de Cloudflare R2
 *
 * Comprueba, sin dejar basura en el bucket:
 *   1. Que las variables R2_* estén completas
 *   2. Que las credenciales puedan escribir, leer y borrar objetos
 *   3. Que la URL pública (R2_PUBLIC_URL / R2.dev) sirva los objetos
 *
 * Uso: npm run diagnose:r2   (desde backend/)
 *
 * Admite overrides por argumento, para probar otro bucket/URL/prefix sin tocar el .env
 * (útil al reutilizar un bucket existente, ver R2_CONFIG.md §4):
 *   npm run diagnose:r2 -- --bucket unpresente-fotos \
 *                          --public-url https://pub-xxxx.r2.dev \
 *                          --prefix bautizo
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env manualmente (igual que diagnose-gmail.ts)
dotenv.config({ path: path.join(__dirname, '.env') });

const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim();

/** Lee un argumento del tipo `--flag valor` o `--flag=valor`. */
function argValor(nombre: string): string {
  const i = process.argv.indexOf(nombre);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1].trim();
  const conIgual = process.argv.find((a) => a.startsWith(`${nombre}=`));
  return conIgual ? conIgual.slice(nombre.length + 1).trim() : '';
}

// Permiten probar otro bucket/URL/prefix sin tocar el .env:
//   npm run diagnose:r2 -- --bucket unpresente-fotos --public-url https://pub-xxxx.r2.dev
const argBucket = argValor('--bucket');
const argPublicUrl = argValor('--public-url').replace(/\/+$/, '');
const argPrefijo = argValor('--prefix');

const bucket = argBucket || (process.env.R2_BUCKET || '').trim();
const publicUrl = (argPublicUrl || (process.env.R2_PUBLIC_URL || '').trim()).replace(/\/+$/, '');
const prefijo = (argPrefijo || (process.env.R2_PREFIX || 'imagenes')).trim();
const endpoint = (
  process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '')
)
  .trim()
  .replace(/\/+$/, '');

let fallos = 0;

const ok = (msg: string) => console.log(`✅ ${msg}`);
const aviso = (msg: string) => console.log(`⚠️  ${msg}`);
const info = (msg: string) => console.log(`   ${msg}`);
function mal(msg: string) {
  fallos += 1;
  console.log(`❌ ${msg}`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('📋 Configuración de Cloudflare R2');
  console.log('='.repeat(60));
  info(`R2_ACCOUNT_ID:        ${accountId ? `${accountId.slice(0, 6)}…${accountId.slice(-4)} (${accountId.length} chars)` : '(vacío)'}`);
  info(`R2_ACCESS_KEY_ID:     ${accessKeyId ? `${accessKeyId.slice(0, 4)}… (${accessKeyId.length} chars)` : '(vacío)'}`);
  info(`R2_SECRET_ACCESS_KEY: ${secretAccessKey ? `(${secretAccessKey.length} chars)` : '(vacío)'}`);
  info(`R2_BUCKET:            ${bucket || '(vacío)'}${argBucket ? '   ← --bucket' : ''}`);
  info(`R2_PUBLIC_URL:        ${publicUrl || '(vacía)'}${argPublicUrl ? '   ← --public-url' : ''}`);
  info(`R2_PREFIX:            ${prefijo}${argPrefijo ? '   ← --prefix' : ''}`);
  info(`endpoint:             ${endpoint || '(no se pudo derivar)'}`);
  console.log('');

  if (!endpoint) mal('Falta R2_ACCOUNT_ID (o R2_ENDPOINT): no se puede construir el endpoint S3.');
  if (!accessKeyId || !secretAccessKey) mal('Faltan R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY.');
  if (!bucket) mal('Falta R2_BUCKET: las fotos se guardarán como base64 en PostgreSQL.');
  if (!publicUrl) mal('Falta R2_PUBLIC_URL: hasta completarla el almacenamiento será base64 en la BD.');

  if (fallos > 0 && (!endpoint || !accessKeyId || !secretAccessKey || !bucket)) {
    console.log('\n' + '='.repeat(60));
    console.log('🧭 Cómo completar la configuración');
    console.log('='.repeat(60));
    info('1. Cloudflare Dash → R2 → Create bucket (ej. mibautizo-recuerdos)');
    info('2. R2 → Manage API Tokens → Create API token con permiso "Object Read & Write"');
    info('   y el bucket correcto en "Apply to specific buckets only"');
    info('3. Bucket → Settings → Public access → habilitar el subdominio R2.dev');
    info('4. Poner las variables en backend/.env y en Railway, y redeployar');
    console.log('');
    process.exitCode = 1;
    return;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  console.log('='.repeat(60));
  console.log('🧪 Probando permisos del token');
  console.log('='.repeat(60));

  try {
    const lista = await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 3 }));
    const objetos = (lista.Contents || []).map((o) => o.Key).join(', ');
    ok(`ListObjectsV2 (listar): OK${objetos ? ` → ${objetos}` : ' → bucket vacío'}`);
  } catch (error: any) {
    aviso(
      `ListObjectsV2 (listar) denegado: ${error?.name}${
        error?.$metadata?.httpStatusCode ? ` | HTTP ${error.$metadata.httpStatusCode}` : ''
      }`
    );
  }

  const fecha = new Date().toISOString().slice(0, 10);
  const clave = `${prefijo}/_diagnostico/${Date.now().toString(16)}.txt`;
  const cuerpo = Buffer.from(`prueba mibautizo ${new Date().toISOString()}`);
  let subido = false;

  try {
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: clave, Body: cuerpo, ContentType: 'text/plain' })
    );
    subido = true;
    ok(`PutObject (subir): OK → ${bucket}/${clave}`);
  } catch (error: any) {
    mal(
      `PutObject (subir) falló: ${error?.name} ${error?.message || ''}${
        error?.$metadata?.httpStatusCode ? ` | HTTP ${error.$metadata.httpStatusCode}` : ''
      }`
    );
    if (error?.name === 'AccessDenied') {
      info('El token existe (la firma es válida) pero NO incluye este bucket.');
      info(`Crea un token nuevo con "Apply to specific buckets only" → ${bucket}`);
    }
  }

  if (subido) {
    try {
      const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: clave }));
      ok(`HeadObject (leer): OK → ${head.ContentLength} bytes`);
    } catch (error: any) {
      aviso(`HeadObject (leer) denegado: ${error?.name} | HTTP ${error?.$metadata?.httpStatusCode}`);
    }

    // Comprobación end-to-end de la URL pública (lo que verá el invitado)
    if (!publicUrl) {
      aviso('Sin R2_PUBLIC_URL no se puede comprobar el acceso público a la imagen');
    } else {
      const urlPublica = `${publicUrl}/${clave}`;
      try {
        const respuesta = await fetch(urlPublica);
        if (respuesta.ok) {
          ok(`URL pública responde ${respuesta.status} → ${urlPublica}`);
          info(`Contenido: ${(await respuesta.text()).slice(0, 60)}`);
        } else {
          mal(
            `La URL pública respondió ${respuesta.status}. ¿Está habilitado "Public access" (R2.dev) en el bucket?`
          );
          info(`Probado: ${urlPublica}`);
        }
      } catch (error: any) {
        mal(`No se pudo acceder a la URL pública: ${error?.message}`);
        info(`Probado: ${urlPublica}`);
      }
    }

    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: clave }));
      ok('DeleteObject (borrar): OK → objeto de prueba eliminado (bucket limpio)');
    } catch (error: any) {
      mal(`DeleteObject (borrar) falló: ${error?.name} | HTTP ${error?.$metadata?.httpStatusCode}`);
      aviso(`Quedó un objeto de prueba en el bucket: ${clave} (bórralo a mano)`);
    }
  }

  try {
    const buckets = await client.send(new ListBucketsCommand({}));
    ok(`ListBuckets: OK → ${(buckets.Buckets || []).map((b) => b.Name).join(', ') || '(ninguno)'}`);
  } catch {
    info('ListBuckets denegado (normal en tokens limitados a un bucket: no afecta a la app)');
  }

  console.log('\n' + '='.repeat(60));
  if (fallos === 0) {
    console.log('🎉 R2 listo: las fotos irán al bucket y /api/health dirá "storage":"r2"');
    console.log(`📁 Ejemplo de destino: ${publicUrl}/${prefijo}/fotos/${fecha}/<aleatorio>.jpg`);
  } else {
    console.log(`⚠️  Hay ${fallos} problema(s) de configuración (ver arriba)`);
    process.exitCode = 1;
  }
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('\n❌ Error inesperado:', error);
  process.exitCode = 1;
});
