const config = {
    /* API_BASE_URL: 'https://dev.daule.gob.ec:8443',
    API_DEUDAS_URL: 'https://dev.daule.gob.ec:4000', */
    DEV: {
        API_BASE_URL: 'https://dev.daule.gob.ec:8443',
        API_DEUDAS_URL: 'https://dev.daule.gob.ec:4000',
        API_EGOB_URL: 'http://192.168.21.50:8085',
        ACCESS_TOKEN_EGOB_PAGO_FACTURA: 'TestTKPLACEtoPAY',
        ACCES_TOKEN_VENTA_FORMULARIO: 'Mun_Daule',
        API_IPRUS: 'http://192.168.23.28:8080',
        API_DEUDAS_IPRUS: 'http://192.168.21.52:3001'
    },
    PRO: {
        API_BASE_URL: 'https://consultas.daule.gob.ec:8443',
        API_DEUDAS_URL: 'https://consultas.daule.gob.ec:4000',
        API_EGOB_URL: 'https://servicios.daule.gob.ec:8085',
        ACCESS_TOKEN_EGOB_PAGO_FACTURA: 'UFRQYXlQcmQ2ODk3',
        API_IPRUS: 'http://192.168.23.28:8080'
    },
    endpoints: {
        // Endpoints de PayButton
        payButtonSessions: '/api/payButtonSessionsV2/agregar',
        payButtonSessionStatus: '/api/payButtonSessionsV2GetRequestIdIdPasarela',
        payButtonPendientes: '/api/payButtonSessionsV2/pendientes',

        // Endpoints de Clientes
        clientesInfo: '/api/clientes',
        enviarOTP: '/api/clientes/enviarOTPValidacionCorreoCliente',
        transaccionesClientes: '/api/payButtonSessionsV2/transaccionesClientes',

        // Endpoints de Deudas
        consultarDeudas: '/api/consultar-deudas',
        createSession: '/api/create-session',

        // Endpoints de express
        placetopayGetRequestInformation: '/api/get-request-information',
        actualizarEstado: '/api/payButtonSessionsV2/actualizarEstado',

        pagoFacturas: '/api/pagar-facturas',
        // Endpoints de EGOB /it/rest/Banca/general/pagar

        // Endpoints de Servicio IPRUS
        prediosPorIdentificacion: '/predios-identificacion',
        generarIprus: '/registrar-iprus',
        enviarIprusCorreo: '/enviar-iprus-correo/',
        obtenerIprus: '/archivo/',

        // Endpoints de API_BASE_URL 
        detalleCertificado: '/api/certificacion/detalle',
        agregarFactura: '/api/facturas/agregar',
        agregarOrdenCertificado: '/api/ordenCertificado/agregar',

        //Endpoint Vender Formulario
        venderFormularios : '/it/rest/formularios/venderFormularios',

        // Endpoint IPRUS pendientes de pago
        iprusPendientesPago: '/api/iprus/verificar-pendientes',

        // Endpoint Obtener deuda de predio
        deudaPredio: '/api/deuda-predio'
    },
    // Servicios externos
    externalServices: {
        timeApi: 'https://prod.daule.gob.ec/api/current-time',
        ipifyApi: 'https://api.ipify.org?format=json',
    },
    // URLs de recursos
    resources: {
        logo: 'https://www.daule.gob.ec/wp-content/uploads/2025/01/Logo.png',
        placeToPayLogo: 'https://static.placetopay.com/placetopay-logo.png',
        franquicias: 'https://www.daule.gob.ec/wp-content/uploads/2025/01/franquicias.jpg',
        privacyPolicy: 'https://www.daule.gob.ec/wp-content/uploads/2025/01/TERMINOS-Y-CONDICIONES-PARA-LA-UTILIZACION-DEL-CANAL-BOTON-DE-PAGOS-GAD-MUNICIPAL-DEL-CANTON-DAULE-1.pdf',
        actualizacionDatos: 'https://daule.gob.ec/actualizacion-de-datos/',
        actualizacionCliente: 'https://consultas.daule.gob.ec/tramites-linea/actualizar-cliente',
        Politic: 'https://www.daule.gob.ec/wp-content/uploads/2025/01/Politica-de-tratamiento-de-datos-personales-del-GAD-Municipal-de-Daule.pdf',
        logoPlace: 'https://static.placetopay.com/placetopay-logo-square.svg',
        bannerRemision: 'https://www.daule.gob.ec/wp-content/uploads/2025/04/Banner-Remision.webp',

    },
    constantes: {
        IPRUS_FORM_ID: 86,
        IPRUS_FORM_AURORA_ID: 87,
        idModuloIprus: 21
    },
    environment: 'DEV' // Cambia a 'PRO' en producción
};

export default config;
