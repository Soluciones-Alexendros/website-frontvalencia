# Política de Seguridad — FRONT Valencia

### Propósito de este documento

- **Objetivos:** Declarar versiones soportadas, el canal privado de avisos y la superficie del sitio (Astro, Payload, reservas).
- **Estructura:** Versiones soportadas → cómo reportar → medidas y alcance.
- **Contenido a integrar según contexto:** Adapta contactos y hosting de FRONT Valencia. No copies la política de una CLI ni un desk de SaaS. No commitees `.env` ni claves. Las reservas de CoverManager no se reportan aquí.

© Alejandro Domingo Agustí

## Versiones compatibles

Actualmente solo la versión publicada en producción (`main`) recibe actualizaciones de seguridad.

| Versión    | Soportada                       |
| ---------- | ------------------------------- |
| `main`     | :white_check_mark:              |
| `develop`  | :warning: Solo parches críticos |
| Anteriores | :x:                             |

## Reportar una vulnerabilidad

Si descubres una vulnerabilidad de seguridad en FRONT Valencia, **no** crees un issue público.

1. Preferible: [GitHub Security Advisory](https://github.com/Iniciativas-Alexendros/website-frontvalencia/security/advisories/new) en este repositorio.
2. Alternativa: correo a [operaciones@alexendros.dev](mailto:operaciones@alexendros.dev).

### Qué incluir en tu reporte

- Descripción clara de la vulnerabilidad
- Pasos para reproducirla
- Versión del proyecto donde la encontraste
- Impacto potencial
- (Opcional) Propuesta de solución

### Tiempo de respuesta

Acusamos recibo en un máximo de **48 horas laborables**.  
Te mantendremos informado del progreso de la investigación y la resolución.

## Política de divulgación responsable

Seguimos una política de **divulgación responsable de 90 días**:

1. **Día 0**: Reporte recibido y acuse de recibo.
2. **Día 0–30**: Investigación, reproducción y desarrollo del parche.
3. **Día 30–60**: Implementación del fix en `develop` y testeo.
4. **Día 60–90**: Despliegue a producción y divulgación pública.
5. **Día 90**: Publicación del advisory y crédito al investigador (si lo desea).

### Expectativas

- Te pedimos **no divulgar la vulnerabilidad públicamente** hasta que hayamos publicado el fix.
- Trabajaremos contigo para resolver el problema dentro del plazo de 90 días.
- Si el fix requiere más tiempo, te informaremos con una justificación.

### Reconocimiento

Agradecemos a quienes reportan vulnerabilidades de buena fe.  
Incluiremos tu nombre (con tu permiso) en nuestros agradecimientos públicos.

---

## Medidas de seguridad implementadas

### 1. Variables de entorno

Todos los secrets, API keys y credenciales se gestionan exclusivamente a través de variables de entorno.  
Nunca se hardcodean en el código fuente. Archivo de referencia: `.env.example`.

Se utiliza `validate:env` en CI para verificar que todas las variables requeridas están presentes.

### 2. Autenticación y autorización (Payload CMS)

- **Payload auth**: El panel de administración de Payload CMS requiere autenticación.
- **Roles y acceso**: Tres niveles definidos en `apps/cms/src/access/`:
  - `isAdmin`: acceso completo a todas las colecciones
  - `isAdminOrEditor`: puede crear, leer y actualizar contenido
  - `read: () => true`: las colecciones públicas son de solo lectura sin autenticación
- **JWT**: Payload utiliza tokens JWT para sesiones del admin. El secret se configura vía `PAYLOAD_SECRET`.

### 3. CORS

- Configuración explícita de orígenes permitidos en Payload (según `PAYLOAD_PUBLIC_SERVER_URL`).
- El frontend Astro solo realiza peticiones a la API de Payload desde el servidor (SSR/SSG).

### 4. CSRF

- Payload incluye protección CSRF por defecto en sus rutas de API.
- Las cookies de sesión tienen flags `HttpOnly` y `Secure` en producción.

### 5. Rate limiting

- Se recomienda configurar rate limiting a nivel de proxy inverso (Nginx, Cloudflare) o plataforma de hosting.
- Railway (CMS) y Vercel (web) proporcionan protección DDoS básica.

### 6. Seguridad en contenido

- **Sanitización de HTML**: El editor rich text de Payload (Lexical) sanitiza el contenido.
- **Imágenes**: Las subidas se validan por tipo MIME.
- **Alt text**: Obligatorio en todas las imágenes del CMS.

### 7. Dependencias

- Renovate (`.github/renovate.json`) cubre `npm` y `github-actions`. No hay Dependabot de version-updates.
- Los grupos de dependencias se actualizan juntos para minimizar riesgos de compatibilidad.
- `sharp` está congelado en `>=0.35.3, <0.36.0` para evitar breaking changes en entornos serverless.

### 8. Entorno de producción

| Componente    | Proveedor          | Seguridad aplicada                         |
| ------------- | ------------------ | ------------------------------------------ |
| Web (Astro)   | Vercel             | HTTPS forzado, DDoS protection, WAF        |
| CMS (Payload) | Railway            | HTTPS, isolated network, automatic backups |
| Base de datos | Railway (Postgres) | SSL/TLS, acceso solo desde CMS             |
| Media storage | Cloudflare R2      | Bucket público con policies, sin listado   |
| Reservas      | CoverManager       | API externa, sin manejo de datos propios   |

### 9. Logs y monitorización

- No se loguean secrets, tokens ni datos personales.
- En producción, los errores se capturan sin exponer stack traces internos.

---

## Security.txt

Se recomienda alojar un archivo `security.txt` en la raíz del sitio de producción ([RFC 9116](https://www.rfc-editor.org/rfc/rfc9116)):

```
https://frontvalencia.com/.well-known/security.txt
```

Contenido propuesto:

```
Contact: mailto:seguridad@frontvalencia.com
Expires: 2027-12-31T23:59:00Z
Preferred-Languages: es, en
Canonical: https://frontvalencia.com/.well-known/security.txt
Policy: https://frontvalencia.com/security/
```

## Preguntas

Para preguntas generales sobre seguridad, usa el advisory privado o [operaciones@alexendros.dev](mailto:operaciones@alexendros.dev). Atención de clientes del restaurante: [SUPPORT.md](SUPPORT.md).
