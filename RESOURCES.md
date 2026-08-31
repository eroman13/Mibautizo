# 📚 Recursos Adicionales

Colección de enlaces útiles, tutoriales y referencias para el proyecto.

---

## 📖 Documentación Oficial

### Mercado Pago

| Recurso | URL | Descripción |
|---------|-----|-------------|
| **Panel de Desarrolladores** | https://www.mercadopago.cl/developers | Dashboard principal |
| **Credenciales** | https://www.mercadopago.cl/developers/panel/credentials | Obtener Access Token y Public Key |
| **Webhooks** | https://www.mercadopago.cl/developers/panel/webhooks | Configurar notificaciones |
| **Checkout Pro** | https://www.mercadopago.cl/developers/es/docs/checkout-pro/landing | Documentación completa |
| **Tarjetas de Prueba** | https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/test-cards | Tarjetas para testing |
| **API Reference** | https://www.mercadopago.cl/developers/es/reference | Endpoints y parámetros |
| **SDKs** | https://www.mercadopago.cl/developers/es/docs/sdks-library/landing | SDKs oficiales |
| **Comunidad** | https://www.mercadopago.cl/developers/es/support | Foro de soporte |

### Prisma

| Recurso | URL | Descripción |
|---------|-----|-------------|
| **Documentación** | https://www.prisma.io/docs | Guía completa |
| **Schema Reference** | https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference | Sintaxis del schema |
| **Client API** | https://www.prisma.io/docs/reference/api-reference/prisma-client-reference | Métodos del cliente |
| **Migrate** | https://www.prisma.io/docs/concepts/components/prisma-migrate | Gestión de migraciones |
| **Studio** | https://www.prisma.io/studio | GUI para base de datos |
| **Ejemplos** | https://github.com/prisma/prisma-examples | Proyectos de ejemplo |

### React + Vite

| Recurso | URL | Descripción |
|---------|-----|-------------|
| **React Docs** | https://react.dev | Documentación oficial |
| **Vite Guide** | https://vite.dev/guide | Guía de Vite |
| **React Router** | https://reactrouter.com | Routing en React |
| **Tailwind CSS** | https://tailwindcss.com/docs | Estilos utility-first |
| **TypeScript** | https://www.typescriptlang.org/docs | TypeScript handbook |

### Node.js + Express

| Recurso | URL | Descripción |
|---------|-----|-------------|
| **Node.js Docs** | https://nodejs.org/docs | Documentación de Node |
| **Express Guide** | https://expressjs.com/en/guide/routing.html | Guía de Express |
| **TypeScript Node** | https://github.com/TypeStrong/ts-node | Ejecutar TS en Node |
| **tsx** | https://github.com/esbuild-kit/tsx | Ejecutor TypeScript |

---

## 🎓 Tutoriales y Guías

### Integración con Mercado Pago

- **Checkout Pro en Node.js**
  - https://www.mercadopago.cl/developers/es/docs/checkout-pro/integrate-checkout-pro/web
  - Tutorial oficial paso a paso

- **Webhooks con Node.js**
  - https://www.mercadopago.cl/developers/es/docs/your-integrations/notifications/webhooks
  - Configuración de notificaciones

- **Gestión de Pagos en Cuotas**
  - https://www.mercadopago.cl/developers/es/docs/checkout-pro/checkout-customization/preferences/payment-methods
  - Configurar métodos de pago

### Prisma Avanzado

- **Relaciones y Foreign Keys**
  - https://www.prisma.io/docs/concepts/components/prisma-schema/relations
  - Guía de relaciones

- **Seeding**
  - https://www.prisma.io/docs/guides/migrate/seed-database
  - Poblar BD con datos iniciales

- **Migraciones en Producción**
  - https://www.prisma.io/docs/guides/migrate/production-troubleshooting
  - Mejores prácticas

### React Patterns

- **Context API**
  - https://react.dev/reference/react/createContext
  - Estado global sin Redux

- **Custom Hooks**
  - https://react.dev/learn/reusing-logic-with-custom-hooks
  - Reutilizar lógica

- **Error Boundaries**
  - https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
  - Manejo de errores

---

## 🛠️ Herramientas de Desarrollo

### Testing y Debugging

| Herramienta | Instalación | Uso |
|-------------|-------------|-----|
| **Postman** | https://www.postman.com/downloads | Probar APIs REST |
| **Insomnia** | https://insomnia.rest/download | Alternativa a Postman |
| **ngrok** | `brew install ngrok` | Túnel HTTPS para webhooks |
| **Prisma Studio** | `npx prisma studio` | GUI para base de datos |
| **React DevTools** | Chrome Extension | Debuggear componentes React |

