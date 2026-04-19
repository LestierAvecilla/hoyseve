# Merge Request - Consolidado Mayo 2026

**Fecha:** 19 de Abril 2026
**Branch:** `main` → `chore/consolidate-may-2026`
**Estado:** Draft

---

## Resumen

Este MR consolida todos los cambios pendientes de desarrollo:

- **Feed de actividad** con timeline de seguidos
- **Sistema de follows** (seguir/dejar de seguir usuarios)
- **Perfil público** con username personalizable
- **Bio de usuario** editable
- **Migraciones de DB** (activities, follows, username, bio)
- **Mejoras de UI** (avatar selector, drawers, follow button)
- **Ajustes de deployment** (middleware, configs)
- **Auth con Google** (mejoras en login)

---

## Tabla de Cambios

### Database Migrations

| Archivo | Cambio |
|---------|--------|
| `drizzle/0001_magical_madame_masque.sql` | Tablas `activities` y `follows` |
| `drizzle/0002_public_user_handles.sql` | Columna `username` en `users` |
| `drizzle/0003_youthful_sersi.sql` | Columna `bio` y ajuste tipo `username` |
| `drizzle/meta/_journal.json` | Journal actualizado con 4 entradas |

### Features Nuevos

| Archivo/Directorio | Cambio |
|--------------------|--------|
| `src/app/(main)/feed/` | Página de feed de actividad |
| `src/app/(main)/profile/[username]/` | Página de perfil público |
| `src/app/(main)/profile/edit/` | Página de edición de perfil |
| `src/app/api/feed/` | API de feed de actividad |
| `src/app/api/followers/` | API de seguidores |
| `src/app/api/following/` | API de seguimiento |
| `src/app/api/follows/` | API de follow/unfollow |
| `src/app/api/users/` | API de usuarios |
| `src/components/feed/` | Componentes del feed |
| `src/components/profile/avatar-selector.tsx` | Selector de avatar |
| `src/components/profile/follow-button.tsx` | Botón seguir/dejar |
| `src/components/profile/followers-drawer.tsx` | Drawer de seguidores |
| `src/components/profile/following-drawer.tsx` | Drawer de seguimiento |
| `src/components/profile/hall-of-fame.tsx` | Hall de la fama |
| `src/components/profile/metrics-section.tsx` | Métricas del perfil |
| `src/components/profile/profile-edit-form.tsx` | Form de edición |
| `src/components/profile/profile-header.tsx` | Header del perfil |
| `src/components/profile/public-profile-client.tsx` | Client del perfil público |
| `src/components/profile/user-card.tsx` | Card de usuario |
| `src/components/shared/` | Componentes compartidos |
| `src/components/ui/sheet.tsx` | Componente Sheet (drawer) |
| `src/lib/validation/` | Validaciones Zod |
| `src/types/` | Tipos TypeScript |
| `middleware.ts` | Middleware de auth |
| `vitest.config.ts` | Config de tests |
| `src/setup-tests.ts` | Setup de tests |

### Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `next.config.ts` | Ajustes para deploy |
| `package.json` | Dependencias actualizadas |
| `package-lock.json` | Lock actualizado |
| `src/app/(auth)/login/page.tsx` | Login con Google mejorado |
| `src/app/(main)/anime/[id]/page.tsx` | Link al perfil del usuario |
| `src/app/(main)/profile/page.tsx` | Redirección a perfil público |
| `src/app/(main)/title/[type]/[id]/page.tsx` | Link al perfil |
| `src/app/api/auth/register/route.ts` | Soporte para username |
| `src/app/api/ratings/route.ts` | Registro de actividad |
| `src/app/api/watchlist/route.ts` | Registro de actividad |
| `src/auth.ts` | Configuración de auth mejorada |
| `src/components/layout/navbar.tsx` | Links a perfil y feed |
| `src/components/layout/sidebar.tsx` | Navegación actualizada |
| `src/components/profile/profile-tabs.tsx` | Tabs de seguir/seguidores |
| `src/components/providers.tsx` | Auth providers |
| `src/components/title/rating-panel.tsx` | Link al perfil |
| `src/components/title/review-card.tsx` | Link al perfil |
| `src/components/ui/button.tsx` | Props de variants |
| `src/lib/i18n.ts` | Sistema de i18n |
| `src/lib/schema.ts` | Esquema actualizado |
| `src/favicon.ico` | Favicon actualizado |

### Archivos Eliminados

| Archivo | Razón |
|---------|-------|
| `src/proxy.ts` | Ya no necesario (middleware取代) |

---

## Migración de DB (Producción)

### Migration 0001 - activities y follows
```sql
CREATE TABLE "activities" (...)
CREATE TABLE "follows" (...)
-- FK constraints, indexes
```

### Migration 0002 - username
```sql
ALTER TABLE "users" ADD COLUMN "username" varchar(20);
ALTER TABLE "users" ADD COLUMN "username_changed_at" timestamp;
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");
CREATE UNIQUE INDEX "idx_users_username_lower" ON "users" (LOWER(username)) WHERE username IS NOT NULL;
```

### Migration 0003 - bio
```sql
DROP INDEX "idx_users_username_lower";
ALTER TABLE "users" ALTER COLUMN "username" SET DATA TYPE varchar(20);
ALTER TABLE "users" ADD COLUMN "bio" text;
```

### Orden de Aplicación
```bash
drizzle-kit migrate
# O apply manual en orden:
# 1. 0001_magical_madama_masque.sql
# 2. 0002_public_user_handles.sql
# 3. 0003_youthful_sersi.sql
```

---

## Checklist de Verificación

- [ ] Migraciones aplicadas en producción
- [ ] Variables de entorno configuradas en prod
- [ ] Middleware desplegado
- [ ] Tests pasando (`npm test`)
- [ ] Build exitoso (`npm run build`)

---

## Breaking Changes Potenciales

1. **`username` en users** - Nullable pero único, requiere coordinación si hay usuarios existentes
2. **`middleware.ts`** - Nuevo middleware de auth, verificar que no bloquee rutas públicas
3. **Auth config** - Posibles cambios en NextAuth config

---

## Notas

- `gh pr create` no disponible en este contexto, crear PR manualmente en GitHub
- Considerar hacer backup de DB antes de aplicar migraciones
- El favicon cambió de ~26KB a ~4KB (optimización)
