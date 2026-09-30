# ☁️ Configuración de Cloudflare R2 (álbum de fotos)

Guía para activar el almacenamiento de fotos en Cloudflare R2. Si algo falta, la app
**sigue funcionando**: guarda la foto como data URL base64 dentro de PostgreSQL
(`Foto.url`) con un tope de 3 MB. Con R2 activo, en la base de datos solo queda la URL.

## 1. Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `R2_ACCOUNT_ID` | Sí* | ID de la cuenta (32 hex). Con él se deriva el endpoint `https://<id>.r2.cloudflarestorage.com` |
| `R2_ENDPOINT` | No | Endpoint explícito (tiene prioridad sobre `R2_ACCOUNT_ID`) |
| `R2_ACCESS_KEY_ID` | Sí | Access Key ID del token R2 (32 hex) |
| `R2_SECRET_ACCESS_KEY` | Sí | Secret Access Key del token R2 (64 hex) |
| `R2_BUCKET` | Sí | Nombre del bucket (en este proyecto: `mibautizo-recuerdos`) |
| `R2_PUBLIC_URL` | Sí | URL pública **sin barra final** (ej. `https://pub-xxxx.r2.dev` o dominio propio) |
| `R2_PREFIX` | No | Carpeta raíz dentro del bucket (por defecto `imagenes`) |

Se configuran en `backend/.env` (local) y en las variables de entorno de Railway (producción).

## 2. Pasos en Cloudflare

1. **Bucket**: Dash → R2 → *Create bucket* (ej. `mibautizo-recuerdos`).
2. **Token**: R2 → *Manage API Tokens* → *Create API token* → permiso **Object Read & Write**
   y en *Apply to specific buckets only* seleccionar el bucket del paso 1.
   ⚠️ Si el token se limita a otro bucket, toda operación responde `403 AccessDenied`.
   Al crearlo, Cloudflare muestra **una sola vez** el Access Key ID y el Secret Access Key:
   cópialos y pásalos a la app con `npm run r2:activar` (ver §3), que además verifica.
3. **Acceso público**: bucket → *Settings* → **Public Development URL** → **Enable** →
   en el diálogo *Allow Public Access?* escribir `allow` y confirmar. La tarjeta pasa a
   mostrar `Public URL Access: Allowed` y la **Public Bucket URL**
   (`https://pub-<hash>.r2.dev`) → ese valor va en `R2_PUBLIC_URL` (sin barra final).
   ⚠️ Es la antigua opción "R2.dev subdomain": en el panel nuevo **ya no existe un menú
   "Public access"**, la URL pública es esa tarjeta. Tiene rate-limit y es *non-production*;
   para producción Cloudflare recomienda un **Custom Domain** (requiere el DNS en Cloudflare
   y **no** debe crearse un CNAME apuntando al `pub-….r2.dev`).

## 3. Verificación

Con las claves del token recién copiadas, un solo comando las escribe en el `.env` y verifica
todo (subir, leer, borrar y que la URL pública sirva el archivo):

```bash
cd backend
npm run r2:activar -- <access-key-id> <secret-access-key>
# opciones: --bucket <nombre>  --public-url https://pub-xxxx.r2.dev  --prefix <carpeta>
#           --dry-run (no escribe)  --env <ruta>  --sin-diagnostico
```

Solo el diagnóstico (sin tocar el `.env`):

```bash
cd backend
npm run diagnose:r2
```

Comprueba sin dejar basura en el bucket: variables completas, `PutObject`/`HeadObject`/
`DeleteObject`, `ListBuckets` y que la URL pública realmente sirva el archivo. Termina con
`exitCode 0` cuando todo está correcto y con `exitCode 1` + detalle del problema si algo
falla (por ejemplo `403 AccessDenied` cuando el token no incluye ese bucket).

Admite overrides por argumento, sin tocar el `.env` (para comparar buckets, ver §4):

```bash
npm run diagnose:r2 -- --bucket unpresente-fotos --public-url https://pub-xxxx.r2.dev --prefix bautizo
```

Verificación rápida desde el propio panel: en **`/admin/fotos`** cada foto muestra un
indicador *`· R2`* (guardada en el bucket) o *`· BD`* (base64 en la base de datos), así que
basta con subir una foto de prueba y mirar dónde quedó.

También se puede confirmar desde la API en producción:

```bash
curl https://<backend>/api/health
# → {"status":"ok",...,"storage":"r2"}   (o "base64" si R2 no está configurado)
```

## 4. Reutilizar una cuenta o bucket que ya tienes (ej. UnPresente / MiCelebra)

No hace falta crear una cuenta ni un bucket nuevos: la **misma cuenta de Cloudflare**
puede tener varios buckets y el proyecto puede reutilizar uno existente.

**Estado comprobado el 30-09-2026** con las claves que están en `backend/.env`:

| Bucket | ¿El token actual puede subir/borrar? |
| --- | --- |
| `unpresente-fotos` | ✅ sí (bucket de UnPresente / MiCelebra) |
| `unpresente-recuerdos` | ✅ sí |
| `mibautizo-recuerdos` | ❌ 403 `AccessDenied` (el token no lo incluye) |

Los tokens de R2 son **por bucket**: un token creado para los buckets de UnPresente no
sirve para `mibautizo-recuerdos` (responde `403 AccessDenied`, con firma válida). Por eso,
para reutilizar lo que ya existe hay dos caminos:

**Camino A — reutilizar el bucket público existente (lo más rápido):**

**Comprobado el 30-09-2026:** `unpresente-fotos` existe, está **vacío** y el token actual
**sí** escribe/lee/borra en él (`✅ PutObject` / `✅ HeadObject` / `✅ DeleteObject`), pero
**su URL pública no está localizada**: el dominio que tiene previsto MiCelebra
(`fotos.unpresente.cl`, `R2_URL_IMAGENES`) **no sirve R2** — resuelve a IPs de Vercel y
responde `SSL_ERROR_SYSCALL` (no hay sitio conectado para ese host) — así que hay que
habilitar y copiar el *Public Development URL* de ese bucket. Sin una URL pública que
funcione las fotos se suben pero **no se ven** (peor que base64, que al menos siempre se
muestra). Además ese bucket es el que MiCelebra reserva como `R2_BUCKET_IMAGENES`, por lo
que MiBautizo y MiCelebra compartirían bucket (se aísla con `R2_PREFIX=bautizo`, que evita
colisiones de claves, pero no una limpieza futura del bucket).

```bash
R2_BUCKET=unpresente-fotos
R2_PREFIX=bautizo            # claves: bautizo/fotos/<fecha>/<hex>.jpg (no choca con UnPresente)
R2_PUBLIC_URL=<URL pública de unpresente-fotos>
```

La URL pública sale de *bucket → Settings → **Public Development URL*** → *Enable* →
`allow` (ej. `https://pub-xxxx.r2.dev`) o del *Custom Domain* si lo configuraste
(`https://fotos.unpresente.cl`, que al 30-09-2026 **no sirve**: resuelve a Vercel y da
`SSL_ERROR_SYSCALL`, así que ese valor todavía no sirve). Comprueba el cambio sin tocar
el `.env` con:

```bash
npm run diagnose:r2 -- --bucket unpresente-fotos --public-url https://pub-xxxx.r2.dev --prefix bautizo
```

**Camino B — bucket propio dentro de la misma cuenta**: `mibautizo-recuerdos` ya está
creado y su URL pública ya funciona (`https://pub-2f5965b2a1c644b98f0fb181a2bfae49.r2.dev`,
ver §6); solo falta que el token incluya ese bucket, ya sea **añadiéndolo al token que ya
existe** (R2 → *Manage API Tokens* → editar el token) o creando uno nuevo (*Object Read &
Write*, aplicado solo a ese bucket). Se usa el mismo `R2_ACCOUNT_ID` que ya está configurado.


En ambos casos se verifica con `npm run diagnose:r2` antes de desplegar.

> ⚠️ `/api/health` informa `"storage":"r2"` solo con las 5 variables completas, pero **no**
> comprueba permisos: si el token está mal, las fotos caerán silenciosamente a base64 con el
> aviso `⚠️ Error subiendo foto a R2…` en los logs. El diagnóstico sí valida subir/leer/borrar.

## 5. Dónde quedan las fotos

- Key generada por `generarKey()` en `src/lib/r2.ts`: `<R2_PREFIX>/fotos/<AAAA-MM-DD>/<hex>.jpg`
  (ej. `imagenes/fotos/2026-09-30/b8f1cbcfda39b478c32001b6.jpg`).
- Se suben con `ContentType` correcto y `Cache-Control: public, max-age=31536000, immutable`.
- Al eliminar una foto desde `/admin/fotos` se borra también el objeto del bucket
  (solo si la URL empieza por `R2_PUBLIC_URL/`).
- Las fotos que ya estén guardadas como base64 siguen mostrándose igual (no se migran solas).

## 6. Valores de este proyecto (MiBautizo)

**✅ Activado y verificado el 30-09-2026** (`npm run diagnose:r2` → `🎉 R2 listo`, `exit 0`, y
`/api/health` → `"storage":"r2"`). El bucket y la URL pública están operativos; las claves
`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` **solo** viven en `backend/.env` y en Railway,
nunca en el repositorio:

| Dato | Valor |
| --- | --- |
| `R2_ACCOUNT_ID` | `f12d8cf865cafe76a1c40fd48c7d677a` |
| `R2_ENDPOINT` | `https://f12d8cf865cafe76a1c40fd48c7d677a.r2.cloudflarestorage.com` |
| `R2_BUCKET` | `mibautizo-recuerdos` (ENAM) |
| `R2_PUBLIC_URL` | `https://pub-2f5965b2a1c644b98f0fb181a2bfae49.r2.dev` (el host resuelve y responde desde el edge de Cloudflare; el objeto real lo valida `npm run diagnose:r2`) |
| `R2_PREFIX` | `imagenes` → claves `imagenes/fotos/<AAAA-MM-DD>/<hex>.jpg` |

La pieza que faltaba era el **token S3**: el de UnPresente respondía `403 AccessDenied` (no era
un error de firma sino de alcance, porque los tokens de R2 son por bucket). **Resuelto**:
se amplió ese mismo token para incluir `mibautizo-recuerdos` y el diagnóstico pasó a verde.
Como es un token compartido con UnPresente / MiCelebra, rotarlo obliga a actualizar las claves
en los tres proyectos. La alternativa de reutilizar `unpresente-fotos` está analizada en §4
(sigue sin URL pública propia, así que ahora no aporta ventaja).