### Deployment

| Plataforma | URL | Plan Gratuito |
|------------|-----|---------------|
| **Vercel** | https://vercel.com | ✅ Sí (100GB/mes) |
| **Netlify** | https://netlify.com | ✅ Sí (100GB/mes) |
| **Railway** | https://railway.app | ✅ $5 crédito/mes |
| **Render** | https://render.com | ✅ Sí (750h/mes) |
| **Fly.io** | https://fly.io | ✅ $5 crédito/mes |

### Monitoreo y Analytics

| Servicio | URL | Uso |
|----------|-----|-----|
| **Sentry** | https://sentry.io | Error tracking |
| **LogRocket** | https://logrocket.com | Session replay |
| **Google Analytics** | https://analytics.google.com | Analytics de usuarios |
| **Datadog** | https://www.datadoghq.com | APM y logs |

---

## 💡 Recursos de Aprendizaje

### Cursos (Gratuitos)

- **Full Stack Open** (Universidad de Helsinki)
  - https://fullstackopen.com/en/
  - React, Node.js, TypeScript, GraphQL

- **The Odin Project**
  - https://www.theodinproject.com/
  - Full-stack web development

- **freeCodeCamp**
  - https://www.freecodecamp.org/
  - Certificaciones gratuitas

### YouTube Channels

- **Traversy Media** - https://www.youtube.com/@TraversyMedia
- **Web Dev Simplified** - https://www.youtube.com/@WebDevSimplified
- **Fireship** - https://www.youtube.com/@Fireship
- **Coding Garden** - https://www.youtube.com/@CodingGarden

### Blogs y Newsletters

- **Dev.to** - https://dev.to/
- **Medium** - https://medium.com/tag/javascript
- **Bytes (Newsletter)** - https://bytes.dev/
- **Node Weekly** - https://nodeweekly.com/

---

## 📦 Paquetes Útiles (Futuras Mejoras)

### Backend

```bash
# Rate limiting
npm install express-rate-limit

# Validación de schemas
npm install zod

# Logging
npm install winston

# Tests
npm install jest supertest @types/jest

# Seguridad adicional
npm install helmet express-validator
```

### Frontend

```bash
# Gestión de formularios
npm install react-hook-form

# Validación de esquemas
npm install zod

# Fechas
npm install date-fns

# Iconos
npm install lucide-react

# Loading states
npm install react-loading-skeleton

# Tests
npm install vitest @testing-library/react
```

---

## 🌐 APIs Complementarias

### Servicios de Email

- **Resend** - https://resend.com (enviar confirmaciones)
- **SendGrid** - https://sendgrid.com
- **Mailgun** - https://www.mailgun.com

### CDN de Imágenes

- **Cloudinary** - https://cloudinary.com (gratis hasta 25GB)
- **Cloudflare Images** - https://www.cloudflare.com/products/cloudflare-images
- **ImageKit** - https://imagekit.io

### SMS Notifications

- **Twilio** - https://www.twilio.com
- **Vonage** - https://www.vonage.com

---

## 📚 Libros Recomendados

### JavaScript/TypeScript

- **You Don't Know JS** (gratis online)
  - https://github.com/getify/You-Dont-Know-JS

- **Eloquent JavaScript** (gratis online)
  - https://eloquentjavascript.net/

- **TypeScript Handbook** (gratis online)
  - https://www.typescriptlang.org/docs/handbook/

### Node.js

- **Node.js Design Patterns**
  - Por Mario Casciaro

- **Understanding Node.js** (gratis)
  - https://nodejs.dev/learn

### Arquitectura

- **Clean Code** - Robert C. Martin
- **The Pragmatic Programmer** - David Thomas
- **Designing Data-Intensive Applications** - Martin Kleppmann

---

## 🎨 Diseño y UI/UX

### Inspiración de Diseño

- **Dribbble** - https://dribbble.com/search/gift-registry
- **Behance** - https://www.behance.net/search/projects/gift
- **Awwwards** - https://www.awwwards.com/

### Paletas de Colores

- **Coolors** - https://coolors.co/
- **Color Hunt** - https://colorhunt.co/
- **Adobe Color** - https://color.adobe.com/

### Iconos y Assets

- **Lucide Icons** - https://lucide.dev/ (gratis, React friendly)
- **Heroicons** - https://heroicons.com/ (gratis)
- **Unsplash** - https://unsplash.com/ (fotos gratis)
- **Pexels** - https://www.pexels.com/ (fotos y videos gratis)

---

## 🔧 Extensiones de VS Code

