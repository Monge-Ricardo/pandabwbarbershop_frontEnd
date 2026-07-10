# Programación Funcional y Expresiones Lambda en SharkHub (Módulo 1)

Este documento detalla la solución a una problemática del negocio mediante el uso del paradigma de **Programación Funcional (PF)** y **Expresiones Lambda (funciones flecha)** dentro del frontend desarrollado con **React + TypeScript**.

---

## 1. Problemática a Resolver

En la consola de control del cliente (Dashboard), es fundamental proveer indicadores de resumen en tiempo real para mejorar la experiencia del usuario (UX) y brindarle retroalimentación inmediata sobre sus hábitos y agenda:
1. **Citas Activas**: Cuántas citas pendientes o confirmadas tiene programadas el cliente (excluyendo cancelaciones).
2. **Inversión Total**: La suma total del dinero invertido por el cliente en servicios ya completados y confirmados.
3. **Barbero Favorito**: El barbero que el cliente ha frecuentado más veces en su historial.

### El Desafío del Enfoque Tradicional (Imperativo)
Tradicionalmente, esto se implementaría usando bucles `for` o `forEach` con múltiples variables mutables globales actuando como acumuladores y contadores. Dicho enfoque imperativo tiene las siguientes desventajas:
- **Efectos secundarios (Side Effects)**: Las variables acumuladoras externas son propensas a ser modificadas por otros bloques de código.
- **Dificultad de lectura**: Código más largo y acoplado al estado temporal.
- **Complejidad de pruebas**: Difícil de probar de forma aislada.

---

## 2. Propuesta de Diseño Funcional

Proponemos una solución declarativa basada en el **paradigma funcional puro** utilizando **expresiones lambda (funciones de flecha de TypeScript)** y pipelines de operaciones inmutables (`filter`, `map`, `reduce`).

### Flujo del Pipeline de Datos (Inversión Total):
```
[Lista de Citas]
      │
      ▼  (Filter: Citas confirmadas)
[Citas Confirmadas]
      │
      ▼  (Map: Extraer precio del servicio)
[Precios (Numéricos)]
      │
      ▼  (Reduce: Acumular la suma total)
[Inversión Total (Valor Único)]
```

---

## 3. Implementación de la Solución (Código TypeScript)

La lógica funcional está implementada directamente en el componente [Dashboard.tsx](file:///c:/Users/andre/Desktop/ESPE/SEMESTRE%205/WEB%20AVANZADO/Group%20Repository/pandabwbarbershop_frontEnd/modulo1/src/pages/Dashboard.tsx#L188-L208).

A continuación se detalla el fragmento de código funcional:

```typescript
// ==========================================================================
// 💡 PARADIGMA FUNCIONAL Y EXPRESIONES LAMBDA (Cálculo de estadísticas en tiempo real)
// ==========================================================================

// 1. FILTRADO INMUTABLE: Contar citas activas (no canceladas)
const activeAppointmentsCount = appointments
  .filter(app => app.status !== 'cancelled').length;

// 2. PIPELINE DE TRANSFORMACIÓN Y REDUCCIÓN: Calcular la inversión acumulada
const totalInvestment = appointments
  .filter(app => app.status === 'confirmed')                // Filtra solo citas confirmadas (Lambda)
  .map(app => app.price || 0)                                // Mapea/Transforma a un arreglo de precios (Lambda)
  .reduce((accumulator, price) => accumulator + price, 0);   // Reduce/Suma todos los precios (Lambda)

// 3. REDUCCIÓN Y COMPARACIÓN: Encontrar el barbero favorito
// A. Reduce las citas para obtener un mapa de frecuencias: { "Barbero A": 3, "Barbero B": 1 }
const barberCounts = appointments
  .filter(app => app.status !== 'cancelled')
  .reduce((acc, app) => {
    acc[app.barber_name] = (acc[app.barber_name] || 0) + 1;  // Acumula frecuencias inmutablemente
    return acc;
  }, {} as Record<string, number>);

// B. Convierte a parejas [key, value] y reduce buscando el barbero con el conteo más alto
const favoriteBarber = Object.entries(barberCounts)
  .reduce((max, current) => current[1] > max[1] ? current : max, ['', 0])[0] || 'Ninguno';
```

---

## 4. Justificación del Uso de Programación Funcional

1. **Expresiones Lambda (`=>`)**: Se utilizan lambdas cortas y puras para definir criterios en cada etapa. Por ejemplo, `app => app.status !== 'cancelled'` es una función anónima pura que evalúa un objeto cita y retorna un booleano sin modificar el objeto de origen.
2. **Inmutabilidad**: Las funciones `.filter()`, `.map()`, y `.reduce()` devuelven valores o colecciones completamente nuevas. El arreglo original de citas (`appointments`) nunca es modificado, previniendo errores por referencias colaterales.
3. **Composición de Operadores**: Permite encadenar operaciones secuenciales de forma muy legible, asemejándose a consultas SQL estructuradas pero ejecutadas en el navegador del cliente.
4. **Legibilidad**: El código describe **"qué hacer"** (declarativo) en lugar de **"cómo hacerlo paso a paso con contadores"** (imperativo).
