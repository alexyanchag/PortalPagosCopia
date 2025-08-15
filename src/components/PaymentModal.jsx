import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Alert, message, Checkbox, Radio } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config/config';
import clearPaymentSession from '../utils/clearPaymentSession';

const generarCodigoVerificacion = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

const generarLetrasAleatorias = (count = 3) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < count; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
};

const PaymentModal = ({
  visible,
  onCancel,
  onSubmit,
  totalAmount,
  loading,
  processUrl,
  facturaIds,
  fechaPeticion
}) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [messageApi, contextHolder] = message.useMessage();

  // OTP
  const [verification, setVerification] = useState({
    codigoVerificacion: '',
    correoVerificado: false,
    enviandoCodigo: false,
  });

  const handleCancel = () => {
    clearPaymentSession();
    onCancel();
  };

  // Estado para controlar si el botón de pago ha sido presionado
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Referencia temporal
  const [timeReference, setTimeReference] = useState('');

  // Tipo de documento
  const [documentType, setDocumentType] = useState('CI');
  // Pasarela de pago (PlaceToPay)
  const idPasarela = 2; // Cambiado a constante en lugar de estado

  // Validaciones
  const validateIdentification = (_, value) => {
    if (!value || value.trim() === '') {
      return Promise.reject('Por favor ingrese su número de identificación');
    }

    const docType = form.getFieldValue('documentType');

    if (!/^\d+$/.test(value)) {
      return Promise.reject('El número de identificación solo debe contener números');
    }

    if (docType === 'CI') {
      if (!/^\d{10}$/.test(value)) {
        return Promise.reject('La cédula debe tener exactamente 10 dígitos');
      }
    } else if (docType === 'RUC') {
      if (!/^\d{13}$/.test(value)) {
        return Promise.reject('El RUC debe tener exactamente 13 dígitos');
      }
    }
    return Promise.resolve();
  };

  const validateOnlyLetters = (_, value) => {
    if (!value) {
      return Promise.reject('Este campo es requerido');
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
      return Promise.reject('Este campo solo puede contener letras');
    }
    return Promise.resolve();
  };

  // Validación para el campo de teléfono
  const validatePhone = (_, value) => {
    if (!value) {
      return Promise.reject('Por favor ingrese un número de teléfono');
    }
    if (!/^\+?\d+$/.test(value)) {
      return Promise.reject('Solo se permite el símbolo + al inicio y números');
    }
    return Promise.resolve();
  };

  // Manejador para el input de teléfono
  const handlePhoneInput = (e) => {
    const value = e.target.value;
    if (value === '') {
      form.setFieldsValue({ mobile: '' });
      return;
    }
    
    // Solo permite el + al inicio y números
    const sanitizedValue = value.replace(/[^\d+]/g, '');
    if (sanitizedValue.includes('+') && sanitizedValue.indexOf('+') !== 0) {
      // Si hay un + pero no está al inicio, lo removemos
      form.setFieldsValue({ mobile: sanitizedValue.replace(/\+/g, '') });
    } else {
      form.setFieldsValue({ mobile: sanitizedValue });
    }
  };

  // Enviar OTP
  const handleEnviarCodigo = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      messageApi.error('Por favor, ingrese un correo electrónico válido.');
      return;
    }

    setVerification((prev) => ({ ...prev, enviandoCodigo: true }));
    const codigo = generarCodigoVerificacion();
    setVerification((prev) => ({ ...prev, codigoVerificacion: codigo }));

    const payload = [{ correo: email, codigo }];

    try {
      const response = await axios.post(
        `${config[config.environment].API_BASE_URL}${config.endpoints.enviarOTP}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.status === 200) {
        messageApi.success('Código de verificación enviado al correo electrónico.');
      } else {
        messageApi.error('Error al enviar el código de verificación.');
      }
    } catch (error) {
      console.error('Error al enviar el código de verificación:', error);
      messageApi.error('Error al enviar el código de verificación.');
    } finally {
      setVerification((prev) => ({ ...prev, enviandoCodigo: false }));
    }
  };

  // Validar OTP
  const handleValidarCodigo = (codigoIngresado) => {
    if (codigoIngresado.length === 5) {
      if (codigoIngresado === verification.codigoVerificacion) {
        messageApi.success('Correo electrónico verificado exitosamente.');
        setVerification((prev) => ({ ...prev, correoVerificado: true }));
      } else {
        messageApi.error('El código ingresado es incorrecto.');
      }
    }
  };

  // Generar referencia
  const generateTimeReference = async () => {
    try {
      const response = await axios.get(config.externalServices.timeApi);
      const { year, month, day, hour, minute, seconds } = response.data;

      const formattedMonth = String(month).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      const formattedHour = String(hour).padStart(2, '0');
      const formattedMinute = String(minute).padStart(2, '0');
      const formattedSecond = String(seconds).padStart(2, '0');

      const reference = `${year}${formattedMonth}${formattedDay}${formattedHour}${formattedMinute}${formattedSecond}${generarLetrasAleatorias()}`;
      setTimeReference(reference);

      // Guardar en localStorage
      localStorage.setItem('timeReference', reference);

      return reference;
    } catch (error) {
      console.error('Error fetching time from API, using local time:', error);

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      const second = String(now.getSeconds()).padStart(2, '0');

      const reference = `${year}${month}${day}${hour}${minute}${second}${generarLetrasAleatorias()}`;
      setTimeReference(reference);

      // Guardar en localStorage
      localStorage.setItem('timeReference', reference);

      return reference;
    }
  };

  // Submit de Pago
  const handleSubmit = async () => {
    // Prevenir múltiples envíos
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      const values = await form.validateFields();
      const reference = timeReference || (await generateTimeReference());
      if (!reference) {
        messageApi.error('No se pudo generar la referencia temporal');
        setIsSubmitting(false);
        return;
      }
      if (!verification.correoVerificado) {
        messageApi.error('Debe verificar su correo electrónico antes de proceder al pago.');
        setIsSubmitting(false);
        return;
      }

      const paymentData = {
        totalValor: totalAmount,
        descripcion: 'Pago de valores adeudados',
        reference,
        returnUrl: window.location.origin + '/payment-status',
        //returnUrl: window.location.origin + '/pago-deudas/payment-status',
        buyer: {
          document: values.identification,
          documentType: documentType,
          name: values.name,
          surname: values.surname,
          email: values.email,
          mobile: values.mobile,
          address: {
            street: values.street,
            city: values.city,
            country: 'EC',
          },
        },
        idPasarela: idPasarela // Agregamos el idPasarela al objeto de datos
      };

      onSubmit(paymentData);
    } catch (error) {
      console.error('Validation failed:', error);
      clearPaymentSession();
      // En caso de error, permitir reintentar
      setIsSubmitting(false);
    }
  };

  // Al abrir el modal
  useEffect(() => {
    if (visible) {
      generateTimeReference();
    }
  }, [visible]);

  // Registrar sesión PENDING
  useEffect(() => {
    if (processUrl) {
      let sessionId = null;

      const registrarSesion = async (status, placeToPayResponse = null) => {
        try {
          // NUEVO: Recuperamos la cédula consultada
          const cedulaConsultada = localStorage.getItem('cedulaConsultada') || '';
          // También la referencia
          const refLocal = localStorage.getItem('timeReference') || timeReference || '';

          let statusData = {
            status: status,
            reason: '',
            message: '',
          };

          if (placeToPayResponse?.status) {
            statusData = {
              status: placeToPayResponse.status.status,
              reason: placeToPayResponse.status.reason,
              message: placeToPayResponse.status.message,
            };
          }

          const requestId = processUrl.split('/').slice(-2)[0];
          localStorage.setItem('requestId', requestId);
          localStorage.setItem('facturaIds', facturaIds.join(','));
          localStorage.setItem('idPasarela', idPasarela.toString());

          // Obtener IP del cliente
          const ipResponse = await axios.get(config.externalServices.ipifyApi);
          const ip_cliente = ipResponse.data.ip;

          // Mapear el estado
          const getEstadoYReason = (status, inputReason, inputMessage) => {
            switch (status) {
              case 'APPROVED':
                return { 
                  estado: 2, 
                  reason: 'APPROVED', 
                  message: inputMessage || 'La petición ha sido aprobada exitosamente'
                };
              case 'REJECTED':
                return { 
                  estado: 3, 
                  reason: 'REJECTED', 
                  message: inputMessage || 'Pago rechazado'
                };
              case 'PENDING':
                return { 
                  estado: 1, 
                  reason: 'PENDING', 
                  message: inputMessage || 'Pago pendiente de procesamiento'
                };
              default:
                return { 
                  estado: 1, 
                  reason: status || 'PENDING', 
                  message: inputMessage || 'Estado de pago no determinado'
                };
            }
          };

          const estadoInfo = getEstadoYReason(statusData.status, statusData.reason, statusData.message);

          //Obtener fecha para guardar en la sesion 
          let fechaSesionData;
          if (fechaPeticion)
            fechaSesionData = fechaPeticion;
          else
            fechaSesionData = new Date().toISOString();

          // Crear objeto de sesión
          const sesionData = {
            id: sessionId,
            referencia: refLocal,
            ids_facturas: facturaIds.join(','),
            requestId: requestId,
            fechaPeticion: fechaSesionData,
            estado: estadoInfo.estado,
            total: Number(totalAmount.toFixed(2)),
            reason: estadoInfo.reason,
            message: estadoInfo.message,
            cedulas: cedulaConsultada,
            ip_cliente: ip_cliente,
            titulos_facturas: "Pago de valores",
            process_url: processUrl,
            idPasarela: idPasarela
          };

          // Llamada directa a la API
          const response = await axios.post(
            `${config[config.environment].API_BASE_URL}${config.endpoints.payButtonSessions}`,
            sesionData,
            {
              headers: { 'Content-Type': 'application/json' }
            }
          );

          console.log('Respuesta del servidor:', response.data);

          if (response.data && response.data.id) {
            localStorage.setItem('sessionId', response.data.id);
            sessionId = response.data.id;
          }

          // Redirigir a PlaceToPay
          window.location.href = processUrl;
        } catch (error) {
          console.error('Error al registrar sesión:', error);
        }
      };

      registrarSesion('PENDING');
    }
  }, [processUrl, navigate, onCancel, facturaIds, totalAmount, timeReference, idPasarela]);

  return (
    <>
      {contextHolder}

      <Modal
        title="Datos para el Pago"
        open={visible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading || isSubmitting}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Procesando...' : 'Proceder al Pago'}
          </Button>,
        ]}
      >
        <Alert
          message={`Total a pagar: $${totalAmount.toFixed(2)}`}
          type="info"
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical">
          <Form.Item
            name="documentType"
            initialValue="CI"
            rules={[{ required: true, message: 'Por favor seleccione el tipo de documento' }]}
          >
            <Radio.Group
              onChange={(e) => {
                setDocumentType(e.target.value);
                form.setFieldsValue({ identification: '' });
              }}
            >
              <Radio.Button value="CI">Cédula</Radio.Button>
              <Radio.Button value="RUC">RUC</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="Cédula de identidad / RUC" name="identification" rules={[  { required: true, message: 'Por favor ingrese ' },{ validator: validateIdentification }]}>
            <Input
              placeholder={
                documentType === 'CI'
                  ? 'Ingrese su número de cédula'
                  : 'Ingrese su número de RUC'
              }
              maxLength={documentType === 'CI' ? 10 : 13}
            />
          </Form.Item>

          <Form.Item name="name" label="Nombres" rules={[ { required: true, message: 'Por favor ingrese sus nombres' },{ validator: validateOnlyLetters }]}>
            <Input />
          </Form.Item>

          <Form.Item name="surname" label="Apellidos" rules={[ { required: true, message: 'Por favor ingrese sus apellidos' },{ validator: validateOnlyLetters }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="mobile"
            label="Número de Teléfono"
            rules={[
              { required: true, message: 'Por favor ingrese su número de teléfono' },
              { validator: validatePhone }
            ]}
          >
            <Input 
              placeholder="Número de teléfono (ej: +593xxxxxxxxx)" 
              onChange={handlePhoneInput}
              maxLength={13}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Correo Electrónico"
            rules={[
              { required: true, message: 'Por favor ingrese su correo' },
              { type: 'email', message: 'Por favor ingrese un correo válido' },
            ]}
          >
            <Input />
          </Form.Item>

          <Button
            onClick={handleEnviarCodigo}
            loading={verification.enviandoCodigo}
            disabled={verification.correoVerificado}
            style={{ marginBottom: 12 }}
          >
            {verification.correoVerificado ? 'Correo Verificado' : 'Enviar Código OTP'}
          </Button>

          {!verification.correoVerificado && verification.codigoVerificacion && (
            <Form.Item label="Ingrese el código de verificación (5 dígitos)">
              <Input maxLength={5} onChange={(e) => handleValidarCodigo(e.target.value)} />
            </Form.Item>
          )}

          <Form.Item
            name="street"
            label="Dirección"
            rules={[{ required: true, message: 'Por favor ingrese su dirección' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="city"
            label="Ciudad"
            rules={[{ required: true, message: 'Por favor ingrese su ciudad' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="privacyPolicy"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject('Debe aceptar las políticas de privacidad para continuar'),
              },
            ]}
          >
            <Checkbox>
              Si acepto los terminos y condiciones del GAD Ilustre Municipalidad de Daule almacenar y tratar mis datos personales{' '}
              <a
                href={config.resources.privacyPolicy}
                target="_blank"
                rel="noopener noreferrer"
              >
                términos y condiciones
              </a>
            </Checkbox>
          </Form.Item>

          <Form.Item
            name="communications"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject('Debe aceptar las políticas de protección de datos'),
              },
            ]}
          >
            <Checkbox>
              Si acepto las política de protección de datos {' '}
                <a
                href={config.resources.Politic}
                target="_blank"
                rel="noopener noreferrer"
              >
                Politica de Protección
              </a>
              
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default PaymentModal;

