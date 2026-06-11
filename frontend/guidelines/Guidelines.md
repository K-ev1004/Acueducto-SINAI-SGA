# Frontend Guidelines — Sinai SGA

## Componentes
- Componentes funcionales con hooks
- Archivos: PascalCase para componentes, camelCase para utilities
- Separar responsabilidades: un componente por archivo

## API
- Usar `api.ts` para todas las llamadas al backend
- Manejar errores 401 → redirigir a login
- Enviar `Authorization: Bearer <token>` en cada request

## Estilos
- Tailwind CSS utility classes
- Evitar CSS modules o archivos .css separados
- Usar colores de la paleta Tailwind, no colores hardcodeados

## Estados
- Cada vista debe manejar: loading, error, empty, success
- Mostrar spinner durante carga, mensaje si vacío

## Convenciones
- Interfaces TypeScript para props de componentes
- Tipar todas las variables de estado con useState<T>
- Comentarios solo para lógica no obvia
