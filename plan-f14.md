# F14 — Diseño sellado: Hemispheric producto serio (CLI inglés + multiusuario)

> Documento de la tarjeta **F14-T1**. Fija el modelo ANTES de tocar código. Regla de toda la fase: **sin romper nada**
> — los `.jsonl` ya guardados se leen igual, los flags en castellano siguen funcionando, `npm test` verde tras cada paso.
> Pendiente del OK del usuario antes de pasar a F14-T2.

## A) Multiusuario: campo `autor`

### A.1 — De dónde sale `autor` (determinista, sin red)
Prioridad al guardar un hecho, primera que exista gana:
1. `HEMI_USER` (variable de entorno) — override explícito, para CI o casos raros.
2. `git config user.email` del repo (lectura de fichero local, sin red) — identidad natural por persona en un repo de equipo.
3. `os.userInfo().username` — el usuario del sistema operativo.

Se normaliza (minúsculas, sin espacios). Si nada resuelve, `autor = 'unknown'`. Es un campo **nuevo y opcional** en el
hecho: `{ ..., autor }`.

### A.2 — Qué familias se separan por autor (y cuáles NO)
- **PERSONALES → sustitución por `(dimension, autor)`:** `identidad`, `preferencia`.
  Son de la persona. En un proyecto compartido, la `preferencia.editor` de Ana y la de Bob **coexisten**.
- **IMPERSONALES de valor único → sustitución por `dimension` (igual que hoy):** `proyecto`, `restriccion`.
  Describen el proyecto, no a una persona («el stack es Next» es verdad lo diga quien lo diga). No se tocan.
- **De "varios" (no sustituyen nunca) → `autor` solo anota:** `objetivo`, `pendiente`, `nota`, `hecho`, `enlace`,
  `aprendizaje`. Ya coexisten; `autor` queda como metadato para poder mostrar «quién lo apuntó».

Regex a introducir: `PERSONALES = /^(identidad|preferencia)(\.|$)/`.

### A.3 — Regla de compatibilidad con hechos LEGACY (sin `autor`) — clave para «no romper»
Un hecho ya guardado no tiene `autor` (campo nuevo). Reglas:
- **Lectura:** un hecho sin `autor` se lee y es válido (campo opcional). Se muestra sin autor o como «—».
- **Sustitución (familias personales):** al guardar `preferencia.X` con `autor = A`, sustituye a los vigentes de esa
  dimensión cuyo `autor` sea **A** **o esté ausente (legacy)**. NO toca los de otro autor conocido (B).
  - Por qué: antes del multiusuario había de hecho un solo autor; un hecho legacy sin autor se asume del que ahora
    edita. Esto mantiene **limpio el caso de un solo dev** (lo normal: el `preferencia.editor=vim` viejo SÍ se
    reemplaza por el nuevo), y a la vez separa a dos autores conocidos de aquí en adelante.
- **Impersonales/varios:** sin cambio respecto a hoy.

Resultado: cero hechos perdidos, cero duplicados en el caso de un solo usuario, separación real en equipo.

### A.4 — Dónde se muestra el autor
`recuerdo-vivo` / `session-start` / `--recall`: cuando un hecho personal tiene `autor` y hay más de un autor en juego,
se muestra «· by <autor>». Si solo hay un autor (caso normal), no se ensucia la salida.

## B) Residuo de marca: ruta de la memoria global
Hoy la memoria global de Hemispheric se guarda en `~/.config/**senzu**/` (residuo del carve-out). Para un producto serio
es mezcla de marca. **Decisión (sin romper):** leer de `~/.config/hemispheric/` y, si no existe, **caer a
`~/.config/senzu/`** (migración perezosa: lo que se escriba va ya a `hemispheric`). Nadie pierde su memoria global.
→ Se implementa junto a F14-T3 (toca `rutaMemoriaUsuario` en `lib.mjs`/`host.mjs`).

## C) CLI en inglés con alias en castellano (cero ruptura)
Mecanismo: una **tabla de alias** en el parseo de `cli/memory.mjs` (y `cli/search.mjs`). El flag inglés es el
**primario** (help, docs); el castellano queda como **alias** que apunta al mismo destino. Toda suite actual (escrita en
ES) sigue verde.

