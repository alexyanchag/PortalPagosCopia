import React, { useEffect, useState, useRef } from 'react';
import { Card, Spin, Result, Button, Descriptions } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import config from '../config/config';

const translateReason = (reason) => {
  switch (reason) {
    case 'APPROVED':
      return 'APROBADO';
    case 'REJECTED':
      return 'RECHAZADO';
    case 'PENDING':
      return 'PENDIENTE';
    default:
      return 'DESCONOCIDO';
  }
};

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [requestInformation, setRequestInformation] = useState(null); 
  const [facturaLinks, setFacturaLinks] = useState([]);
  const notificadoRef = useRef(false);

  const requestId = localStorage.getItem('requestId') || searchParams.get('requestId');
  const idPasarela = localStorage.getItem('idPasarela');
  const apiBaseUrlServicioIprus = config[config.environment].API_IPRUS;
  const EPenviarIprusCorreo = config.endpoints.enviarIprusCorreo;

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!requestId || !idPasarela) {
        //console.log('requestId: ', requestId, 'idPasarela: ', idPasarela);
        setStatus('error');
        setMessage('No se encontró información del pago');
        return;
      }

      try {
        const response = await axios.get(`${config[config.environment].API_BASE_URL}${config.endpoints.payButtonSessionStatus}/${requestId}/${idPasarela}`);
        const sessionData = response.data;
        var status = sessionData.reason;
        const idsFacturas = sessionData.ids_facturas.split(',').map(id => parseInt(id, 10));

        if (sessionData) {
          setPaymentDetails(sessionData);
          //console.log('sessionData: ', sessionData);
          if (sessionData.reason === 'PENDING') { 
            const resp = await axios.post(`${config[config.environment].API_DEUDAS_URL}${config.endpoints.placetopayGetRequestInformation}`, {
              requestId: requestId
            });
            console.log('resp: ', resp);
            if (resp != undefined) {
              setRequestInformation(resp);
              setPaymentDetails(null);   
              var status = resp?.data?.data?.status?.status || 'PENDING';
              var authorization = resp?.data?.payment?.[0]?.authorization || null;
              //console.log('status: ', status);
              if (status === 'APPROVED' || status === 'REJECTED') { 
                // ACTUALIZAR EL ESTADO EN paybuttonsessions //
                //procesar las facturas pagadas//
                await axios.post(`${config[config.environment].API_BASE_URL}${config.endpoints.actualizarEstado}`, {
                  request_id: requestId || 0,  
                  reason: status,
                  message: resp?.data?.data?.status?.message || '',
                  authorization,
                  idPasarela: 2,
                }).then(async (response) => {
                    // Llamada al segundo API para procesar las facturas
                    if (status === 'APPROVED') {
                      const facturaResponse = await axios.post(
                        `${config[config.environment].API_DEUDAS_URL}${config.endpoints.pagoFacturas}`,
                        idsFacturas,
                        /*{
                          headers: {
                            'Accept': 'application/json',
                            'AccessToken': config[config.environment].ACCESS_TOKEN_EGOB_PAGO_FACTURA,
                          },
                        }*/
                      );

                      // Procesar la respuesta del API de facturas
                      if (facturaResponse.data.codigo === 200) {
                        const urlFacturas = facturaResponse.data.urlFacturas;
                        const facturaLinks = urlFacturas.map((url) => {
                          //const facturaNumber = url.split('/').pop().split('.').pop().split('-').pop();
                          const facturaNumber = url.split('/').pop().split('.')[1];
                          return (
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              {facturaNumber}
                            </a>
                          );
                        });
                        // Renderizar los enlaces de las facturas
                        // Asumiendo que tienes un estado para almacenar los enlaces de las facturas
                        setFacturaLinks(facturaLinks);
                        // enviar correo //

                      }
                    }

                  })
                  .catch((error) => {
                    console.error('Error al actualizar el estado:', error);
                  });

              }

              


            }

          }
          if (sessionData.reason === 'APPROVED') { 
            try {
              const response = await axios.get(`${config[config.environment].API_BASE_URL}/api/comprobantes/${requestId}`);
              const urlFacturas = response.data.map(item => item.urlFactura);

              const facturaLinks = urlFacturas.map((url) => {
                const facturaNumber = url.split('/').pop().split('.')[1];
                return (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {facturaNumber}
                  </a>
                );
              });
    
              setFacturaLinks(facturaLinks);
            } catch (error) {
              console.error('Error al obtener los comprobantes:', error);
            }
          }

          // Definir el estado de la UI basado en el reason
          switch (status) {
            case 'APPROVED':
              setStatus('success');
              setMessage('¡Pago Exitoso!');
              enviarCorreoFacturas(idsFacturas, apiBaseUrlServicioIprus, EPenviarIprusCorreo);
              break;
            case 'REJECTED':
              setStatus('error');
              setMessage('Pago Rechazado');
              break;
            case 'PENDING':
              setStatus('warning');
              setMessage('Pago Pendiente');
              break;
            default:
              setStatus('info');
              setMessage('Estado de pago en proceso');
          }

          // Limpiar localStorage //
          /* localStorage.removeItem('sessionId');
          localStorage.removeItem('requestId');
          localStorage.removeItem('facturaIds');
          localStorage.removeItem('timeReference');
          localStorage.removeItem('cedulaConsultada');
          localStorage.removeItem('idPasarela'); */
        } else {
          setStatus('error');
          setMessage('No se encontraron detalles de pago.');
        }
      } catch (error) {
        console.error('Error al verificar estado:', error);
        setStatus('error');
        setMessage('Error al verificar el estado del pago');
      }
    };

    checkPaymentStatus();
  }, [requestId, idPasarela]);

  const handleReturn = () => {
    navigate('/');
  };

  // Función auxiliar para enviar correo por cada factura
  const enviarCorreoFacturas = async (ids, apiBaseUrl, endpoint) => {
    if (!notificadoRef.current) {
      notificadoRef.current = true;
      for (const id of ids) {
        try {
          const md5 = await axios.post(`${apiBaseUrl}${endpoint}${id}`);
          //const url = `${apiBaseUrl}${config.endpoints.obtenerIprusIdfactura}${id}`;
          //window.open(url, "_blank");

          window.open(`/ver-iprus/${md5.data}`, "_blank");
        } catch (error) {
          // console.error(`Error enviando correo para factura ${id}:`, error);
        }
      }
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
      <Card
        style={{
          maxWidth: '600px',
          width: '100%',
          borderRadius: '10px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        {status === 'loading' ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '20px' }}>Verificando el estado del pago...</p>
          </div>
        ) : (
          <>
            <Result
              status={status}
              title={message}
              subTitle={status === 'success' ? 'El pago se ha procesado correctamente, por favor revise su correo electronico para obtener los comprobantes de pago' :
                       status === 'warning' ? 'El pago está siendo procesado' :
                       status === 'error' ? 'Hubo un problema con el pago' :
                       'Verificando estado del pago'}
              style={{ padding: 0 }}
            />
            {paymentDetails && requestInformation === null && (
              <Descriptions
                bordered
                column={1}
                style={{ marginTop: '24px', borderRadius: '10px', overflow: 'hidden' }}
              >
                <Descriptions.Item label="Fecha">
                  {new Date(paymentDetails.fechaPeticion).toLocaleString('ec-EC') || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Referencia">
                  {paymentDetails.referencia || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Estado">
                  {translateReason(paymentDetails.reason)}
                </Descriptions.Item>
                <Descriptions.Item label="Monto">
                  $ { paymentDetails.total.toFixed(2) || '0.00'}
                </Descriptions.Item>
              </Descriptions>
            )}
            {requestInformation && (
              <Descriptions
                bordered
                column={1}
                style={{ marginTop: '24px', borderRadius: '10px', overflow: 'hidden' }}
              >
              <Descriptions.Item label="Fecha"> 
                { new Date(requestInformation?.data?.data?.status?.date).toLocaleString('ec-EC') || 'N/A' }
              </Descriptions.Item>
                <Descriptions.Item label="Referencia">
                  {requestInformation?.data?.data?.request?.payment?.reference || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Estado">
                  {translateReason(requestInformation?.data?.data?.status?.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Monto">
                  $ { (requestInformation?.data?.data?.request?.payment?.amount?.total || 0).toFixed(2) || '0.00'}
                </Descriptions.Item>
              </Descriptions>
            )}
            <div>
              {facturaLinks.length > 0 && (
                <div>
                  <h3>Facturas Pagadas:</h3>
                  <ul>
                    {facturaLinks.map((link, index) => (
                      <li key={index}>{link}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Button type="primary" onClick={handleReturn}>
                Volver al Inicio
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default PaymentStatus;