### Imprescindibles

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "naumovs.color-highlight",
    "christian-kohler.path-intellisense"
  ]
}
```

### Instalación

```bash
# Instalar todas a la vez:
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension prisma.prisma
code --install-extension bradlc.vscode-tailwindcss
```

---

## 🐛 Debugging en Producción

### Herramientas de Monitoreo

**Sentry (Error Tracking):**
```bash
npm install @sentry/react @sentry/node

# Frontend
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: "..." });

# Backend
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: "..." });
```

**LogRocket (Session Replay):**
```bash
npm install logrocket

import LogRocket from 'logrocket';
LogRocket.init('app-id');
```

---

## 📞 Soporte y Comunidad

### Dónde Pedir Ayuda

1. **Stack Overflow**
   - Tag: `mercadopago`, `prisma`, `react`
   - https://stackoverflow.com/

2. **GitHub Issues**
   - Prisma: https://github.com/prisma/prisma/issues
   - React: https://github.com/facebook/react/issues

3. **Discord Communities**
   - Reactiflux: https://www.reactiflux.com/
   - Prisma: https://pris.ly/discord

4. **Reddit**
   - r/reactjs: https://www.reddit.com/r/reactjs/
   - r/node: https://www.reddit.com/r/node/
   - r/webdev: https://www.reddit.com/r/webdev/

---

## 📊 Performance y Optimización

### Análisis de Performance

- **Lighthouse** (Chrome DevTools)
  - Analiza performance, SEO, accessibility

- **WebPageTest** - https://www.webpagetest.org/
  - Test de velocidad detallado

- **GTmetrix** - https://gtmetrix.com/
  - Análisis de carga

### Optimización de Imágenes

- **TinyPNG** - https://tinypng.com/
- **Squoosh** - https://squoosh.app/
- **ImageOptim** (macOS) - https://imageoptim.com/

---

## 🔒 Seguridad

### Checklists

- **OWASP Top 10** - https://owasp.org/www-project-top-ten/
- **Node.js Security Checklist** - https://blog.risingstack.com/node-js-security-checklist/

### Herramientas de Auditoría

```bash
# Auditar dependencias
npm audit

# Fix vulnerabilities
npm audit fix

# Checkear licencias
npm install -g license-checker
license-checker
```

---

## 🎉 Inspiración de Proyectos Similares

### Open Source Gift Registry Apps

- **Wedding Website** - https://github.com/rampatra/wedding-website
- **Gift List Manager** - https://github.com/topics/gift-registry
- **Event RSVP Apps** - https://github.com/topics/rsvp

### SaaS de Mesa de Regalos

- **Zankyou** - https://www.zankyou.cl/ (inspiración UI/UX)
- **Lista de Novios** - https://www.listadenovios.cl/
- **Matrimonio.cl** - https://www.matrimonio.cl/

---

## 📅 Roadmap de Futuras Funcionalidades

### MVP Actual
- ✅ Catálogo de regalos
- ✅ Pago con Mercado Pago
- ✅ Panel admin
- ✅ Webhooks

### v2.0 (Posibles Mejoras)
- [ ] Envío de emails de confirmación
- [ ] Galería de fotos del evento
- [ ] Contador regresivo
- [ ] Lista de invitados con RSVP
- [ ] Notificaciones push

### v3.0 (Advanced)
- [ ] Multi-eventos (bautizo + cumpleaños)
- [ ] Multi-idioma (ES/EN)
- [ ] Tema personalizable
- [ ] Integración con WhatsApp Business
- [ ] App móvil (React Native)

---

## 🏆 Buenas Prácticas

### Commits

Usa **Conventional Commits**:
```
feat: agregar filtro por nombre en contribuciones
fix: corregir cálculo de comisión en modo B
docs: actualizar README con instrucciones de deploy
chore: actualizar dependencias
```

### Branches

```
main         → Producción (protegida)
develop      → Desarrollo
feature/*    → Nuevas funcionalidades
fix/*        → Corrección de bugs
hotfix/*     → Fixes urgentes en producción
```

### Code Reviews

- Pide reviews antes de merge a main
- Usa GitHub Pull Requests
- Checkea que pasen los tests
- Verifica que no haya secrets

---

## 📞 Contactos Útiles

### Soporte Mercado Pago Chile

- **Email:** developers@mercadopago.com
- **Teléfono:** 600 830 0009
- **Horario:** Lun-Vie 9:00-18:00 (hora de Chile)
- **Chat:** Desde el panel de developers

### Hosting Support

- **Vercel:** https://vercel.com/support
- **Railway:** https://railway.app/help
- **Netlify:** https://www.netlify.com/support/

---

<div align="center">

**¿Falta algo? ¡Agrega tus propios recursos! 📚**

</div>