### C.1 — `cli/memory.mjs`
| Castellano (alias) | Inglés (primario) | Nota |
|---|---|---|
| `--guardar` | `--save` | acción |
| `--buscar` | `--search` | acción |
| `--recordar` | `--recall` | acción |
| `--contexto` | `--context` | acción |
| `--cortex` | `--cortex` | ya en inglés |
| `--lista` | `--list` | |
| `--olvidar` | `--forget` | |
| `--resolver` | `--resolve` | |
| `--abandonar` | `--abandon` | |
| `--abiertos` | `--open` | objetivos/pendientes abiertos |
| `--en-curso` | `--in-progress` | |
| `--duda` | `--doubt` | «creo que…» |
| `--fuente` | `--source` | valores: user/devlog/agent (alias de usuario/devlog/agente) |
| `--dimension` | `--dimension` | ya en inglés |
| `--valor` | `--value` | |
| `--claves` | `--keys` | |
| `--alcance` | `--scope` | valores: project/user (alias de proyecto/usuario) |
| `--idioma` | `--lang` | |
| `--historico` | `--history` | |
| `--desde` | `--since` | fecha desde / inicio de validez |
| `--hasta` | `--until` | fecha hasta / fin de validez |
| `--dias` | `--days` | |
| `--limite` | `--limit` | |
| `--presupuesto` | `--budget` | |
| `--motivo` | `--reason` | |
| `--enlazar` | `--link` | |
| `--enlaces` | `--links` | |
| `--cliente` | `--client` | |
| `--texto` | `--text` | |
| `--informe` | `--report` | |
| `--salida` | `--output` | confirmar semántica en T2 |
| `--todo` | `--all` | |
| `--nada` | `--none` | confirmar semántica en T2 |
| `--como` | `--as` | confirmar semántica en T2 |
| `--path` | `--path` | ya en inglés |
| `--json` | `--json` | ya en inglés |
| `--devlog` | `--devlog` | nombre propio, se mantiene |
| *(nuevo)* | `--author` (alias `--autor`) | multiusuario (F14-T3); normalmente autodetectado |

Valores de enum también con alias: `--scope project|user` ≡ `proyecto|usuario`; `--source user|devlog|agent` ≡
`usuario|devlog|agente`. Los nombres de **familia** ya aceptan inglés (mapa de alias existente: `preference→preferencia`…).

### C.2 — `cli/search.mjs`
| Castellano (alias) | Inglés (primario) |
|---|---|
| `--desde` | `--since` |
| `--hasta` | `--until` |
| `--max` | `--max` (ya) |
| `--tipo` | `--type` |
| `--solo-devlog` | `--only-devlog` |
| `--devlog` | `--devlog` |
| `--json` | `--json` |
| `--help` | `--help` |

## D) Familias en inglés para mostrar (F14-T4), canónico intacto
El **canónico interno sigue en castellano** (`identidad`, `preferencia`…) → los `.jsonl` NO cambian. Se añade un mapa
`canónico → etiqueta EN` solo para **mostrar** (`identity`, `preference`, `project`, `goal`, `pending`, `constraint`,
`note`, `fact`, `learning`, `link`). El input ya acepta inglés por el mapa de alias existente.

## E) Garantías «sin romper nada» (se verifican en cada tarjeta)
1. `hechos.jsonl` previos se leen (campo `autor` opcional; canónico de familias sin cambios).
2. Memoria global previa se lee (fallback `.config/senzu/`).
3. Flags en castellano siguen funcionando (alias) → las suites actuales (en ES) quedan verdes sin tocarlas.
4. `npm test` completo verde tras CADA tarjeta; si algo rompe, no se avanza.

## F) Flags cuya semántica exacta se confirma al implementar T2
`--salida` (`--output`), `--nada` (`--none`), `--como` (`--as`): leer el parseo real de `cli/memory.mjs` y ajustar el
nombre inglés si el significado pide otro. No bloquea el diseño.
