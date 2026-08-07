# 🏋️ Romeo Personal Trainer

<div align="center">

![Romeo Personal Trainer](1.jpeg)

**Plataforma web de gestión para entrenadores personales**  
*Controla clientes, rutinas, sesiones en vivo y progreso corporal desde un solo lugar.*

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![LocalStorage](https://img.shields.io/badge/Storage-LocalStorage-FF3CAC?style=for-the-badge)

</div>

---

## 📋 Tabla de Contenidos

- Descripción
- Capturas de Pantalla
- Características
- Estructura del Proyecto
- Instalación y Uso
- Páginas de la Aplicación
- Modelos de Datos
- Design System
- Funcionalidades Detalladas
- Tecnologías Utilizadas

---

## 📖 Descripción

**Romeo Personal Trainer** es una aplicación web de alto rendimiento diseñada específicamente para entrenadores personales. Permite gestionar de forma centralizada todos los aspectos del entrenamiento:

- ☁️ **Base de datos 24/7 en la nube (Supabase)** con sincronización automática multidispositivo y backup local
- 📲 **PWA Instalable** con soporte offline y auto-actualización forzada en celulares y tablets
- 👤 **Registro completo de clientes** con medidas corporales y métricas de ingresos
- 🏋️ **Creación de rutinas mensuales** con editor de ejercicios por bloques
- ⏱️ **Sesiones de entrenamiento en vivo** con timer, checklist y volumen en tiempo real
- 📊 **Seguimiento de progreso corporal** con gráficas SVG y comparativas
- 🥗 **Guías nutricionales** con recetas y timing de macronutrientes

> **Sincronización en la Nube 24/7 + Respaldo Local.** Tus datos nunca se pierden y están disponibles al instante en cualquier celular, tablet o PC sin necesidad de tener un servidor propio o la computadora encendida.

---

## ✨ Características

### 🎯 Gestión de Clientes (Roster)
- ✅ Registro completo: nombre, edad, género, email, teléfono
- ✅ Medidas corporales: peso, estatura, pecho, cintura, cadera, brazos, muslos
- ✅ IMC calculado automáticamente con categoría diagnóstica
- ✅ Tarifa mensual por cliente → **Revenue total del mes en el dashboard**
- ✅ Objetivos: Perder peso, Ganar músculo, Mantenimiento, Resistencia, Rehabilitación
- ✅ Filtros por objetivo y búsqueda por nombre
- ✅ Barra de completitud semanal por cliente
- ✅ Programación de sesiones con hora y rutina asignada

### 🏋️ Creador de Rutinas
- ✅ Editor de bloques: ejercicio, grupo muscular, series × reps, peso (kg), descanso (s)
- ✅ Biblioteca integrada con +45 ejercicios organizados por grupo muscular
- ✅ **Edición total de la biblioteca** (modificar nombres, subir imágenes propias, series y notas de cualquier ejercicio)
- ✅ **Packs (Plantillas)** de rutinas para agrupar programas y asignarlos rápidamente a cualquier cliente
- ✅ Seguimiento de peso inicial y final del mes
- ✅ Tipo de rutina: Fuerza, Hipertrofia, Pérdida de Peso, Resistencia, Funcional
- ✅ Recomendaciones del entrenador por rutina
- ✅ Vista de historial mensual expandible
- ✅ Acceso directo a iniciar sesión desde la rutina

### ⚡ Entrenamiento en Vivo
- ✅ **Timer de sesión** con contador de tiempo real
- ✅ **Checklist de ejercicios** — cada serie es un ítem verificable
- ✅ **Volumen total** calculado en tiempo real (sets completados × kg)
- ✅ **Calorías estimadas** basadas en duración de la sesión
- ✅ **Ring de progreso** — % visual de sets completados
- ✅ **Timer de descanso** automático al completar cada serie
- ✅ **Citas motivacionales** rotativas al inicio de cada sesión
- ✅ Guardado automático en historial al terminar

### 📊 Seguimiento Corporal
- ✅ Registro de mediciones periódicas con fecha
- ✅ **Gráfica SVG** de evolución del peso
- ✅ Comparativa automática: medidas iniciales vs actuales
- ✅ Historial completo de mediciones con variación respecto al registro anterior

### 🥗 Nutrición
- ✅ 12 recetas organizadas por categoría (Alta Proteína, Pre-Entreno, Recuperación, Snacks)
- ✅ Macronutrientes por receta: proteína, carbos, grasas, calorías
- ✅ Lista detallada de ingredientes en modal
- ✅ Guía de macros diarios recomendados
- ✅ Guía de timing nutricional (pre/post entreno, nocturno)

### 📈 Dashboard Estratégico
- ✅ **KPIs en tiempo real**: Clientes activos, Sesiones hoy, Completitud promedio, Ingresos/mes
- ✅ **Gráfico de barras SVG** — Volumen de entrenamiento semanal (últimas 4 semanas)
- ✅ **Donut de retención** — % de clientes con sesiones completadas
- ✅ Lista de sesiones programadas para el día
- ✅ Accesos rápidos a las acciones más comunes

---

## 📁 Estructura del Proyecto

```
GYM/
│
├── 📄 index.html           # Dashboard principal con KPIs y gráficos
├── 📄 usuarios.html        # Roster de clientes con métricas y perfil
├── 📄 rutinas.html         # Creador de rutinas mensuales con ilustraciones
├── 📄 entrenamiento.html   # Sesión en vivo con timer, checklist e imágenes
├── 📄 progreso.html        # Ficha de balance de marcos y evolución mensual
├── 📄 recetas.html         # Nutrición y recetas
├── 📄 macros.html          # Calculadora de macronutrientes interactiva
│
├── 🎨 styles.css           # Sistema de diseño completo y hojas de impresión
├── ⚙️  shared.js            # Lógica compartida, base de datos LocalStorage y utilidades
│
├── 📁 img/                 # Carpeta de ilustraciones de ejercicios (1.jpeg a 6.jpeg)
├── 🖼️  1.jpeg              # Logo principal de Romeo PT
└── 🖼️  2.jpeg              # Logo alternativo
```

---

## 🚀 Instalación y Uso

### Requisitos
- Cualquier navegador moderno (Chrome, Firefox, Edge, Safari)
- **No requiere servidor, Node.js, ni dependencias externas**

### Pasos

1. **Descarga o clona el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/romeo-personal-trainer.git
   ```
   — o —
   Descarga el ZIP y extrae en una carpeta.

2. **Abre la aplicación:**
   - Haz doble clic en `index.html`
   - O arrastra el archivo al navegador

3. **¡Listo!** No requiere configuración adicional.

> ⚠️ **Nota sobre datos:** Toda la información se guarda en el `localStorage` del navegador. No borres los datos del sitio en la configuración del navegador para conservar tus registros. Se recomienda usar siempre el mismo navegador y perfil.

---

## 📱 Páginas de la Aplicación

### 🏠 Dashboard (`index.html`)
Vista estratégica del negocio con métricas en tiempo real.

| Elemento | Descripción |
|---|---|
| **Hero Banner** | Logo y cita motivacional del día |
| **KPI: Clientes Activos** | Total de clientes registrados |
| **KPI: Sesiones Hoy** | Sesiones programadas para el día actual |
| **KPI: Completitud %** | Promedio de rutinas completadas entre todos los clientes |
| **KPI: Ingresos / Mes** | Suma de tarifas mensuales de todos los clientes |
| **Gráfico de Volumen** | Barras SVG con volumen de entrenamiento semanal |
| **Donut de Retención** | % de clientes con sesiones completadas |
| **Sesiones de Hoy** | Lista cronológica de sesiones del día |
| **Accesos Rápidos** | Links a Nuevo Cliente, Crear Rutina, Iniciar Sesión, Nutrición |

---

### 👥 Clientes (`usuarios.html`)
Gestión completa del roster de clientes.

**Barra de Resumen:**
- Clientes Totales · Ingresos/Mes · Completitud Promedio · Rutinas Activas

**Filtros por Objetivo:**
`Todos` · `Perder Peso` · `Ganar Músculo` · `Mantenimiento` · `Resistencia`

**Cada tarjeta de cliente muestra:**
- Avatar con iniciales (color único por cliente)
- Nombre, edad, género y nivel de experiencia
- Tarifa mensual (si está configurada)
- Peso · Estatura · IMC
- Barra de progreso de completitud semanal
- Próxima sesión programada
- Acciones: Ver Perfil · Programar Sesión · Editar · Eliminar

---

### 🏋️ Rutinas (`rutinas.html`)
Creador de planes de entrenamiento mensual y plantillas globales.

**Configuración de la Rutina:**
- Nombre · Mes · Año · Tipo · Grupo Muscular · Días/Semana
- Peso Inicial y Final del mes
- Biblioteca de ejercicios integrada (+45 ejercicios editables y personalizables con fotos propias)

**Packs (Plantillas):**
- Creación de programas base agrupados e independientes de los clientes
- Clonación automática y asignación mágica de un pack completo a cualquier cliente con un solo clic

**Editor de Bloques:**
```
# | Ejercicio | Grupo Muscular | Series×Reps | Peso(kg) | Descanso(s) | Notas
```
Cada ejercicio se agrega como un bloque independiente.

---

### ⚡ Entrenamiento (`entrenamiento.html`)
Modo de sesión en vivo para el entrenamiento.

**Flujo de uso:**
1. Selecciona el cliente y su rutina asignada
2. Haz clic en **"Iniciar Sesión"**
3. Verifica cada serie en el checklist
4. El timer de descanso se activa automáticamente
5. Al completar todos los sets → pantalla de celebración
6. **"Terminar Sesión"** guarda la sesión en el historial

**Métricas en tiempo real:**
| Métrica | Cálculo |
|---|---|
| ⏱ Tiempo | Cronómetro desde que inicia la sesión |
| 🏋️ Volumen | Suma de (reps × kg) de cada set completado |
| 🔥 Calorías | ~7 kcal/minuto estimadas para entrenamiento de fuerza |
| ✅ Completado | (Sets completados / Total de sets) × 100 |

---

### 📊 Progreso (`progreso.html`)
Ficha interactiva "Balance de Marcos y Avance por Mes" que consolida la evolución del cliente:
- **Tabla Matricial de 12 Meses:** Monitorea y compara 9 medidas físicas clave (Peso, Pecho, Cintura, Cadera, Brazo D/I, Muslo D/I, Pantorrilla, % Grasa Corporal y Notas) mes a mes.
- **Gráficas SVG Interactivas:**
  - *Cambio en el Peso (kg)*: Línea de evolución temporal con cálculo de variaciones.
  - *Comparativo de Medidas (cm)*: Comparativa multilínea de Cintura, Pecho, Cadera y Muslos en un solo gráfico.
- **Siluetas Físicas Evolutivas:** Modelado anatómico interactivo (Masculino/Femenino) que mapea los puntos clave de medida en dos estados: *Inicial (Antes)* y *Actual (Después)*.
- **Antes y Después Visual:** Módulo para cargar o tomar fotos en vivo con webcam (Frente, Perfil, Espalda) con autocompresión en Canvas para optimizar el espacio de LocalStorage.
- **Formato de Impresión Directo:** Botón de impresión integrado con diseño CSS específico (`@media print`) que genera reportes ejecutivos limpios en PDF para entregar al cliente.

---

### 🥗 Nutrición (`recetas.html`)
Guía nutricional con 12 recetas categorizadas.

**Categorías:** Alta Proteína · Pre-Entreno · Recuperación · Snacks

**Cada receta incluye:**
- Macronutrientes (Proteína / Carbos / Grasas / Calorías)
- Lista completa de ingredientes
- Guía de timing nutricional (pre/post entreno, nocturno)

---

### ⚖️ Macros (`macros.html`)
Calculadora de macronutrientes interactiva personalizada para cada cliente:
- **TMB (Mifflin-St Jeor):** Cálculo metabólico preciso según género, edad, estatura y peso.
- **Calorías de Mantenimiento:** Ajustadas dinámicamente por nivel de actividad (desde sedentario hasta entrenamiento intenso).
- **Ajuste por Objetivo:** Recálculo calórico automático (+300 a +500 kcal para volumen, -300 a -500 kcal para definición).
- **Reparto por Sliders:** Distribución personalizada de proteínas (g/kg), grasas (% calórico) y carbohidratos, visualizada con un gráfico de barras horizontal animado en tiempo real.
- **Integración con Perfil:** Guarda los resultados en la base de datos local y renderiza la tarjeta nutricional correspondiente en la sección "Perfil del Cliente" de `usuarios.html`.

**Categorías:** Alta Proteína · Pre-Entreno · Recuperación · Snacks

**Cada receta incluye:**
- Macronutrientes (Proteína / Carbos / Grasas / Calorías)
- Lista completa de ingredientes
- Guía de timing nutricional (pre/post entreno, nocturno)

---

## 🗄️ Modelos de Datos

Todos los datos se guardan en `localStorage` bajo la clave `romeo_db`.

### Usuario
```json
{
  "id": "string",
  "nombre": "Juan García López",
  "edad": 28,
  "genero": "Masculino",
  "email": "juan@email.com",
  "telefono": "+57 300 000 0000",
  "tarifa": 150000,
  "peso": 78.5,
  "estatura": 178,
  "pecho": 98, "cintura": 84, "cadera": 96,
  "brazoIzq": 36, "brazoDer": 36,
  "musloIzq": 58, "musloDer": 58,
  "pantorrilla": 38,
  "grasaPct": 22.0,
  "objetivo": "Ganar músculo",
  "nivel": "Intermedio",
  "obs": "Lesión previa en hombro derecho",
  "fotoIniFrente": "data:image/jpeg;base64,...",
  "fotoIniPerfil": "data:image/jpeg;base64,...",
  "fotoIniEspalda": "data:image/jpeg;base64,...",
  "fotoFinFrente": "data:image/jpeg;base64,...",
  "fotoFinPerfil": null,
  "fotoFinEspalda": null,
  "macros": {
    "calorias": 3159,
    "proteinasG": 176,
    "grasasG": 88,
    "carbohidratosG": 416,
    "ajusteCal": 400
  },
  "creado": "2025-01-15T10:00:00Z"
}
```

### Rutina
```json
{
  "id": "string",
  "usuarioId": "string",
  "nombre": "Programa de Fuerza — Mes 1",
  "mes": "Enero",
  "anio": 2025,
  "tipo": "Hipertrofia",
  "grupo": "Pecho + Tríceps",
  "dias": "4",
  "pesoIni": 78.5,
  "pesoFin": 76.0,
  "ejercicios": [
    {
      "nombre": "Press de banca",
      "grupo": "Pecho",
      "series": "4 × 10",
      "peso": "80",
      "descanso": "90",
      "imagen": "1.jpeg",
      "notas": "Agarre ancho"
    }
  ],
  "notas": "Aumentar carga 2.5kg cada semana si completa todas las series",
  "creado": "2025-01-15T10:00:00Z"
}
```

### Sesión de Entrenamiento
```json
{
  "id": "string",
  "usuarioId": "string",
  "rutinaId": "string",
  "fecha": "2025-01-20",
  "hora": "08:00",
  "estado": "completada",
  "duracionSeg": 3240,
  "volumenKg": 8500,
  "setsCompletados": 24,
  "setsTotal": 24,
  "notas": ""
}
```

### Progreso Corporal
```json
{
  "id": "string",
  "usuarioId": "string",
  "fecha": "2025-01-20",
  "mes": 1,
  "peso": 77.0,
  "pecho": 97, "cintura": 82, "cadera": 95,
  "brazoIzq": 37, "brazoDer": 37,
  "musloIzq": 59, "musloDer": 59,
  "pantorrilla": 38,
  "grasaPct": 20.5,
  "notas": "Cliente reporta más energía"
}
```

---

## 🎨 Design System

Basado en el PRD de **Romeo Personal Trainer / Vanguard Fitness**.

### Paleta de Colores
| Variable | Color | Uso |
|---|---|---|
| `--bg` | `#131313` | Fondo principal |
| `--bg-card` | `#1c1c1c` | Fondo de tarjetas |
| `--bg-surface` | `#222222` | Superficies secundarias |
| `--pink` | `#FF3CAC` | Acento principal (botones, KPIs) |
| `--blue` | `#2B86C5` | Acento secundario |
| `--purple` | `#784BA0` | Color intermedio del gradiente |
| `--green` | `#00E5A0` | Éxito, completitud |
| `--red` | `#FF4560` | Errores, eliminación |

### Gradiente Principal
```css
--grad-main: linear-gradient(135deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%);
```

### Tipografía
```css
font-family: 'Sora', sans-serif;
/* Pesos: 300, 400, 500, 600, 700, 800 */
```

---

## 🔧 Funcionalidades Detalladas

### Persistencia de Datos
```javascript
// Guardar
localStorage.setItem('romeo_db', JSON.stringify(DB));

// Cargar (con migración automática desde 'gymproDB')
const s = localStorage.getItem('romeo_db');
if (s) DB = JSON.parse(s);
```

### Cálculo de Revenue
```javascript
function calcRevenue() {
  return DB.usuarios.reduce((sum, u) => sum + (parseFloat(u.tarifa) || 0), 0);
}
```

### Cálculo de Completitud
```javascript
function calcCompletitudUsuario(uid) {
  const sesiones = DB.sesiones.filter(s => s.usuarioId === uid);
  const completadas = sesiones.filter(s => s.estado === 'completada').length;
  return Math.round((completadas / sesiones.length) * 100);
}
```

### Volumen de Entrenamiento
El volumen se calcula sumando: **Series × Repeticiones × Peso (kg)** de cada set completado durante la sesión en vivo.

### Timer de Descanso
Al marcar un set como completado, se activa automáticamente un contador con el tiempo de descanso configurado en la rutina (por defecto 60 segundos).

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso | Versión |
|---|---|---|
| **HTML5** | Estructura de todas las páginas | Semántico |
| **CSS3** | Sistema de diseño, animaciones, responsive | Variables CSS, Grid, Flexbox |
| **JavaScript (Vanilla)** | Lógica de negocio, DOM, localStorage | ES6+ |
| **SVG** | Gráficos de barras, donut, líneas | Inline SVG |
| **Google Fonts** | Tipografía Sora | Variable |
| **localStorage** | Persistencia de datos sin servidor | Web API |

> **Sin frameworks. Sin librerías externas. Sin dependencias npm.**  
> Funciona directamente como archivos HTML estáticos.

---

## 📱 Responsive Design

La aplicación es completamente responsive con breakpoints en:

| Breakpoint | Comportamiento |
|---|---|
| `> 1200px` | Layout completo con sidebar fija |
| `768px – 1200px` | Grid reducido a 2 columnas, sidebar permanente |
| `< 768px` | Sidebar colapsable con botón de menú (hamburger) |
| `< 480px` | Layout de columna única, tipografía reducida |

---

## 📊 Métricas del Proyecto

| Métrica | Valor |
|---|---|
| Páginas HTML | 7 |
| Líneas de CSS | ~2,200 |
| Líneas de JavaScript | ~1,500 (shared.js + scripts inline) |
| Recetas incluidas | 12 |
| Ejercicios en biblioteca | 45+ |
| Citas motivacionales | 8 |
| Dependencias externas | **0** |

---

## 📐 Arquitectura, Diagramas UML y Plan de Migración

El proyecto cuenta con documentación técnica completa y **8 diagramas UML Mermaid** detallados para guiar la migración hacia la arquitectura definitiva en React / Next.js / TypeScript.

> 📄 **Documento Completo de Arquitectura:** [docs/ARCHITECTURE_AND_MIGRATION.md](file:///d:/Documents/GitHub/GYM/docs/ARCHITECTURE_AND_MIGRATION.md)

### Resumen de Diagramas UML Disponibles:
1. 🏗️ **Arquitectura General PWA & Nube** (Separación de capas en Vercel, Node, Service Worker y Supabase)
2. 🗄️ **Diagrama Entidad-Relación (ERD)** (Modelado de Usuarios, Rutinas, Sesiones, Progresos y Packs)
3. 👤 **Diagrama de Casos de Uso** (Funcionalidades principales del Entrenador Personal)
4. 🔄 **Diagrama de Secuencia de Sincronización Híbrida 24/7** (Carga instantánea 0ms + Polling a Supabase)
5. ⚡ **Diagrama de Secuencia de Entrenamiento en Vivo** (Cronómetro, Timer de Descanso y Volumen Kg)
6. 📲 **Diagrama de Estados del Service Worker PWA** (Estrategias Cache-First y Network-First)
7. 🧩 **Diagrama de Clases y Módulos de Estado** (Estructura de `shared.js`, `persist.js` y `api/index.js`)
8. 🚀 **Diagrama de Arquitectura Objetivo** (Modelo objetivo en Next.js 14 / Vite + React + Zustand + TypeScript)

### Roadmap de Migración por Fases:
- **Fase 1**: Creación de rama Git `feature/migration-react-vite` y setup de Vite + React + TypeScript + TailwindCSS.
- **Fase 2**: Componentización atómica e implementación de tienda Zustand para el estado global (`useGymStore`).
- **Fase 3**: Migración del motor de Entrenamiento en Vivo, Recharts para Progreso y Calculadora de Macros.
- **Fase 4**: Pruebas de compatibilidad PWA en iOS Safari y Android Chrome, y migración definitiva a producción.

---

## 👤 Autor

**Romeo Personal Trainer**  
*Plataforma desarrollada para la gestión profesional del entrenamiento personalizado.*

---

<div align="center">

Hecho con 💪 y mucha dedicación

*"El único mal entrenamiento es el que no hiciste."*

</div>
