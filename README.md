# Consulta de Valores Pendientes

Aplicación web desarrollada con React + Vite para la consulta y pago de valores pendientes, integrada con PlacetoPay como pasarela de pago.

## Características

- Consulta de valores pendientes mediante cédula/RUC
- Sistema de verificación CAPTCHA
- Visualización detallada de deudas pendientes
- Selección múltiple de deudas a pagar
- Integración con PlacetoPay para procesamiento de pagos
- Manejo de transacciones pendientes
- Interfaz responsiva con Ant Design
- Validación de documentos de identidad
- Sistema de ordenamiento cronológico de deudas

## Tecnologías

- React 18
- Vite
- Ant Design (antd)
- Axios para peticiones HTTP
- ESLint para linting
- React Router DOM para navegación

## Requisitos Previos

- Node.js (versión recomendada: 18 o superior)
- npm o yarn

## Instalación

1. Clonar el repositorio
```bash
git clone [url-del-repositorio]
```

2. Instalar dependencias
```bash
npm install
```

## Configuración

El proyecto utiliza un archivo de configuración en `src/config/config.js` donde se deben establecer las variables de entorno necesarias:

- API_BASE_URL
- API_DEUDAS_URL
- Endpoints necesarios
- Recursos (imágenes y logos)

## Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

## Construcción

Para construir el proyecto para producción:

```bash
npm run build
```

## Linting

Para ejecutar el linting del código:

```bash
npm run lint
```

## Estructura del Proyecto

```
├── src/
│   ├── assets/          # Recursos estáticos (imágenes, logos)
│   ├── components/      # Componentes React
│   │   ├── ConsultaForm.jsx
│   │   ├── FaqPlace.jsx
│   │   ├── Footer.jsx
│   │   ├── Header.jsx
│   │   ├── HistorialTransacciones.jsx
│   │   ├── PaymentModal.jsx
│   │   └── PaymentStatus.jsx
│   ├── config/         # Configuración de la aplicación
│   ├── App.jsx         # Componente principal
│   └── main.jsx        # Punto de entrada
├── public/             # Archivos públicos
├── index.html          # HTML principal
└── vite.config.js      # Configuración de Vite
```

## Características de Seguridad

- Validación de documentos de identidad (cédula/RUC)
- Sistema CAPTCHA para prevenir ataques automatizados
- Ofuscación de datos sensibles
- Manejo seguro de sesiones de pago

## Flujo de Pago

1. Consulta de valores pendientes
2. Selección de deudas a pagar
3. Verificación de transacciones pendientes
4. Integración con PlacetoPay
5. Seguimiento del estado de la transacción

## Mantenimiento

- Ejecutar `npm run lint` regularmente para mantener la calidad del código
- Mantener las dependencias actualizadas con `npm update`
- Revisar periódicamente las actualizaciones de seguridad