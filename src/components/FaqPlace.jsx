import React from 'react';
import {Collapse, Divider, Typography} from 'antd';

const { Title } = Typography;

function FaqPlace() {
    const collapseStyle = {header:{fontWeight: 'bolder'}};
    const comercio = 'GOBIERNO AUTÓNOMO DESCENTRALIZADO ILUSTRE MUNICIPALIDAD DEL CANTÓN DAULE';
    const correoComercio = 'tesoreria@daule.gob.ec'
    const items = [
        {
          key: '1',
          label: '¿Qué es Placetopay?',
          children: <p>Placetopay es la plataforma de pagos electrónicos que usa el <b>{comercio}</b> para procesar en línea las transacciones generadas en la tienda virtual con las formas de pago habilitadas para tal fin.</p>,
          styles: collapseStyle
        },
        {
          key: '2',
          label: '¿Cómo puedo pagar?',
          children: <p>En la tienda virtual del <b>{comercio}</b> usted podrá realizar su pago con los medios habilitados para tal fin. Usted, de acuerdo a las opciones de pago escogidas por el comercio, podrá pagar a través Diners, Discover, Visa y MasterCard de todos los bancos con pago corriente y en los diferido, únicamente las tarjetas emitidas por Banco Pichincha, Diners, Loja, BGR y Manabí.</p>,
          styles: collapseStyle
        },
        {
          key: '3',
          label: '¿Es seguro ingresar mis datos bancarios en este sitio web?',
          children: <><p>Para proteger tus datos el <b>{comercio}</b> delega en Placetopay la captura de la información sensible. Nuestra plataforma de pagos cumple con los más altos estándares exigidos por la norma internacional PCI DSS de seguridad en transacciones con tarjeta de crédito. Además tiene certificado de seguridad SSL expedido por GeoTrust una compañía Verisign, el cual garantiza comunicaciones seguras mediante la encriptación de todos los datos hacia y desde el sitio; de esta manera, te podrás sentir seguro a la hora de ingresar la información de su tarjeta.</p>
                    <p>Durante el proceso de pago, en el navegador se muestra el nombre de la organización autenticada, la autoridad que lo certifica y la barra de dirección cambia a color verde.</p>
                    <p>Estas características son visibles de inmediato y dan garantía y confianza para completar la transacción en Placetopay.</p></>,
          styles: collapseStyle
        },
        {
          key: '4',
          label: '¿Puedo realizar el pago cualquier día y a cualquier hora?',
          children: <p>Sí, en el <b>{comercio}</b> podrás realizar tus compras en línea los 7 días de la semana, las 24 horas del día a sólo un clic de distancia.</p>,
          styles: collapseStyle
        },        
        {
          key: '5',
          label: '¿Puedo cambiar la forma de pago?',
          children: <p>Si aún no has finalizado tu pago, podrás volver al paso inicial y elegir la forma de pago que prefieras. Una vez finalizada la compra no es posible cambiar la forma de pago.</p>,
          styles: collapseStyle
        },
        {
          key: '6',
          label: '¿Pagar electrónicamente tiene algún valor para mí como comprador?',
          children: <p>No, los pagos electrónicos realizados a través de Placetopay no generan costos adicionales para el comprador.</p>,
          styles: collapseStyle
        },
        {
          key: '7',
          label: '¿Qué debo hacer si mi transacción no concluyó?',
          children: <><p>En primera instancia deberás revisar si llegó un mail de confirmación del pago en tu cuenta de correo electrónico (la inscrita en el momento de realizar el pago), en caso de no haberlo recibido, deberás contactar a {correoComercio} para confirmar el estado de la transacción.</p>
                    <p>En caso que tu transacción haya declinado, debes verificar si la información de la cuenta es válida, está habilitada para compras no presenciales y si tienes cupo o saldo disponible. Si después de esto continua con la declinación debes comunicarte con el <b>{comercio}</b>. En última instancia, puedes remitir tu solicitud a servicioposventa@placetopay.ec.</p></>,
          styles: collapseStyle
        },
        {
          key: '8',
          label: '¿Qué debo hacer si no recibí el comprobante de pago?',
          children: <p>Por cada transacción aprobada a través de Placetopay, recibirás un comprobante del pago con la referencia de compra en la dirección de correo electrónico que indicaste al momento de pagar.  Si no lo recibes, podrás contactar al correo electrónico {correoComercio}, para solicitar el reenvío del comprobante a la misma dirección de correo electrónico registrada al momento de pagar. En última instancia, puedes remitir tu solicitud a servicioposventa@placetopay.ec.</p>,
          styles: collapseStyle
        },  
    ];

    return (
        <>
            <Divider />
            <Title level={3}>Preguntas Frecuentes</Title>
            <img src="https://static.placetopay.com/placetopay-logo.png" alt="PlacetoPayLogo" style={{ maxWidth: '200px' }}/>
            <Divider />

            <Collapse items={items} expandIconPosition="end" style={{ width: "90%" }}/>
        </>
    );
}
  
export default FaqPlace;
