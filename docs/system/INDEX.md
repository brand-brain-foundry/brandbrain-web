---
id: BBW-SYSTEM-INDEX
title: "Índice de contratos del sistema — brandbrain-web"
type: index
status: VIGENTE
version: 1.0
owner_repo: bbf-command-hub
subject_repo: brandbrain-web
created: 2026-11-05
updated: 2026-11-05
related: [BBW-DEPLOY-CONTRACT, BBW-PORTS, BBW-CONTENT-MODEL, BBW-MEDIA, BBW-TYPOGRAPHY-WEIGHTS, BBW-DESIGN-EXCEPTIONS, BBW-BEHAVIOR, P-BBW-77]
tags: [index, contratos, brandbrain-web, P-BBW-77]
---

# Índice de contratos del sistema — brandbrain-web

Los contratos de `docs/system/` se leen **bajo demanda** (P-BBW-77 D-2026-11-05): este índice indica cuándo es obligatorio leer cada uno.
Cada despacho nombra en su §2 los contratos que toca.

| Archivo | Qué gobierna | Leer cuando… |
|---|---|---|
| `DEPLOY_CONTRACT.md` | Hosting, CDN, cabeceras HTTP, redirecciones, caché, restricciones de runtime | tocas despliegue, dominio, cabeceras, redirecciones, caché o reglas del borde |
| `PORTS.md` | Registro de actores externos y adaptadores | añades o cambias un actor externo, una URL de llamada saliente o un puerto |
| `CONTENT_MODEL.md` | Modelo de contenido, locales, esquema de llaves, sustituciones | tocas `content/`, añades copy, cambias locales o el esquema |
| `MEDIA.md` | Maestros, derivados, contrato del pipeline de medios | tocas medios (imágenes, vídeo, iconos, manifesto) |
| `TYPOGRAPHY_WEIGHTS.md` | Sistema de pesos tipográficos, ejes de variable, rangos por familia | tocas `--bbf-weight-*`, añades una familia o cambias el eje |
| `DESIGN_EXCEPTIONS.md` | Registro de excepciones al sistema de diseño (EXC-BBW-xx) | registras, modificas o verificas una excepción al sistema de diseño |
| `BEHAVIOR.md` | Constantes de algoritmo de los sistemas dinámicos (S1–S11) | tocas `src/behavior/`, añades un sistema dinámico, re-mides cotas |

## Historia y secciones archivadas

Las secciones retiradas o suspendidas se mueven a `*_HISTORY.md` (nunca importados):
- `docs/system/BEHAVIOR_HISTORY.md` — secciones archivadas de `BEHAVIOR.md`
  (§3 S7 RETIRADO · §5 S2 RETIRADO · §2 tabla de S5 mientras siga ⏸ · notas fases 6e y 6k)
