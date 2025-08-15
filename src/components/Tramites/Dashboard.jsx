import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Modal, Form, Input, Typography, Spin, App, Divider, Alert } from 'antd';
import { RightOutlined, AuditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import Swal from 'sweetalert2';
import { loginUser, clearErrors } from '../../store/slices/authSlice';
import config from '../../config/config';

const { Title, Paragraph } = Typography;

const tramitesList = [
  {
    id: 1,
    title: 'Certificado de IPRUS',
    description: 'Solicite el informe oficial que detalla las regulaciones urbanas y de uso del suelo aplicables a su predio. Requisito clave para construcciones, fraccionamientos o trámites de planificación territorial.',
    icon: <AuditOutlined style={{ fontSize: '24px' }} />
  }
];

const actualizarCliente = config.resources.actualizacionCliente;

const Dashboard = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message: messageApi } = App.useApp();
  const [pendiente, setPendiente] = useState(null);
  
  // Redux
  const dispatch = useDispatch();
  const { user, token, loading, error } = useSelector(state => state.auth);

  const showModal = (tramite) => {
    setTramiteSeleccionado(tramite);
    if(!pendiente)
      setIsModalVisible(true);
  };

  const handleTramiteAction = (tramite) => {
    // Only show modal for IPRUS (id: 1)
    if (tramite.id === 1) {
      showModal(tramite);
    } else {
      // Direct redirect for other options
      switch (tramite.id) {
        case 2: // Consulta y pagos
          window.location.href = 'https://consultas.daule.gob.ec/pago-deudas/';
          break;
        case 3: // Actualización de Datos
          window.location.href = 'https://consultas.daule.gob.ec/tramites-linea/actualizar-cliente';
          break;
        case 4: // Historial de Transacciones
          window.location.href = 'https://consultas.daule.gob.ec/pago-deudas/historial';
          break;
        case 5: // Portal Ciudadano
          window.location.href = 'https://servicios.daule.gob.ec:8085/portal/#/login';
          break;
        default:
          break;
      }
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  // Efecto para manejar la redirección después de un login exitoso
  useEffect(() => {
    const verificarSeisionPago = async () => {
      //VERIFICAR TRANSACCIONES PENDIENTES
      //-------------------------------------------------------------------------------------------------------------------------------
      //-------------------------------------------------------------------------------------------------------------------------------
      const rPending = await axios.post(
        `${config[config.environment].API_BASE_URL}${config.endpoints.payButtonPendientes}`,
        { cedula: user.cedula },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      const peticionPendiente = rPending.data;
      //if (localStorage.getItem('requestId')==null) {
       // console.log('Peticiones pendientes:', peticionPendiente.requestId);
        //  console.log('idPasarela:', peticionPendiente.idPasarela);
          localStorage.setItem('requestId', peticionPendiente.requestId);
          localStorage.setItem('idPasarela', peticionPendiente.idPasarela);
          localStorage.setItem('facturaIds', peticionPendiente.ids_facturas);
      // } 

      if (peticionPendiente) {
        console.log(peticionPendiente)
        setIsModalVisible(false);
        setPendiente(peticionPendiente);
        return;
      }
      //-------------------------------------------------------------------------------------------------------------------------------
      //-------------------------------------------------------------------------------------------------------------------------------
      // Navegar al componente Iprus cuando el inicio de sesión es exitoso
      navigate('/tramites/iprus');
      messageApi.success(`Inicio de sesión exitoso. Accediendo a ${tramiteSeleccionado.title}`);
    }

    if (user && token && tramiteSeleccionado?.id === 1) {
      verificarSeisionPago();
      setIsModalVisible(false);
    }
  }, [user, token, navigate, tramiteSeleccionado, messageApi]);

  // Efecto para manejar errores de autenticación
  useEffect(() => {
    if (error) {
      messageApi.error(error);
      dispatch(clearErrors());
    }
  }, [error, messageApi, dispatch]);
  
  // Función de login usando Redux con validación de duplicados
  const handleLogin = async (values) => {
    try {
      // 1) Verificar cliente
      const clientesResponse = await axios.get(`${config[config.environment].API_BASE_URL}${config.endpoints.clientesInfo}/${values.identificacion}`);
      const clientesData = clientesResponse.data;

      // Validar si el cliente existe
      if (!clientesData || clientesData.length === 0) {
        throw new Error('Usuario no registrado');
      }

      // Validar si el cliente está duplicado
      if (clientesData.length > 1) {
        console.log('Cliente duplicado:', clientesData);
        Swal.fire({
          title: 'Error',
          text: 'Por favor, para continuar primero debe actualizar sus datos.',
          icon: 'error',
          confirmButtonText: 'Actualizar datos'
        }).then(() => {
          window.location.href = actualizarCliente;
        });
        return;
      }

      dispatch(loginUser({
        cedula: values.identificacion,
        password: values.password
      }));
    } catch (err) {
      messageApi.error(err.message || 'Error al validar el usuario');
    }
  };

  return (
    <>
      {pendiente && (
        <>
          <Divider>Transacciones Pendientes</Divider>
          <Alert
            message="Tiene transacciones pendientes"
            description={<p><b>Referencias:</b> {pendiente.referencia}</p>}
            type="warning"
            showIcon
            action={
              <Button type="primary" href={pendiente.process_url}>
                Continuar con el pago
              </Button>
            }
          />
        </>
      )}

      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '20px', color: '#1A69AF' }}>
          Trámites Municipales en Línea
        </Title>
        
        <Paragraph style={{ textAlign: 'center', marginBottom: '30px' }}>
          Realice sus trámites municipales de forma rápida y sencilla, sin necesidad de acudir a nuestras oficinas.
          Seleccione el trámite que desea realizar y siga las instrucciones.
        </Paragraph>

        <Row gutter={[24, 24]} justify="center">
          {tramitesList.map((tramite) => (
            <Col xs={24} sm={12} md={8} key={tramite.id}>
              <Card 
                hoverable
                style={{ 
                  height: '100%',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
                actions={[
                  <Button
                    key="action"
                    type="primary"
                    icon={<RightOutlined />}
                    onClick={() => handleTramiteAction(tramite)}
                    style={{
                      background: '#1A69AF',
                      borderRadius: '6px',
                    }}
                  >
                    {tramite.id === 1 ? 'Solicitar' : 'Acceder'}
                  </Button>
                ]}
              >
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  {tramite.icon}
                </div>
                <Title level={4} style={{ textAlign: 'center', color: '#1A69AF' }}>
                  {tramite.title}
                </Title>
                <Paragraph style={{ textAlign: 'center' }}>
                  {tramite.description}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Modal
        title={tramiteSeleccionado ? `Iniciar sesión para: ${tramiteSeleccionado.title}` : 'Iniciar sesión'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose={true}
      >
        <div style={{ marginBottom: '16px' }}>
          <Paragraph>
            Para continuar con este trámite, por favor ingrese sus credenciales:
          </Paragraph>
        </div>
        <Spin spinning={loading}>
          <Form
            form={form}
            name="login_form"
            layout="vertical"
            onFinish={handleLogin}
          >
            <Form.Item
              name="identificacion"
              label="Cédula o RUC"
              rules={[
                { required: true, message: 'Por favor ingrese su cédula o RUC' },
                { 
                  pattern: /^\d{10,13}$/, 
                  message: 'Ingrese una cédula (10 dígitos) o RUC (13 dígitos) válido' 
                }
              ]}
            >
              <Input maxLength={13} placeholder="Ej: 0999999999" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Contraseña"
              rules={[{ required: true, message: 'Por favor ingrese su contraseña' }]}
            >
              <Input.Password placeholder="Ingrese su contraseña" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Button type="default" style={{ marginRight: 8 }} onClick={handleCancel}>
                Cancelar
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{
                  background: '#1A69AF',
                }}
              >
                Iniciar sesión
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </>
  );
};

export default Dashboard;
