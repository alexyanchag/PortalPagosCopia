import React, { useEffect, useState } from 'react';
import { Typography, Card, Alert, Spin, Form, Input, Button, Select, Row, Col, Divider, message, App, Radio } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFormularios } from '../../store/slices/authSlice';
import axios from 'axios';
import config from '../../config/config';
import Swal from 'sweetalert2';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const apiBaseUrlServicioIprus = config[config.environment].API_IPRUS;
const EPprediosPorIdentificacion = config.endpoints.prediosPorIdentificacion;
const apiConsultasDaule = config[config.environment].API_BASE_URL;
const EPdetalleCertificado = config.endpoints.detalleCertificado;
const EPagregarFactura = config.endpoints.agregarFactura;
const EPagregarOrdenCertificado = config.endpoints.agregarOrdenCertificado;
const EPgenerarIprus = config.endpoints.generarIprus;

const idCertificadoIprus = 104;
const idModulo = 21;

const Iprus = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { message: messageApi } = App.useApp();

  // Estados locales
  const [certificadoData, setCertificadoData] = useState(null);
  const [loadingCertificado, setLoadingCertificado] = useState(false);
  const [errorCertificado, setErrorCertificado] = useState(null);

  // Obtener datos de Redux
  const { user, token, loading, error, formularios, formularioLoading, formularioError } = useSelector(state => state.auth);

  const [predios, setPredios] = useState([]);


  // Constantes
  const IPRUS_FORM_ID = 86;

  useEffect(() => {
    // Si no hay usuario o token, redirigir al dashboard
    if (!user || !token) {
      messageApi.error('Debe iniciar sesión para acceder a este servicio');
      navigate('/tramites');
      return;
    }

    // Cargar la lista de formularios
    dispatch(fetchFormularios());
  }, [user, token, dispatch, navigate, messageApi]);

  // Efecto para manejar errores de la API
  useEffect(() => {
    if (formularioError) {
      messageApi.error(formularioError);
    }
  }, [formularioError, messageApi]);

  // Buscar el formulario IPRUS en la lista cuando se cargue
  const iprusFormulario = formularios.find(form => form.id === IPRUS_FORM_ID);

  // Función para solicitar el certificado
  const solicitarCertificado = async (values) => {
    setLoadingCertificado(true);
    setErrorCertificado(null);

    try {
      // Ejemplo de cómo sería la llamada a la API para solicitar el certificado
      // Esta es una implementación simulada, deberás adaptarla según la documentación de la API real
      //const apiUrl = `${config[config.environment].API_EGOB_URL}/it/rest/solicitudes/crear`;
      const apiUrl = `/api/it/rest/solicitudes/crear`;

      const payload = {
        formularioId: IPRUS_FORM_ID,
        predio: values.predio,
        direccion: values.direccion,
        // Otros campos según sea necesario
      };

      console.log(payload)

      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setCertificadoData(response.data);
      messageApi.success('Certificado solicitado con éxito');
    } catch (err) {
      console.error('Error al solicitar certificado:', err);
      setErrorCertificado(err.response?.data?.mensaje || 'Error al solicitar el certificado');
      messageApi.error('No se pudo procesar la solicitud');
    } finally {
      setLoadingCertificado(false);
    }
  };


  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  useEffect(() => {
    obtenerPredios();
  }, []);

  const obtenerPredios = async () => {
    try {
      const response = await axios.get(
        //`${apiBaseUrlServicioIprus}/predios-identificacion/${user.cedula}`
        //`${apiBaseUrlServicioIprus}${EPprediosPorIdentificacion}/0900684598`
        `${apiBaseUrlServicioIprus}${EPprediosPorIdentificacion}/13603632119`
      );
      console.log(response.data)
      setPredios(response.data);
    } catch (err) {
      console.error("Error al obtener los predios:", err);
    }
  };

  const handleSolicitarCertificado = async (values) => {
    setLoadingCertificado(true);
    const certificadoData = await axios.get(
      `${apiConsultasDaule}${EPdetalleCertificado}/${idCertificadoIprus}`
    );

    const totalValor = certificadoData.data.rubros.reduce((acc, rubro) => acc + rubro.valor, 0);

    setLoadingCertificado(false);

    Swal.fire({
      title: '¿Está seguro?',
      html: `<strong>IMPORTANTE:</strong> ¿Está seguro de solicitar el certificado IPRUS? Este tiene un costo de <b>$${totalValor}</b> y será enviado a su correo electrónico una vez se complete la solicitud.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      //cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, solicitar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoadingCertificado(true);

        try {
          
          const formularioData = {
            "idModulo": idModulo,
            "idCliente": user.id,
            "formularios": [
              {
                "idFormulario": IPRUS_FORM_ID,
                "cantidad": 1,
                "asunto": "Solicitud de certificado IPRUS" 
              }
            ]
          }
          
          
          const responseGenerarFormulario = await axios.post(
            `${config[config.environment].API_EGOB_URL}${config.endpoints.venderFormularios}`,
            formularioData,
            {
              headers: {
                Accesstoken: `${config[config.environment].ACCES_TOKEN_VENTA_FORMULARIO}`  // Reemplaza accessToken con tu variable/token real
              }
            }
          );

          // URL PARA USAR CON SERVERLESS
          //const responseGenerarFormulario = await axios.post('/api/venderFormularios', formularioData);

          const idFactura = responseGenerarFormulario.data[0].idFactura;

          /*
          // Lógica para crear la factura
          const facturaData = {
            idModulo: certificadoData.data.idModulo,
            idPropietarioEmision: user.id, // Usamos el ID del usuario autenticado
            valorBase: totalValor,
            totalTarifa: totalValor,
            fechaCreacion: new Date().toISOString().split('T')[0],
            usuarioCreacion: user.id, // Usamos el ID del usuario autenticado
            estado: 1,
            facturaDetalle: certificadoData.data.rubros.map((rubro) => ({
              cantidad: 1,
              valorUnitario: rubro.valor,
              estado: 1,
              idRubro: rubro.idRubro,
              fechaCreacion: new Date().toISOString().split('T')[0],
            })),
          };

          const responseFactura = await axios.put(
            `${apiConsultasDaule}${EPagregarFactura}`,
            facturaData
          );

          const idFactura = responseFactura.data.id;

          const ordenCertificadoDatabody = {
            idFactura: responseFactura.data.id,
            estado: 1,
            nombres: user.nombre, // Usamos el nombre del cliente (Dinardap o base de datos)
            apellidos: user.apellido, // Usamos el apellido del cliente
            email: user.email, // Usamos el email del usuario autenticado
            idModulo: certificadoData.data.idModulo,
            certificado: certificadoData.data.descripcion,
            tipo_certificado: certificadoData.data.tipo,
            detalles: certificadoData.data.rubros.map((rubro) => ({
              idRubro: rubro.idRubro,
              rubro: rubro.descripcion,
              valor: rubro.valor,
            })),
          };

          const responseOrdenCertificado = await axios.post(
            `${apiConsultasDaule}${EPagregarOrdenCertificado}`,
            ordenCertificadoDatabody
          );
          */

          const responseGenerarIprus = await axios.post(
            `${apiBaseUrlServicioIprus}${EPgenerarIprus}`,
            {
              clave_predial: values.codigo_miduvi,
              idfactura: idFactura,
              email: user.email,
              nombres: user.nombre + ' ' + user.apellido,
              identificacion: user.cedula
            }
          );

          setLoadingCertificado(false);

          Swal.fire({
            title: 'Certificado generado',
            html: `<strong>IMPORTANTE:</strong> Para obtener el certificado debe proceder al pago. Este tiene un costo de $${totalValor} y será enviado a su correo electrónico una vez sea completado el pago.`,
            icon: 'success',
            showCancelButton: false,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Proceder al pago',
          }).then(async (result) => {
            navigate('/')
          })
        } catch (error) {
          console.log('ERROR MI DOG', error);
        } finally {
          setLoadingCertificado(false);
        }
      }
    });
  };
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------



  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {(loading || formularioLoading) && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: '16px' }}>Cargando información...</Paragraph>
        </div>
      )}

      {error && (
        <Alert
          message="Error de autenticación"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {formularioError && (
        <Alert
          message="Error al cargar formularios"
          description={formularioError}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {user && iprusFormulario && (
        <Card
          style={{
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            marginBottom: '24px'
          }}
          title={(
            <div style={{ textAlign: 'center' }}>
              <Title level={4} style={{ textAlign: 'center', margin: '20px', color: '#1A69AF' }}>
                {iprusFormulario.descripcion}
              </Title>
            </div>
          )}
        >
          <div style={{ marginBottom: '20px' }}>
            <Alert
              message="Información del solicitante"
              description={
                <div>
                  <p><strong>Nombre:</strong> {user.nombre} {user.apellido}</p>
                  <p><strong>Cédula:</strong> {user.cedula}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                </div>
              }
              type="info"
              showIcon
            />
          </div>

          <Divider>Listado de predios registrados a su nombre</Divider>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSolicitarCertificado}
            initialValues={{
              tipoDocumento: 'cedula',
              identificacion: user.cedula
            }}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="codigo_miduvi"
                  label="Escoja un predio"
                  rules={[{ required: true, message: 'Seleccione un predio' }]}
                >
                  <Radio.Group
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {predios.map((item, index) => (
                      <Radio key={index} value={item.codigo_miduvi}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#1A69AF' }}>Código corto:</span> {item.id_municipio} &nbsp;|&nbsp;
                          <span style={{ fontWeight: 600, color: '#1A69AF' }}>Código Miduvi:</span> {item.codigo_miduvi} &nbsp;|&nbsp;
                          <span style={{ fontWeight: 600, color: '#1A69AF' }}>Ciudadela:</span> {item.nombre_ciudadela}
                        </div>
                      </Radio>
                    ))}
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>


            <Form.Item style={{ marginTop: '16px', textAlign: 'right' }}>
              <Button type="default" style={{ marginRight: 8 }} onClick={() => navigate('/tramites')}>
                Cancelar
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loadingCertificado}
                style={{ background: '#1A69AF' }}
              >
                Solicitar Certificado
              </Button>
            </Form.Item>
          </Form>

          {errorCertificado && (
            <Alert
              message="Error al procesar la solicitud"
              description={errorCertificado}
              type="error"
              showIcon
              style={{ marginTop: '16px' }}
            />
          )}

          {certificadoData && (
            <div style={{ marginTop: '24px' }}>
              <Alert
                message="Solicitud Procesada"
                description={
                  <p>
                    Su solicitud ha sido procesada correctamente. Recibirá una notificación en su correo electrónico cuando el certificado esté listo.
                    <br />
                    <strong>Número de Trámite:</strong> {certificadoData.id || 'N/A'}
                  </p>
                }
                type="success"
                showIcon
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Iprus;
