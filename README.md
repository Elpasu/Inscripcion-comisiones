# Reorganizador de comisiones — Química Orgánica (FBIOyF · UNR)

Página web para redistribuir alumnos entre comisiones de forma equitativa cuando una comisión no tiene clase (feriado, paro, imprevisto, etc.). Los alumnos de las comisiones afectadas eligen una comisión de destino con cupo disponible y el inscripto queda registrado en tiempo real.

Está publicada con **GitHub Pages** desde la rama `main`, y guarda las inscripciones en **Firebase Firestore**.

## Cómo funciona

```
Alumno ──> index.html + index.js ──> Firestore (colección DB_COLLECTION)
                  ▲
                  │ reescribe el bloque de configuración vía API de GitHub (commit a main)
                  │
Docente ──> admin-config.html
```

1. El alumno entra a la página, ve las **comisiones destino** con su cupo (`inscriptos / CUPO_MAX`) y elige una.
2. Completa nombre, DNI y su **comisión de origen** (la que se quedó sin clase).
3. La inscripción se guarda en Firestore. Se valida que el DNI no esté repetido y que la comisión tenga cupo.
4. Los cupos se actualizan en vivo para todos (`onSnapshot`).

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | Página de los alumnos (UI y estilos). Al pie tiene el enlace «Acceso administrador». |
| `index.js` | Lógica de inscripción. Arriba tiene el **bloque de configuración** (`CUPO_MAX`, `DB_COLLECTION`, `catalogo`, `comisiones`, `origenes`) que el panel admin reescribe. |
| `firebase.js` | Inicialización de Firebase / Firestore. |
| `admin-config.html` | Panel de configuración. Edita el catálogo de comisiones (día, horario, JTP) y las listas activas, y publica los cambios en `index.js` mediante la API de GitHub. |
| `Reorganización_comisiones.html` | Prototipo viejo con `localStorage`. Ya no se usa. |

## Uso semanal (docentes)

1. En la página de alumnos, ir al pie → **Acceso administrador** → ingresar la contraseña del panel.
2. Se ve la tabla de inscriptos. Desde ahí se puede **Descargar Excel** (CSV) o abrir **Configurar Comisiones**.
3. En el configurador, ingresar la contraseña del panel y un **GitHub Personal Access Token** (scope `repo`, o fine-grained con `Contents: Read & Write`). El token queda solo en memoria.
4. Configurar:
   - **Cupo máximo por comisión**: se aplica igual a todas las comisiones destino.
   - **Comisiones disponibles (destino)**: a cuáles se pueden anotar los alumnos.
   - **Comisiones de origen**: opciones del desplegable «¿en qué comisión estabas?».
   - **Nueva lista**: tildar para empezar de cero. Crea una colección nueva en Firestore (`inscripciones_<timestamp>`) y la anterior queda como respaldo; no se borra nada.
5. Revisar la vista previa y el cuadro de cambios, y apretar **↑ Publicar en GitHub**.
6. GitHub Pages tarda 1–2 minutos en actualizar. Después alcanza con recargar la página (F5): `index.html` carga `index.js` con `?v=<timestamp>` para que el navegador no use una versión en caché.

Las credenciales (contraseña del panel y token) están en el manual interno en PDF, que **no** se versiona. No las subas al repo.

## Cambio de cuatrimestre: días, horarios y JTP

Se hace desde el configurador, sin tocar código. Está en la sección **Comisiones del cuatrimestre** (arriba a la izquierda):

- Para cada comisión se elige el día, el horario (desde / hasta) y el JTP a cargo.
- **Agregar comisión**: escribir el número (ej. `11` o `5A`) y completar día y horario.
- **×**: elimina la comisión del cuatrimestre y también la saca de las listas de destino y origen.
- El cuadro «Cambios vs. versión actual» muestra los cambios de horario y de JTP.
- No deja publicar si alguna comisión no tiene día u horario.

Conviene tildar **Nueva lista** en la primera publicación del cuatrimestre.

### Dónde se guarda

El catálogo vive en `index.js`, dentro del bloque de configuración que publica el panel:

```js
const catalogo = [
  {"id":"com1","num":"1","dia":"Martes","hora":"07:30 a 11:30 hs","jtp":""},
  ...
];
```

- `id`: identificador interno (`com` + número, ej. `com5a`). Se guarda en Firestore como `comisionNueva` y no cambia una vez creado.
- `comisiones` y `origenes` (las listas activas de la semana) se generan a partir del catálogo.
- El JTP aparece en las tarjetas de los alumnos, en la confirmación y en el Excel.
