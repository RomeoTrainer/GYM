# 📐 Documentación de Arquitectura y Plan de Migración — Romeo PT

> **Documento Técnico de Referencia y Diagramación UML**  
> *Preparado para la migración de la versión actual (Vanilla JS / PWA / Supabase REST) hacia la arquitectura definitiva (React / Next.js / TypeScript / TailwindCSS / Zustand).*

---

## 📋 Contenido

1. [Visión General del Sistema](#-visión-general-del-sistema)
2. [Diagramas UML del Sistema (8 Diagramas Mermaid)](#-diagramas-uml-del-sistema)
   - [1. Diagrama de Arquitectura General del Sistema (Componentes PWA & Servidor)](#1-diagrama-de-arquitectura-general-del-sistema)
   - [2. Diagrama de Entidad-Relación (ERD - Modelo de Datos)](#2-diagrama-de-entidad-relación-erd---modelo-de-datos)
   - [3. Diagrama de Casos de Uso (Funcionalidades del Entrenador)](#3-diagrama-de-casos-de-uso)
   - [4. Diagrama de Secuencia: Sincronización Híbrida 24/7 (Local-Cloud Sync)](#4-diagrama-de-secuencia-sincronización-híbrida-247)
   - [5. Diagrama de Secuencia: Flujo de Entrenamiento en Vivo](#5-diagrama-de-secuencia-flujo-de-entrenamiento-en-vivo)
   - [6. Diagrama de Estados: Ciclo de Vida del Service Worker PWA](#6-diagrama-de-estados-ciclo-de-vida-del-service-worker-pwa)
   - [7. Diagrama de Clases y Módulos de Estado (JavaScript Core)](#7-diagrama-de-clases-y-módulos-de-estado)
   - [8. Diagrama de Arquitectura Objetivo (Target Architecture: React/Next.js/TypeScript)](#8-diagrama-de-arquitectura-objetivo)
3. [Plan Estratégico de Migración por Fases](#-plan-estratégico-de-migración-por-fases)
4. [Estrategia de Mantención de la Base de Datos y Supabase](#-estrategia-de-mantención-de-la-base-de-datos-y-supabase)

---

## 📖 Visión General del Sistema

**Romeo Personal Trainer** es una plataforma web PWA/SPA diseñada para optimizar la gestión de clientes, planificación de rutinas mensuales, ejecución de entrenamientos en tiempo real y seguimiento antropométrico corporal.

### Pilares Fundamentales de la Arquitectura Actual
- **Carga Síncrona Instantánea (0ms)**: La aplicación recupera el estado de los clientes y rutinas desde `localStorage` / `IndexedDB` en el milisegundo cero del arranque, eliminando parpadeos o pantallas en blanco en dispositivos móviles.
- **Sincronización Transparente 24/7**: Un proceso en segundo plano consulta la API REST de Supabase cada 15 segundos ejecutando una fusión inteligente (`mergeCloudAndLocal`) para compartir información en tiempo real entre múltiples celulares y computadoras.
- **Compatibilidad Multiplataforma**: Habilitada para iOS Safari (WebKit) y Android Chrome con manejo seguro de Service Worker (`Network-First` para código y `Cache-First` para multimedia).

---

## 📊 Diagramas UML del Sistema

### 1. Diagrama de Arquitectura General del Sistema

Este diagrama ilustra la separación de capas entre la interfaz del usuario en dispositivos móviles/escritorio, los motores de persistencia local y los servicios en la nube.

```mermaid
graph TD
    subgraph Cliente ["📱 Cliente (Browser / Mobile PWA / iOS & Android)"]
        UI["🎨 Interfaz de Usuario (HTML5 / CSS3 / Vanilla JS)"]
        SW["⚡ Service Worker (sw.js - Cache Engine v129)"]
        DBMemory["🧠 Memoria RAM Global (Object DB)"]
    end

    subgraph PersistenciaLocal ["💾 Almacenamiento Local (Dual Engine)"]
        LS["localStorage ('romeo_db')"]
        IDB["IndexedDB ('romeo_pt_fsh')"]
        FSA["File System Access API (Desktop Optional)"]
    end

    subgraph ServidorYNube ["☁️ Nube & Servidores Backend"]
        Vercel["🚀 Vercel Serverless (api/index.js)"]
        NodeServer["🟢 Node.js Express (server.js)"]
        Supabase["⚡ Supabase Cloud REST API ('romeo_store')"]
    end

    UI <--> DBMemory
    DBMemory <--> LS
    DBMemory <--> IDB
    DBMemory <--> FSA
    SW <--> UI
    
    DBMemory -- "Polling 15s / HTTP REST" --> Supabase
    Vercel -- "Servir PWA Sin Cache Overwrite" --> UI
    NodeServer -- "Servir Assets Estáticos" --> UI
```

---

### 2. Diagrama de Entidad-Relación (ERD - Modelo de Datos)

Representación de los modelos centrales de datos que constituyen el estado unificado `DB`.

```mermaid
erDiagram
    USUARIO ||--o{ RUTINA : "posee rutinas asignadas"
    USUARIO ||--o{ SESION : "ejecuta sesiones"
    USUARIO ||--o{ PROGRESO : "registra mediciones"
    RUTINA ||--o{ EJERCICIO : "contiene bloques de"
    PACK ||--o{ EJERCICIO : "plantilla global de"

    USUARIO {
        string id PK
        string nombre
        number edad
        string genero
        string email
        string telefono
        number tarifa
        number peso
        number estatura
        number grasaPct
        string objetivo
        string nivel
        object macros
        string fotoIniFrente
        string fotoIniPerfil
        string fotoIniEspalda
        string creado
        string actualizado
    }

    RUTINA {
        string id PK
        string usuarioId FK
        string nombre
        string mes
        number anio
        string tipo
        string grupo
        string dias
        number pesoIni
        number pesoFin
        array ejercicios
        string notas
        string creado
        string actualizado
    }

    EJERCICIO {
        string nombre
        string grupo
        string series
        string peso
        string descanso
        string imagen
        string notas
    }

    SESION {
        string id PK
        string usuarioId FK
        string rutinaId FK
        string fecha
        string hora
        string estado
        number duracionSeg
        number volumenKg
        number setsCompletados
        number setsTotal
        string notas
        string creado
    }

    PROGRESO {
        string id PK
        string usuarioId FK
        string fecha
        number mes
        number peso
        number pecho
        number cintura
        number cadera
        number brazoIzq
        number brazoDer
        number musloIzq
        number musloDer
        number pantorrilla
        number grasaPct
        string notas
    }

    PACK {
        string id PK
        string nombre
        string tipo
        string grupo
        array ejercicios
        string creado
    }
```

---

### 3. Diagrama de Casos de Uso

Muestra las interacciones principales que el Personal Trainer (Romeo) realiza dentro de la aplicación.

```mermaid
flowchart LR
    subgraph Actores ["👥 Actores del Sistema"]
        Entrenador["🏋️ Personal Trainer (Romeo)"]
        Cloud["☁️ Supabase Cloud DB"]
    end

    subgraph App ["📱 Casos de Uso - Romeo Personal Trainer PWA"]
        UC1("(👤 Registrar / Editar Cliente)")
        UC2("(📋 Crear / Asignar Rutinas y Packs)")
        UC3("(⚡ Ejecutar Entrenamiento en Vivo)")
        UC4("(⏱️ Controlar Timer & Checklist)")
        UC5("(📊 Registrar Progreso Corporal & Fotos)")
        UC6("(⚖️ Calcular Macronutrientes TMB)")
        UC7("(📦 Backup & Restauración JSON)")
        UC8("(🔄 Sincronización Automática 24/7)")
    end

    Entrenador --> UC1
    Entrenador --> UC2
    Entrenador --> UC3
    Entrenador --> UC4
    Entrenador --> UC5
    Entrenador --> UC6
    Entrenador --> UC7

    Cloud <--> UC8
    UC1 -. "auto-sync" .-> UC8
    UC2 -. "auto-sync" .-> UC8
    UC3 -. "auto-sync" .-> UC8
    UC5 -. "auto-sync" .-> UC8
```

---

### 4. Diagrama de Secuencia: Sincronización Híbrida 24/7

Detalla la carga instantánea en 0ms desde la memoria local y la sincronización continua en segundo plano con Supabase.

```mermaid
sequenceDiagram
    autonumber
    actor User as 📱 Usuario / Celular
    participant App as 💻 App (shared.js)
    participant Memory as 🧠 Estado RAM (DB)
    participant Local as 💾 LocalStorage / IDB
    participant Cloud as ☁️ Supabase REST API

    User->>App: Abrir PWA / Recargar Página
    App->>Local: Leer 'romeo_db' (Síncrono)
    Local-->>App: Devolver JSON almacenado
    App->>Memory: Poblar DB en milisegundo 0
    App->>User: Renderizar UI de inmediato (0ms parpadeo)

    Note over App,Cloud: Bucle en segundo plano (cada 15 segundos)
    App->>Cloud: SupabaseSync.fetchCloudData()
    Cloud-->>App: Devolver lista de registros en la nube

    App->>App: mergeCloudAndLocal(cloudArr, localArr)
    Note over App: Fusiona por ID respetando el timestamp 'actualizado' más reciente

    alt ¿Hubo cambios nuevos?
        App->>Local: Guardar DB actualizada
        App->>User: Disparar evento 'romeo_db_loaded' y actualizar UI en vivo
    else Sin cambios
        App->>App: Mantener estado actual
    end
```

---

### 5. Diagrama de Secuencia: Flujo de Entrenamiento en Vivo

Describe la ejecución de una sesión de entrenamiento con temporizador y cálculo de volumen en tiempo real.

```mermaid
sequenceDiagram
    autonumber
    actor Trainer as 🏋️ Entrenador
    participant UI as 🖥️ entrenamiento.html
    participant LiveEngine as ⚡ Live Training Engine
    participant Timer as ⏱️ Rest Timer (Web Audio API)
    participant Memory as 🧠 Estado DB

    Trainer->>UI: Seleccionar Cliente & Rutina
    Trainer->>UI: Clic en "Iniciar Sesión"
    UI->>LiveEngine: Iniciar cronómetro principal (setInterval)
    LiveEngine->>UI: Mostrar interfaz de entrenamiento en vivo

    loop Por cada serie completada
        Trainer->>UI: Marcar checkbox de serie
        UI->>LiveEngine: Sumar (Reps × Peso kg) al Volumen Total
        LiveEngine->>UI: Actualizar Ring de Progreso (%)
        LiveEngine->>Timer: Activar temporizador de descanso (ej. 60s)
        Timer-->>Trainer: Emite bip sonoro al llegar a 0s
    end

    Trainer->>UI: Clic en "Terminar Sesión"
    UI->>LiveEngine: Calcular resumen (Duración, Volumen kg, Sets)
    LiveEngine->>Memory: Agregar registro a DB.sesiones
    LiveEngine->>Memory: Guardar en LocalStorage & Sync Supabase
    UI->>Trainer: Mostrar pantalla de victoria / resumen
```

---

### 6. Diagrama de Estados: Ciclo de Vida del Service Worker PWA

Muestra cómo el Service Worker gestiona el almacenamiento en caché y la auto-actualización forzada.

```mermaid
stateDiagram-v2
    [*] --> Instalando: Registrar sw.js (CACHE_NAME v129)
    Instalando --> Instalado: Precargar ASSETS (HTML, CSS, JS, Img)
    Instalado --> Activando: skipWaiting() llamado
    Activando --> Activo: Purgar cachés antiguas (!= v129)

    state Activo {
        [*] --> EscuchandoFetch: Evento 'fetch' interceptado
        EscuchandoFetch --> EvaluandoRuta: ¿Es Código/Doc (HTML, JS, CSS)?
        
        EvaluandoRuta --> NetworkFirst: Sí (Es código)
        NetworkFirst --> ServirRed: Conexión online OK -> Actualizar caché
        NetworkFirst --> ServirCacheFallback: Sin conexión -> Servir desde caché

        EvaluandoRuta --> CacheFirst: No (Es imagen/fuente estática)
        CacheFirst --> ServirCache: Existe en caché -> Retornar inmediatamente
        CacheFirst --> ServirRedFallback: No existe -> Descargar de red
    }

    Activo --> Purgado: Nueva versión desplegada en servidor
    Purgado --> [*]
```

---

### 7. Diagrama de Clases y Módulos de Estado

Estructura de las funciones y objetos globales que componen la lógica de `shared.js`, `persist.js` y `api/index.js`.

```mermaid
classDiagram
    class DBState {
        +Array~Usuario~ usuarios
        +Array~Rutina~ rutinas
        +Array~Sesion~ sesiones
        +Array~Progreso~ progresos
        +Array~Pack~ packs
    }

    class SharedEngine {
        +CURRENT_APP_VERSION: string
        +loadDB() void
        +saveDB() Promise~void~
        +mergeCloudAndLocal(cloudArr, localArr) Array
        +buildTopbar(title, actionsHtml) string
        +buildBottomNav(activePage) string
        +buildSidebar(activePage) string
        +getActiveUser() Usuario
        +setActiveUser(id) void
    }

    class SupabaseSyncModule {
        +SUPABASE_URL: string
        +SUPABASE_KEY: string
        +isConfigured() boolean
        +fetchCloudData() Promise~Object~
        +saveCloudData(db) Promise~boolean~
        +sync() Promise~void~
    }

    class PersistDBModule {
        +init(onReady, onNeedPerm) void
        +get(key) Promise~Object~
        +set(key, value) Promise~boolean~
        +openIDB() Promise~IDBDatabase~
    }

    class ServerBackend {
        +expressApp: Express
        +get('/sw.js'): Direct SW stream without timestamp overwrite
        +use(static): Static file server
    }

    SharedEngine --> DBState : Gestiona
    SharedEngine --> SupabaseSyncModule : Invoca sincronización
    SharedEngine --> PersistDBModule : Invoca almacenamiento local
    ServerBackend --> SharedEngine : Servidor de entrega PWA
```

---

### 8. Diagrama de Arquitectura Objetivo (Target Architecture: React/Next.js/TypeScript)

Este diagrama define la arquitectura moderna objetivo para la migración definitiva del proyecto.

```mermaid
graph TD
    subgraph FrontendApp ["⚛️ Next.js 14 / Vite + React 18 + TypeScript"]
        subgraph UIComponents ["🎨 Componentes Atómicos (Radix UI / TailwindCSS)"]
            TopbarComp["Topbar.tsx"]
            BottomNavComp["BottomNav.tsx"]
            ClientCardComp["ClientCard.tsx"]
            WorkoutTimerComp["WorkoutTimer.tsx"]
            MetricsChartComp["MetricsChart.tsx (Recharts)"]
        end

        subgraph StateManagement ["🧠 Estado Global & Cache (Zustand + TanStack Query)"]
            UserStore["useUserStore (Zustand)"]
            WorkoutStore["useWorkoutStore (Zustand)"]
            SyncQuery["useSupabaseSync (TanStack Query)"]
        end
    end

    subgraph DataLayer ["🗄️ Capa de Datos & Persistencia"]
        ReactIDB["idb-keyval / IndexedDB"]
        SupabaseClient["@supabase/supabase-js (Client REST/Realtime)"]
    end

    UIComponents <--> StateManagement
    StateManagement <--> DataLayer
    DataLayer <--> SupabaseClient
```

---

## 🚀 Plan Estratégico de Migración por Fases

Para migrar esta aplicación de **Vanilla JS** a **Next.js / Vite + React + TypeScript** sin interrumpir la operación del entrenador ni perder datos de clientes, se seguirá el siguiente roadmap de 4 fases:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     FASE 1      │ ──> │     FASE 2      │ ──> │     FASE 3      │ ──> │     FASE 4      │
│ Creación Rama   │     │ Componentes     │     │ Migración       │     │ Despliegue      │
│ & Configuración │     │ UI & Zustand    │     │ Sincronización  │     │ Definitivo      │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Fase 1: Creación de la Rama Git y Entorno de Desarrollo
1. Crear una nueva rama independiente: `git checkout -b feature/migration-react-vite`.
2. Inicializar proyecto con Vite + React + TypeScript + TailwindCSS.
3. Migrar las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY`).

### Fase 2: Componentización y Gestión de Estado
1. Definir los tipos de TypeScript (`types/index.ts`) basados en las entidades de la documentación (`Usuario`, `Rutina`, `Sesion`, `Progreso`, `Pack`).
2. Crear la tienda Zustand (`stores/useGymStore.ts`) replicando la carga síncrona instantánea desde `localStorage`.
3. Construir los componentes UI reutilizables (TopBar, BottomNav, ClientCards, Timer).

### Fase 3: Migración de Módulos Complejos
1. **Entrenamiento en Vivo**: Reconstruir el cronómetro y el contador de volumen en un custom hook (`useLiveWorkout`).
2. **Progreso Antropométrico**: Reemplazar las gráficas SVG manuales por **Recharts** o **Tremor**.
3. **Nutrición y Calculadora de Macros**: Reconstruir la calculadora TMB interactiva con sliders en React Hook Form + Zod.

### Fase 4: Pruebas de Compatibilidad y Despliegue
1. Validar la importación/exportación de backups JSON antiguos para garantizar retrocompatibilidad del 100%.
2. Probar la PWA instalable en iOS Safari y Android Chrome.
3. Fusionar la rama `feature/migration-react-vite` hacia `main` y publicar la versión definitiva en Vercel.

---

## 🔒 Estrategia de Mantención de la Base de Datos y Supabase

- **Estructura de la Tabla Cloud**: La tabla `romeo_store` mantendrá su formato JSONB unificado durante la migración para no romper ninguna versión activa en celulares de clientes.
- **Validación de Schema**: El nuevo código en TypeScript incorporará esquemas de validación con **Zod** para prevenir la inyección de datos corruptos o malformados.
