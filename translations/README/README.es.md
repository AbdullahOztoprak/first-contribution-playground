<h1 align="center">First Contribution Playground</h1>
<p align="center">
  <strong>Un pequeño parque de juegos de código abierto que ayuda a los principiantes a hacer su primer pull request real.</strong>
</p>
<p align="center">
  Empieza con una pequeña corrección de documentación, traducción de README, un juego para principiantes o una pequeña mejora de UI.
</p>
<p align="center">
  <a href="https://abdullahoztoprak.github.io/first-contribution-playground">Sitio en Vivo</a> |
  <a href="https://github.com/AbdullahOztoprak/first-contribution-playground/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22">Buenas Primeras Issues</a> |
  <a href="#elige-tu-primera-contribucion">Elige un Camino</a> |
  <a href="CONTRIBUTING.md">Guía de Contribución</a>
</p>
<p align="center">
  <img src="https://img.shields.io/github/stars/AbdullahOztoprak/first-contribution-playground?style=flat-square" alt="Estrellas">
  <img src="https://img.shields.io/github/forks/AbdullahOztoprak/first-contribution-playground?style=flat-square" alt="Forks">
  <img src="https://img.shields.io/github/contributors/AbdullahOztoprak/first-contribution-playground?style=flat-square" alt="Contribuidores">
  <img src="https://img.shields.io/github/issues/AbdullahOztoprak/first-contribution-playground/good%20first%20issue?style=flat-square" alt="Buenas primeras issues">
</p>

---

## Estado del Proyecto

- Proyecto en etapa temprana con mantenimiento activo
- Se reciben con agrado los pull requests de principiantes
- Se aceptan traducciones, juegos, documentación y pequeñas mejoras del sitio web
- Tiempo típico de revisión: 24-72 horas cuando los mantenedores están activos
- Mejor primer paso: elige una `good first issue`

---

## ¿Qué es esto?

**First Contribution Playground** es un repositorio de código abierto apto para principiantes diseñado para practicar el flujo de trabajo real de GitHub.

Puedes contribuir:

- Corrigiendo un pequeño error tipográfico o problema de documentación
- Traduciendo la documentación a tu idioma
- Añadiendo un pequeño juego de CLI, web o de algoritmos
- Mejorando la documentación y guías para principiantes
- Solucionando pequeños problemas del sitio web o del repositorio

El objetivo no es ser perfecto. El objetivo es aprender el flujo de trabajo: fork, rama, edición, commit, push, abrir un PR, recibir comentarios y fusionar (merge).

---

## Por qué construí esto

Muchos desarrolladores juniors quieren contribuir al código abierto, pero la mayoría de los repositorios se sienten demasiado grandes o intimidantes para un primer PR.

Construí este proyecto para crear un lugar más pequeño y guiado donde los principiantes puedan practicar con issues, ramas, pull requests, comprobaciones de CI, revisiones y fusiones sin necesidad de entender un código base enorme primero.

---

## Aspectos Destacados de Mantenimiento

Este proyecto es intencionalmente simple, pero incluye las piezas de mantenimiento que un repositorio de código abierto real necesita:

- Validación automatizada de PR para juegos, traducciones, datos generados y reglas de seguridad
- Etiquetas de issues aptas para principiantes que GitHub puede mostrar a distribuidores por primera vez
- Sitio de GitHub Pages generado a partir de datos del repositorio
- Índices generados de juegos, contribuidores y tablas de clasificación
- Comprobaciones anti-abuso y comentarios de CI amigables para nuevos contribuidores
- Flujos de trabajo separados para traducción, juegos, etiquetas y tareas de incorporación comunitaria

---

## Para Reclutadores

Este repositorio no es solo un ejercicio de código. Es un pequeño proyecto de mantenimiento de código abierto donde trabajé en:

- incorporación y documentación para contribuidores
- diseño del flujo de trabajo de issues y pull requests de GitHub
- validación automatizada con GitHub Actions
- generación de sitios estáticos con Astro y TypeScript
- datos JSON generados para juegos, contribuidores y tablas de clasificación
- límites de seguridad para aceptar código enviado por principiantes

El proyecto es intencionalmente pequeño, pero demuestra cómo pienso sobre la experiencia del desarrollador, automatización, mantenibilidad y compromisos técnicos.

---

## Nuestra Promesa a los Principiantes

- Ninguna pregunta es demasiado pequeña.
- No necesitas ser perfecto.
- Explicamos los cambios solicitados de manera respetuosa.
- Te ayudamos a solucionar tu primer PR.
- Tu contribución será tratada con seriedad.

---

## Elige tu Primera Contribución

| Camino | Ideal para | Tiempo | Inicio |
|---|---|---:|---|
| Traducir README | Contribuidores sin código | 10-20 min | [Issues de traducción](https://github.com/AbdullahOztoprak/first-contribution-playground/issues?q=is%3Aissue+is%3Aopen+label%3A%22%F0%9F%8C%8D+translation%22) |
| Mejorar docs | Escritores y aprendices | 10-30 min | [Issues de docs](https://github.com/AbdullahOztoprak/first-contribution-playground/issues?q=is%3Aissue+is%3Aopen+label%3A%22%F0%9F%93%9A+documentation%22) |
| Añadir un juego CLI | Principiantes de Python o JavaScript | 30-60 min | [Guía de juegos](CONTRIBUTING.md#submitting-a-game) |
| Añadir un juego web | Principiantes de HTML/CSS/JS | 45-90 min | [Guía de juegos](CONTRIBUTING.md#submitting-a-game) |
| Corregir UI del sitio web | Principiantes de Frontend | 30-90 min | [Issues abiertas](https://github.com/AbdullahOztoprak/first-contribution-playground/issues) |

---

## No se Requiere Configuración Local

Para tareas de documentación y traducción, puedes hacer tu primer PR directamente desde el sitio web de GitHub:

1. Abre el archivo en GitHub.
2. Haz clic en el ícono del lápiz.
3. Realiza tu edición.
4. Haz clic en **Commit changes**.
5. Selecciona **Create a new branch**.
6. Abre un pull request.

Esta es la forma más fácil de hacer una primera contribución sin instalar Git localmente.

---

## Antes de Empezar una Issue

Para evitar trabajo duplicado:

1. Abre la issue en la que deseas trabajar.
2. Comenta: `I'd like to work on this`.
3. Espera a que un mantenedor confirme o añada la etiqueta `claimed`.
4. Abre tu PR e incluye `Closes #NUMERO_DE_ISSUE` en la descripción.

Las issues reclamadas que permanezcan inactivas pueden ser liberadas después de 7 días para que otro principiante pueda intentarlo.

---

## Estructura del Repositorio

```text
first-contribution-playground/
├── games/
│   ├── cli/               # Juegos basados en terminal
│   ├── web/               # Juegos basados en navegador
│   └── algorithm/         # Acertijos y desafíos de algoritmos
├── translations/
│   ├── README/            # Traducciones del README
│   ├── CONTRIBUTING/      # Traducciones de la guía de contribución
│   └── guides/            # Traducciones de guías
├── data/                  # Datos generados y esquemas
├── scripts/               # Scripts de construcción y validación
├── web/                   # Sitio web Astro
├── docs/                  # Guías y notas de arquitectura
└── .github/               # Plantillas y automatización de flujos de trabajo
