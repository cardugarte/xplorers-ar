# Política de Privacidad — Xplorers

**Última actualización:** 28 de marzo de 2026

Xplorers ("la aplicación", "nosotros") es un directorio de campings para Argentina. Esta política describe qué información recopilamos, cómo la usamos y cuáles son tus derechos, en cumplimiento con la **Ley 25.326 de Protección de los Datos Personales** de la República Argentina.

---

## 1. Datos que recopilamos

### 1.1 Ubicación

La aplicación solicita acceso a tu **ubicación precisa en primer plano** ("while in use") con el único fin de:

- Mostrar campings cercanos a tu posición actual en el mapa.
- Calcular distancias y ordenar resultados por proximidad.

La ubicación **no se almacena en nuestros servidores** ni se comparte con terceros de forma identificable. Solo se usa en tiempo real, dentro de la sesión activa de la app.

### 1.2 Identificador anónimo

Al abrir la aplicación por primera vez, Supabase (nuestro proveedor de backend) genera automáticamente un **UUID anónimo** mediante autenticación anónima. Este identificador:

- No está vinculado a ningún nombre, email, teléfono ni dato personal.
- Se usa para asociar favoritos y reportes de errores a una sesión.
- Se almacena en el dispositivo mediante MMKV (almacenamiento local seguro).
- No se comparte con terceros de forma que permita identificar a la persona.

### 1.3 Reportes de errores de campings

Cuando enviás un reporte sobre un camping (datos incorrectos, camping cerrado, etc.), guardamos:

- El texto del reporte.
- El ID del camping afectado.
- El UUID anónimo de sesión.
- La fecha y hora del reporte.

No recopilamos nombre, email ni ningún dato de contacto salvo que vos lo incluyas voluntariamente en el texto del reporte.

---

## 2. Datos que NO recopilamos en Fase 1

En la versión actual (Fase 1 — MVP Directorio), **no existe contenido generado por usuarios (UGC)**: no hay reviews, comentarios ni publicaciones públicas. Por lo tanto, no recopilamos ni procesamos datos personales más allá de los descritos en la sección anterior.

---

## 3. Terceros que procesan datos

| Proveedor | Rol | Política de privacidad |
|-----------|-----|------------------------|
| **Supabase** (supabase.com) | Backend, base de datos, autenticación anónima | [supabase.com/privacy](https://supabase.com/privacy) |
| **Mapbox** (mapbox.com) | Tiles de mapa y renderizado cartográfico | [mapbox.com/legal/privacy](https://www.mapbox.com/legal/privacy) |

Mapbox puede recibir solicitudes de tiles que incluyan la región del mapa visible, pero **no recibe tu ubicación precisa ni el UUID de sesión**.

---

## 4. Almacenamiento y seguridad

- Los datos se almacenan en servidores de Supabase ubicados en la región **us-east-1** (AWS).
- El UUID anónimo se almacena localmente en el dispositivo usando MMKV.
- El catálogo offline de campings se almacena en SQLite local en tu dispositivo.
- Implementamos Row Level Security (RLS) en nuestra base de datos: cada sesión solo puede acceder a sus propios favoritos y reportes.

---

## 5. Retención de datos

| Dato | Retención |
|------|-----------|
| UUID anónimo | Hasta que desinstalés la aplicación o eliminés sus datos |
| Reportes de errores | 12 meses desde la fecha de creación |
| Caché offline (SQLite) | Hasta que desinstalés la aplicación |
| Caché de consultas (MMKV) | 24 horas |

---

## 6. Tus derechos — Ley 25.326

En virtud de la Ley 25.326 de Protección de los Datos Personales, tenés derecho a:

- **Acceso**: solicitar qué datos tenemos asociados a tu UUID anónimo.
- **Rectificación**: corregir datos inexactos.
- **Supresión**: solicitar la eliminación de todos tus datos ("derecho al olvido").
- **Oposición**: oponerte al tratamiento de tus datos.

Dado que usamos autenticación anónima, para ejercer estos derechos deberás proveer tu UUID de sesión (visible desde la aplicación en _Perfil → Información de cuenta_).

**Contacto para ejercer derechos o consultas de privacidad:**

- Email: privacidad@xplorers.app
- Plazo de respuesta: 30 días hábiles, conforme al artículo 14 de la Ley 25.326.

La Dirección Nacional de Protección de Datos Personales (DNPDP) es el organismo de control. Podés presentar una denuncia en: [argentina.gob.ar/aaip/datospersonales](https://www.argentina.gob.ar/aaip/datospersonales)

---

## 7. Menores de edad

Xplorers no está dirigida a menores de 13 años. No recopilamos intencionalmente datos de menores. Si tomás conocimiento de que un menor ha proporcionado datos personales, contactanos para eliminarlos.

---

## 8. Cambios a esta política

Notificaremos cambios significativos mediante una notificación dentro de la aplicación o actualizando la fecha al inicio de este documento. El uso continuado de la app tras los cambios implica aceptación de la política actualizada.

---

## 9. Ley aplicable

Esta política se rige por las leyes de la **República Argentina**, en particular la Ley 25.326 y su decreto reglamentario 1558/2001. Toda controversia será sometida a la jurisdicción de los tribunales federales de la Ciudad Autónoma de Buenos Aires.

---

_Xplorers — Directorio de Campings Argentina_
