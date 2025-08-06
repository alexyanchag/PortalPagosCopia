import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card, Statistic, Divider, Form, Input, Button, Table, Typography, Alert, Row, Col, Grid, Popover, Radio, Space, message, Modal,
  Tooltip,
  Badge,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, DollarOutlined, DollarCircleOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import PaymentModal from './PaymentModal';
import config from '../config/config';

const { Title } = Typography;
const { useBreakpoint } = Grid;

function ConsultaForm() {

  const [form] = Form.useForm();
  const [resultado, setResultado] = useState(null);
  const [totalDeuda, setTotalDeuda] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [processUrl, setProcessUrl] = useState(null);
  const [facturaIds, setFacturaIds] = useState([]);
  const [fechaPeticion, setFechaPeticion] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [coactivaIds, setCoactivaIds] = useState([]);
  const [deudasOrdenadas, setDeudasOrdenadas] = useState([]);
  const [totalDeudaNeto, setTotalDeudaNeto] = useState(0);
  const [valorDescuento, setValorDescuento] = useState(0);
  const [alivioFinancieroModalVisible, setAlivioFinancieroModalVisible] =
  useState(false);

  // Saber si el usuario ya consultó
  const [isConsulted, setIsConsulted] = useState(false);

  // Captcha
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState(0);

  // Alerta y contador
  const [alertInfo, setAlertInfo] = useState(null);
  const [countdown, setCountdown] = useState(null);

  // Transacciones pendientes
  const [pendiente, setPendiente] = useState(null);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('placetopay');

  const screens = useBreakpoint();

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    let intervalId;
    if (countdown !== null && countdown > 0) {
      intervalId = setInterval(() => {
        setCountdown((prevVal) => {
          const nextVal = prevVal - 1;
          if (nextVal === 0) {
            window.location.href = config.resources.actualizacionDatos;
          }
          return nextVal;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [countdown]);

  useEffect(() => {
    if (alertInfo?.type === 'warning' && countdown !== null && countdown > 0) {
      setAlertInfo((prev) => ({
        ...prev,
        message: `Usuario debe actualizar sus datos. Será redirigido en ${countdown} segundos...`,
      }));
    }
  }, [countdown]);

  useEffect(() => {
    if (resultado) {
      // Ordenar deudas por fecha de creación
      const deudas = [...resultado].sort((a, b) => 
        new Date(a.fechaCreacion) - new Date(b.fechaCreacion)
      );
      setDeudasOrdenadas(deudas);

      // Identificar las deudas coactivas y marcarlas automáticamente
      const coactivas = deudas.filter(deuda => deuda.isCoactiva).map(deuda => deuda.id);
      setCoactivaIds(coactivas);
      setSelectedRowKeys(coactivas);

      // Total Neto sin descuento Coactivas
      const totalCoactivasNeto = deudas
        .filter((item) => coactivas.includes(item.id))
        .reduce((sum, item) => sum + (item.valorTotalNeto || 0), 0);
      setTotalDeudaNeto(totalCoactivasNeto);
      
      // Calcular el total inicial solo con las deudas coactivas
      const totalCoactivas = deudas
        .filter(item => coactivas.includes(item.id))
        .reduce((sum, item) => sum + (item.totalTarifa || 0), 0);
      setTotalDeuda(totalCoactivas);

      //valor de descuento
      const totalValorDescuento = totalCoactivasNeto - totalCoactivas;
      setValorDescuento(totalValorDescuento);

      // Actualizar facturaIds solo con las coactivas inicialmente
      setFacturaIds(coactivas);
      localStorage.setItem('facturaIds', JSON.stringify(coactivas));
    }
  }, [resultado]);

  const isValidSelection = (newSelection) => {
    // Siempre permitir deudas coactivas
    const nonCoactivas = newSelection.filter(id => !coactivaIds.includes(id));
    
    if (nonCoactivas.length === 0) return true;

    // Obtener las fechas de las deudas seleccionadas no coactivas
    const selectedDeudasFechas = deudasOrdenadas
      .filter(deuda => nonCoactivas.includes(deuda.id))
      .map(deuda => new Date(deuda.fechaCreacion));

    // Verificar si hay alguna deuda no seleccionada más antigua que las seleccionadas
    const hasOlderUnselected = deudasOrdenadas.some(deuda => {
      if (coactivaIds.includes(deuda.id)) return false; // Ignorar coactivas
      if (nonCoactivas.includes(deuda.id)) return false; // Ignorar las ya seleccionadas

      const deudaFecha = new Date(deuda.fechaCreacion);
      return selectedDeudasFechas.some(selectedFecha => deudaFecha < selectedFecha);
    });

    return !hasOlderUnselected;
  };

  const onSelectChange = (newSelectedRowKeys) => {
    // Mantener las deudas coactivas
    const finalSelection = [
      ...newSelectedRowKeys.filter(key => !coactivaIds.includes(key)),
      ...coactivaIds
    ];

    // Verificar si la selección es válida cronológicamente
    if (!isValidSelection(finalSelection)) {
      message.error('Debe seleccionar las deudas en orden cronológico, comenzando por las más antiguas.');
      return;
    }

    setSelectedRowKeys(finalSelection);
    
    // Actualizar el total de la deuda
    const totalSelected = resultado
      .filter(item => finalSelection.includes(item.id))
      .reduce((sum, item) => sum + (item.totalTarifa || 0), 0);
    setTotalDeuda(totalSelected);

    const totalSelectedNeto = resultado
    .filter((item) => finalSelection.includes(item.id))
    .reduce((sum, item) => sum + (item.valorTotalNeto || 0), 0);
  setTotalDeudaNeto(totalSelectedNeto);

  //valor de descuento
  const totalValorDescuento = totalSelectedNeto - totalSelected;
  setValorDescuento(totalValorDescuento);

    // Actualizar facturaIds
    setFacturaIds(finalSelection);
    localStorage.setItem('facturaIds', JSON.stringify(finalSelection));
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record) => ({
      disabled: record.isCoactiva,
      name: record.id,
    }),
    onSelect: (record, selected, selectedRows) => {
      const nonCoactiveKeys = deudasOrdenadas
        .filter(deuda => !deuda.isCoactiva)
        .map(deuda => deuda.id);

      let newSelection;
      if (selected) {
        // Si se está seleccionando, agregar todas las deudas anteriores no coactivas
        const index = nonCoactiveKeys.indexOf(record.id);
        const keysToAdd = nonCoactiveKeys.slice(0, index + 1);
        newSelection = [...new Set([...selectedRowKeys, ...keysToAdd])];
      } else {
        // Si se está deseleccionando, remover todas las deudas posteriores no coactivas
        const index = nonCoactiveKeys.indexOf(record.id);
        const keysToRemove = new Set(nonCoactiveKeys.slice(index));
        newSelection = selectedRowKeys.filter(key => !keysToRemove.has(key));
      }

      // Asegurarse de mantener las deudas coactivas seleccionadas
      const finalSelection = [...new Set([...newSelection, ...coactivaIds])];
      onSelectChange(finalSelection);
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
      const nonCoactiveKeys = deudasOrdenadas
        .filter(deuda => !deuda.isCoactiva)
        .map(deuda => deuda.id);

      let newSelection;
      if (selected) {
        // Seleccionar todas las deudas no coactivas
        newSelection = [...nonCoactiveKeys];
      } else {
        // Deseleccionar todas las deudas no coactivas
        newSelection = [];
      }

      // Asegurarse de mantener las deudas coactivas seleccionadas
      const finalSelection = [...new Set([...newSelection, ...coactivaIds])];
      onSelectChange(finalSelection);
    }
  };

  // Genera una pregunta tipo captcha simple
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion(`¿Cuánto es ${num1} + ${num2}?`);
    setCaptchaAnswer(num1 + num2);
  };

  // Ofuscación
  const ofuscar = (str) => {
    if (!str) return '';
    if (str.length <= 2) {
      return `${str[0] || ''}${'*'.repeat(Math.max(0, str.length - 2))}${str.slice(-1) || ''}`;
    }
    if (str.length <= 6) {
      return `${str[0]}${'*'.repeat(str.length - 2)}${str.slice(-1)}`;
    }
    return `${str.slice(0, 3)}${'*'.repeat(str.length - 6)}${str.slice(-3)}`;
  };

  const columns = [
    {
      title: 'Contribuyente',
      dataIndex: 'contribuyente',
      key: 'contribuyente',
      render: (_, record) => {
        const nombreOfuscado = ofuscar(record.nombre || '');
        const apellidoOfuscado = ofuscar(record.apellido || '');
        return `${nombreOfuscado} ${apellidoOfuscado}`.trim();
      },
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Módulo',
      dataIndex: 'modulo',
      key: 'modulo',
      width: 100,
      ellipsis: true,
    },
    {
      title: 'Concepto',
      dataIndex: 'concepto',
      key: 'concepto',
      width: 100,
      ellipsis: true,
      render: (text, record) => {
        if (record.idModulo === 1) {
          return (
            <Popover content={`${record.fechaCreacion}`} title="Fecha de emisión">
              <a>Ver</a>
            </Popover>
          );
        } else {
          return (
            <Popover content={text} title="Concepto">
              <a>Ver</a>
            </Popover>
          );
        }
      },
    },
    {
      title: 'Fecha',
      dataIndex: 'fechaCreacion',
      key: 'fechaCreacion',
      width: 100,
      render: (text) => text,
    // Las siguientes líneas permiten ordenar la tabla por fecha al hacer click en el encabezado
     // sorter: (a, b) => new Date(a.fechaCreacion) - new Date(b.fechaCreacion), // Función de ordenamiento que compara fechas
     // defaultSortOrder: 'ascend', // Orden inicial ascendente (más antiguo a más reciente)
      
    },
    {
      title: 'Total',
      dataIndex: 'totalTarifa',
      key: 'totalTarifa',
      render: (text) => `$${(text || 0).toFixed(2)}`,
      width: 80,
      align: 'right',
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 100,
      render: (_, record) => (
        <span style={{ color: record.isCoactiva ? '#ff4d4f' : 'inherit' }}>
          {record.isCoactiva ? 'Coactiva' : 'Normal'}
        </span>
      ),
    },
  ];

  const handleSubmit = async (values) => {
    setIsConsulted(true);
    setLoading(true);
    setAlertInfo(null);
    console.log('pendientes pay buttn', `${config[config.environment].API_BASE_URL}${config.endpoints.payButtonPendientes}`)
    try {
      // 1) Verificar si hay peticiones pendientes
      const rPending = await axios.post(
        `${config[config.environment].API_BASE_URL}${config.endpoints.payButtonPendientes}`,
        { cedula: values.cedula },
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

      if (false){//peticionPendiente) {
        setPendiente(peticionPendiente);
      } else {
        try {
          // 1) Verificar cliente
          const clientesResponse = await axios.get(`${config[config.environment].API_BASE_URL}${config.endpoints.clientesInfo}/${values.cedula}`);
          const clientesData = clientesResponse.data;

          // Validar si el cliente existe
          if (!clientesData || clientesData.length === 0) {
            throw new Error('Usuario no registrado');
          }

          // Validar si el cliente está duplicado
          if (clientesData.length > 1) {
            console.log('Cliente duplicado:', clientesData);
            throw {
              response: {
                status: 409,
                data: {
                  error: 'Usuario debe actualizar sus datos',
                  details: 'Se encontraron múltiples registros para esta cédula'
                }
              }
            };
          }

          // 2) Consultar deudas
          const deudasResponse = await axios.post(`${config[config.environment].API_DEUDAS_URL}${config.endpoints.consultarDeudas}`, 
            { cedula: values.cedula },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          const data = deudasResponse.data;

          if (Array.isArray(data) && data.length > 0) {
            setResultado(data);
            localStorage.setItem('cedulaConsultada', values.cedula);

            const total = data.reduce((acc, deuda) => acc + (deuda.totalTarifa || 0), 0);
            //const totalDeuda = total.toFixed(2);
            //const total = (acc, deuda) => acc + (deuda.totalTarifa || 0); 
            setTotalDeuda(total);
            setAlertInfo(null);
          } else {
            // Contribuyente al día
            setResultado(null);
            setTotalDeuda(0);
            setAlertInfo({
              type: 'success',
              message: '¡Contribuyente al día! No tiene deudas pendientes.',
            });
          }
        } catch (error) {
          if (error.response?.status === 409) {
            setResultado(null);
            setTotalDeuda(0);
            setAlertInfo({
              type: 'warning',
              message: `Usuario debe actualizar sus datos.`,
            });
            setCountdown(10); // Agregar un contador de 10 segundos
          } else if (error.response?.status === 404) {
            setAlertInfo({
              type: 'error',
              message: error.response.data.error || 'Usuario no registrado',
            });
            setResultado(null);
            setTotalDeuda(0);
          } else {
            console.error('Error al consultar deudas:', error);
            setAlertInfo({
              type: 'info',
              message: error.response?.data?.error || 'Usuario no encontrado o desactivado',
            });
            setResultado(null);
            setTotalDeuda(0);
          }
        }
      }
    } catch (error) {
      console.error('Error al consultar deudas:', error);
      setAlertInfo({
        type: 'info',
        message: error.response?.data?.error || ' Verifica la cédula o Ruc ingresado',
      });
      setResultado(null);
      setTotalDeuda(0);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaConsulta = () => {
    form.resetFields();
    setResultado(null);
    setTotalDeuda(0);
    setAlertInfo(null);
    setIsConsulted(false);
    setPendiente(null);
    generateCaptcha();
    setCoactivaIds([]);

    // (Opcional) limpiar la cédula guardada
    localStorage.removeItem('cedulaConsultada');
  };

  const handlePaymentSubmit = async (paymentData) => {
    setPaymentLoading(true);
    try {
      const facturaIdsArr = facturaIds;
      console.log('IDs de facturas a pagar:', facturaIdsArr);

      const response = await axios.post(`${config[config.environment].API_DEUDAS_URL}${config.endpoints.createSession}`, paymentData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.data?.processUrl) {
        setProcessUrl(response.data.data.processUrl);
        setFechaPeticion(response.data.data.status.date);
      } else {
        throw new Error('No se recibió la URL de pago');
      }
    } catch (error) {
      console.error('Error al crear sesión de pago:', error);
      setAlertInfo({
        type: 'error',
        message: 'Error al iniciar el proceso de pago. Por favor intente nuevamente.',
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <Card
      style={{
        width: '100%',
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
        Consultar valores pendientes
      </Title>

      <Alert 
        message="📢 Aprovecha la remisión del 100% de intereses, multas y recargos de tributos generados hasta el 31 de diciembre de 2024. El beneficio aplica si realizas el pago total o parcial del capital hasta el 30 de junio de 2025." 
        type="success" 
        closable
        style={{ marginBottom: '20px' }}
      />


      <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
              message: 'Ingrese un número de cédula o RUC válido (10 o 13 dígitos).',
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
                disabled={isConsulted}
                block
              >
                Consultar
              </Button>
            </Col>

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

      {coactivaIds.length > 0 && (
            <Alert
              message="Las deudas en coactiva son de cumplimiento obligatorio. Puede incluir otros valores que desee cancelar voluntariamente junto a este pago."
              type="warning"
              style={{
                marginTop: "20px",
              }}
              showIcon
            />
          )}

      {alertInfo && (
        <Alert style={{ marginTop: 16 }} type={alertInfo.type} message={alertInfo.message} showIcon />
      )}

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

      {resultado && resultado.length > 0 && (
        <>
          <Divider>Detalle de Valores Pendientes</Divider>
          <Table
            dataSource={deudasOrdenadas}
            columns={columns}
            rowSelection={rowSelection}
            pagination={false}
            style={{
              marginTop: '20px',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            rowKey="id"
            scroll={{ x: true }}
          />

          <Card
            style={{
              marginTop: '24px',
              background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
              borderRadius: '8px',
              border: '1px solid #91caff',
            }}
          >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={12}>
                  <div
                    style={{
                      background: "#fff",
                      padding: "20px",
                      borderRadius: "8px",
                      boxShadow: "0 1px 1px rgb(69, 76, 83)",
                    }}
                  >
                    <Title level={4} style={{ marginBottom: "20px" }}>
                      Resumen de Pago
                    </Title>

                    <Row
                      justify="space-between"
                      align="middle"
                      style={{ marginBottom: "10px" }}
                    >
                      <Col>Subtotal:</Col>
                      <Col>
                        <span style={{ fontSize: "18px" }}>
                          ${totalDeudaNeto.toFixed(2)} USD
                        </span>
                      </Col>
                    </Row>

                    <Row
                      justify="space-between"
                      align="middle"
                      style={{ marginBottom: "10px" }}
                    >
                      <Col>
                        <Space>
                          Descuento:
                          <Tooltip
                            title="Click para más informacion"
                            color="#108ee9"
                          >
                            <Button
                              type="link"
                              onClick={() =>
                                setAlivioFinancieroModalVisible(true)
                              }
                              style={{ padding: 0, height: "auto" }}
                            >
                              <InfoCircleOutlined
                                style={{ fontSize: "20px" }}
                              />
                            </Button>
                          </Tooltip>
                        </Space>
                      </Col>
                      <Col>
                        <span style={{ fontSize: "18px", color: "#52c41a" }}>
                          -${valorDescuento.toFixed(2)} USD
                        </span>
                      </Col>
                    </Row>

                    <Divider style={{ margin: "12px 0" }} />

                    <Row justify="space-between" align="middle">
                      <Col>Total a pagar:</Col>
                      <Col>
                        <span
                          style={{
                            fontSize: "24px",
                            fontWeight: "bold",
                            color: "#000",
                          }}
                        >
                          ${totalDeuda.toFixed(2)} USD
                        </span>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col xs={24} md={12} style={{ textAlign: "right" }}>
                  <Space direction="vertical" size="small">
                    <Radio.Group
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      style={{ marginBottom: "16px" }}
                    >
                      <Space direction="vertical">
                        <Radio value="placetopay">
                          <img
                            src={config.resources.placeToPayLogo}
                            alt="placetoPay"
                            style={{
                              maxWidth: "200px",
                              verticalAlign: "middle",
                              marginLeft: "10px",
                            }}
                          />
                        </Radio>
                      </Space>
                    </Radio.Group>
                    <Button
                      type="primary"
                      icon={<DollarOutlined />}
                      onClick={() => setPaymentModalVisible(true)}
                      size="large"
                      style={{
                        background: "#FF6C0C",
                        borderRadius: "6px",
                        height: "48px",
                      }}
                    >
                      Pagar con PlacetoPay
                    </Button>
                    <img
                    src={config.resources.franquicias}
                    alt="Franquicias Logo"
                    style={{ maxWidth: '200px', marginTop: '20px' }}
                  />
                  </Space>
                </Col>
              </Row>
            </Space>
          </Card>
        </>
      )}

      <PaymentModal
        visible={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          setProcessUrl(null);
          //setFacturaIds([]);
          setFechaPeticion(null);
        }}
        onSubmit={handlePaymentSubmit}
        totalAmount={totalDeuda}
        loading={paymentLoading}
        processUrl={processUrl}
        facturaIds={facturaIds}
        fechaPeticion={fechaPeticion}
      />

      <Modal
        title="Ley de Alivio Financiero - Gaceta 144"
        open={alivioFinancieroModalVisible}
        onCancel={() => setAlivioFinancieroModalVisible(false)}
        footer={null}
      >
        <div style={{ maxHeight: "500px", overflowY: "auto" }}>
          <p>📢 ¡Atención Dauleños!
            La Municipalidad de Daule condona el 100% de intereses, multas y recargos de tus deudas tributarias generadas hasta el 31 de diciembre de 2024.
            Solo debes pagar el capital total o parcial de tu obligación hasta el 30 de junio de 2025.
            ¡Es tu oportunidad para ponerte al día sin pagar recargos!</p>
          {/*           
          <img
            src={config.resources.bannerRemision}
            alt="Banner de Remisión"
            style={{ width: "100%", marginTop: "20px" }}
          /> */}
        </div>
      </Modal>
    </Card>
  );
}

export default ConsultaForm;
