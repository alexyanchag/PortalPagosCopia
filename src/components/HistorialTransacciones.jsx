import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {Card, Avatar, List, Tag, Statistic, Divider,Form,Input,Button,Table,Typography,Alert,Row,Col,Grid, Select, Descriptions} from 'antd';
import { SearchOutlined, ReloadOutlined, DollarOutlined,DollarCircleOutlined  } from '@ant-design/icons';
import config from '../config/config';

const { Title } = Typography;
const { useBreakpoint } = Grid;

function HistorialTransacciones() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // NUEVO: Saber si el usuario ya consultó
  const [isConsulted, setIsConsulted] = useState(false);

  // Captcha
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState(0);

  // Alerta y contador
  const [alertInfo, setAlertInfo] = useState(null);

  //Historial
  const [lista, setLista] = useState(null);
  
  const screens = useBreakpoint();



  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion(`¿Cuánto es ${num1} + ${num2}?`);
    setCaptchaAnswer(num1 + num2);
  };

  const handleSubmit = async (values) => {

    // Marcamos que se está consultando
    setIsConsulted(true);
    setLoading(true);
    setAlertInfo(null);

    try {
      //Obtengo transacciones
      const payload ={
        cedula: values.cedula,
        pasarela_id: values.canalpago //Solo PlacetoPay
      };
      const resultado = await axios.post(`${config[config.environment].API_BASE_URL}${config.endpoints.transaccionesClientes}`,payload);
      const data = resultado.data;
      
      if (data && Array.isArray(data) && data.length > 0){
        //Tiene transacciones
        //ordenar por id desc
        data.sort((a, b) => b.id - a.id);
        setLista(data);
      } else {
        //No hay data
        setLista(null);
        setAlertInfo({
          type: 'info',
          message: 'No se encontraron transacciones del contribuyente.',
        });
      }
    } catch (error) {
        setAlertInfo({
          type: 'error',
          message: error.response?.data?.error || 'Error al consultar las transacciones.',
        });
        setLista(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaConsulta = () => {
    form.resetFields();
    setAlertInfo(null);
    setIsConsulted(false);
    generateCaptcha();
    setLista(null);
  };

  const getStatusTag = (status) =>{
    switch(status){
      case 'APPROVED':
        return <Tag color="success"><b>APROBADA</b></Tag>;
      case 'PENDING':
        return <Tag color="processing"><b>PENDIENTE</b></Tag>;
      case 'REJECTED':
        return <Tag color="error"><b>RECHAZADA</b></Tag>;
      case 'FAILED':
        return <Tag color="error"><b>FALLIDA</b></Tag>;
      default:
        return <Tag color="warning"><b>INDETERMINADA</b></Tag>;
    }
  }

  const getInfoPasarela = (id_pasarela) =>{
    switch(id_pasarela){
      //PLACETOPAY
      case 2:
        return {
          nombre: 'Placetopay',
          //logoUrl: 'https://static.placetopay.com/placetopay-logo-square.svg'
          logoUrl: `${config.resources.logoPlace}`
        };
      default:
        return {
          nombre: 'Transacción',
          logoUrl: ''
        };
    }
  }

  
  return (
    <Card
    
      style={{

        maxWidth: '1000px',
        marginTop: '20px',
        marginBottom: '20px',
        borderRadius: '6px',
        boxShadow: '0 4px 8px rgb(201, 201, 201)',
      }}
      styles={{
        body: {
          padding: screens.sm ? '20px' : '10px',
        },
      }}
    >
      <Title level={3} style={{ textAlign: 'center', marginBottom: '24px' }}>
        Historial de Transacciones
      </Title>

      <Alert
        message="Guía de Consulta"
        description={<>
        <p>Para consultar las transacciones realizadas a traves de los canales de pago habilitados siga los siguientes pasos:</p>
        <ul>
          <li>Seleccione el canal de pago o pasarela de las transacciones a buscar</li>
          <li>Ingrese su número de cédula o RUC</li>
          <li>Presione el botón consultar.</li>
        </ul>
        </>}
        type="info"
        showIcon
      />
      <br/>

      <Form form={form} layout="vertical" initialValues={{canalpago:'2'}} onFinish={handleSubmit}>

        <Form.Item
          label="Canal de pago:"
          name="canalpago"
          rules={[
            {
              required: true,
              message: 'Por favor, seleccione el canal de pago.',
            },
          ]}
        >
          <Select  options={[{ value: '2', label: 'Placetopay' }]}  />
        </Form.Item>

        <Form.Item
          label="Cédula/RUC:"
          name="cedula"
          rules={[
            {
              required: true,
              message: 'Por favor, ingrese su cédula o RUC.',
            },
            {
              pattern: /^[0-9]{10,13}$/,
              message:
                'Ingrese un número de cédula o RUC válido (10 o 13 dígitos).',
            },
          ]}
        >
          <Input placeholder="Ingrese la cédula o RUC" maxLength={13} />
        </Form.Item>
    
        <Form.Item
          label={captchaQuestion}
          name="captcha"
          rules={[
            {
              required: true,
              message: 'Por favor, responda la pregunta.',
            },
            {
              validator: (_, value) =>
                parseInt(value, 10) === captchaAnswer
                  ? Promise.resolve()
                  : Promise.reject(new Error('Respuesta incorrecta al captcha.')),
            },
          ]}
        >
          <Input placeholder="Responda la pregunta" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
                loading={loading}
                disabled={isConsulted} // Desactivar cuando se haya consultado
                block
              >
                Consultar
              </Button>
            </Col>

            {/* Mostrar botón "Nueva Consulta" si ya hubo una consulta, 
                sin importar si fue exitosa o no */}
            {isConsulted && (
              <Col xs={24} sm={12}>
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  onClick={handleNuevaConsulta}
                  block
                >
                  Nueva Consulta
                </Button>
              </Col>
            )}
          </Row>
        </Form.Item>
      </Form>

      <Divider />

      {lista? (
                <List
                  style={{ width: '100%'}}
                  itemLayout="vertical"
                  size="small"
                  pagination={{
                    onChange: (page) => {
                      console.log(page);
                    },
                    pageSize: 5,
                  }}
                  dataSource={lista}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                  >
                    <Card 
                      type="inner" 
                      title={
                      <List.Item.Meta
                        avatar={<Avatar shape="square" size="large" src={getInfoPasarela(item.idPasarela).logoUrl} />}
                        title={getInfoPasarela(item.idPasarela).nombre}
                      />}
                      extra={getStatusTag(item.reason)}
                    >
                        <>
                          <p>
                            {item.message}<br/>
                            <b>Fecha: </b>{new Date(item.fechaPeticion).toLocaleString('ec-EC')}<br/>
                            <b>Referencia: </b>{item.referencia}<br/>
                            {item.authorization? (<><b>Autorizacion: </b> {item.authorization}</>):null}
                          </p>
                          <Statistic
                            title="Valor Total"
                            value={item.total}
                            precision={2}
                            prefix={<DollarCircleOutlined />}
                            suffix="USD"
                          />
                          
                        </>
                    </Card>
                  </List.Item>
                )}
              />
              ):(
                <>
                  {alertInfo && (
                    <Alert
                      style={{ marginTop: 16 }}
                      type={alertInfo.type}
                      message={alertInfo.message}
                      showIcon
                    />
                  )}
                </>
              )

            }
    </Card>
  );
}

export default HistorialTransacciones;
