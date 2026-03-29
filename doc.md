
---

# 🎬 Proyecto: HoySeVe

**HoySeVe** es una plataforma web moderna diseñada para que los amantes del cine, las series y el anime puedan calificar títulos, escribir reseñas y gestionar sus listas de pendientes (Watchlist) en una comunidad activa.

---

## 🚀 1. Concepto y Lógica de Negocio (MVP)

El objetivo principal es ofrecer un sistema de puntuación comunitario confiable y una experiencia de usuario fluida.

### Funcionalidades Core:
* **Sistema de Calificación:** Escala del 1 al 10. Un usuario solo puede emitir una calificación por título (se actualiza si califica de nuevo).
* **Reseñas Opcionales:** Los usuarios pueden acompañar su nota con una opinión escrita.
* **Puntaje Global:** Cálculo dinámico del promedio de cada título basado en los votos de la comunidad.
* **Watchlist:** Lista personalizada de "Pendientes por ver".
* **Descubrimiento:** Top 10 Global y categorías (Anime, Películas, Series).
* **Perfiles de Usuario:** Historial de actividad y reputación del usuario.

---

## 🎨 2. Identidad Visual y UI/UX

La aplicación utiliza una estética **Premium Dark Mode** con acentos vibrantes.

* **Paleta de Colores:** Fondo carbón/azul marino profundo, paneles gris oscuro, acentos en **Cian Neón**.
* **Tipografía:** Limpia, moderna y minimalista (Sans-serif).
* **Componentes:** Basados en `shadcn/ui` con efectos de transparencia (Glassmorphism) en barras de búsqueda y navegación.

### Pantallas Definidas:
1.  **Home / Landing:** Banner destacado, Top 10 Global con números de ranking grandes y grilla de categorías.
2.  **Login / Registro:** Formularios limpios con sistema de pestañas (Tabs).
3.  **Detalle del Título:** Póster cinematográfico, sinopsis, tráiler embebido y el panel de acción (Estrellas + Cuadro de reseña).
4.  **Watchlist:** Gestión de biblioteca personal con estados (Pendiente/Visto).
5.  **Perfil de Usuario:** Visualización de actividad, estadísticas y colecciones personales.

---

## 🛠 3. Stack Tecnológico

Seleccionado por su rendimiento, SEO y control total de la infraestructura.

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | Next.js (App Router) |
| **Estilos** | Tailwind CSS + shadcn/ui |
| **Backend** | Next.js Server Actions |
| **ORM** | Drizzle ORM (Ligero y Type-safe) |
| **Base de Datos** | PostgreSQL (Contenedor Docker) |
| **Autenticación** | Auth.js (NextAuth.js) |
| **Infraestructura** | VPS propio gestionado con **Dokploy** (PaaS) |
| **APIs Externas** | TMDB API (Cine/Series) y Jikan API (Anime) |

---

## 📊 4. Modelo de Datos (Drizzle Schema)

Estructura de tablas para la base de datos PostgreSQL:

```typescript
// Tablas principales del sistema
export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  image: text("image"),
});

export const titles = pgTable("title", {
  id: integer("id").primaryKey(), // ID proveniente de TMDB
  name: text("name").notNull(),
  type: text("type").notNull(), // 'movie', 'anime', 'series'
  synopsis: text("synopsis"),
  posterPath: text("poster_path"),
  averageScore: real("average_score").default(0),
  totalVotes: integer("total_votes").default(0),
});

export const ratings = pgTable("rating", {
  userId: text("user_id").notNull().references(() => users.id),
  titleId: integer("title_id").notNull().references(() => titles.id),
  score: integer("score").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.titleId] }),
}));

export const watchlist = pgTable("watchlist", {
  userId: text("user_id").notNull().references(() => users.id),
  titleId: integer("title_id").notNull().references(() => titles.id),
  status: text("status").default("pending"),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.titleId] }),
}));
```

---

## 🏗 5. Estado de la Infraestructura

* **Servidor:** VPS activo.
* **Gestor:** **Dokploy** instalado y configurado correctamente.
* **Base de Datos:** PostgreSQL lista para ser aprovisionada en Dokploy.

---

## 📅 6. Próximos Pasos

1.  **Configuración de Auth.js:** Implementar proveedores de autenticación (Google/GitHub y Credenciales).
2.  **Integración de API TMDB:** Crear el servicio de búsqueda para alimentar los títulos dinámicamente.
3.  **Desarrollo de Server Actions:** Lógica para insertar calificaciones y recalcular promedios.
4.  **Maquetación con shadcn/ui:** Traducir los mockups visuales a componentes reales de React.

---
