import React, { useEffect, useState } from 'react';
import { Typography, Card, Alert, Spin, Form, Input, Button, Select, Row, Col, Divider, message, App } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFormularios } from '../../store/slices/authSlice';
import axios from 'axios';
import config from '../../config/config';

const { Title } = Typography;

const Iprus = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [predios, setPredios] = useState([]);
  const dispatch = useDispatch();
  const certificado = useSelector((state) => state.certificado.certificado);
  const user = useSelector((state) => state.user.user);

  const navigate = useNavigate();

  const apiBaseUrlServiciosDaule =
    config[config.environment].apiBaseUrlServiciosDaule;
  const apiBaseUrlConsultasDaule =
    config[config.environment].apiBaseUrlConsultasDaule;
  const apiBaseUrlServicioIprus =
    config[config.environment].apiBaseUrlServicioIprus;

  const idCertificadoIprus = config[config.environment].idCertificadoIprus;

  const fetchCertificado = async () => {
    try {
      const response = await axios.get(
        `${apiBaseUrlConsultasDaule}/api/certificacion/detalle/${idCertificadoIprus}`
      );
      dispatch(setCertificado(response.data));
    } catch (err) {
      console.error("Error al obtener el certificado:", err);
    }
  };

  const obtenerPredios = async () => {
    try {
      const response = await axios.get(
        //`${apiBaseUrlServicioIprus}/predios-identificacion/${user.cedula}`
        `${apiBaseUrlServicioIprus}/predios-identificacion/0900684598`
      );
      console.log(response.data)
      setPredios(response.data);
    } catch (err) {
      console.error("Error al obtener los predios:", err);
    }
  };

  useEffect(() => {
    console.log({
      USUARIO: user,
    });
    fetchCertificado();
    obtenerPredios();
  }, []);

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      // Consulta el API de predio para obtener la información del cliente
      console.log(predios.find(x => x.fid ==values.codigo));

      const predioResponse = await axios.get(
        `${apiBaseUrlConsultasDaule}/api/predio/${values.codigo}`
      );
      const clienteData = predioResponse.data.cliente;
      console.log(clienteData);

      if (!clienteData) {
        setError("El predio no tiene un cliente asociado.");
        setResult(null);
      } else {
        const cedula = clienteData.cedula;

        // Consulta la deuda del cliente usando el endpoint adecuado
        const deudaResponse = await axios.post(
          `${apiBaseUrlServiciosDaule}/it/rest/Banca/general/deudasRecordatorio`,
          cedula,
          {
            headers: {
              Accept: "application/json",
              Accesstoken: "Mun_Daule",
              "Content-Type": "text/plain",
            },
          }
        );

        const deudaData = await deudaResponse.data;

        if (deudaData.status === 404) {
          setError(
            "La cédula no pertenece a un cliente registrado o el cliente no se encuentra activo..."
          );
          setResult(null);
        } else if (
          false /*deudaData.deuda && deudaData.deuda.TotalConModuloTramites > 0*/
        ) {
          setError("El cliente tiene deudas pendientes.");
          setResult(null);
        } else {
          setResult(clienteData);
          setError(null);
          dispatch(setCliente(clienteData));
          dispatch(setPredio(
            predios.find(x => x.fid ==values.codigo)
          ));
        }
      }
    } catch (err) {
      setError(`Error al consultar el servicio. Detalles: ${err.message}`);
      setResult(null);
    }
    setSubmitting(false);
  };

  const totalValor = certificado
    ? certificado.rubros.reduce((acc, rubro) => acc + rubro.valor, 0)
    : 0;

  return (
    <div className="certificado-avaluos-container">
      <Card
        className="certificado-card"
        bordered={false}
        style={{
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Title level={3} className="certificado-title">
          CERTIFICADO DE IPRUS
        </Title>
        <label htmlFor="cedula" className="certificado-label">
          Escoja una Clave Predial Miduvi:
          <br/>
          <br/>
        </label>

        {({ isSubmitting }) => (
          <Form className="certificado-form">
              <div className="form-group" style={{ display: "flex", alignItems: "center" }} >
                <Field name="codigo">
                  {({ field }) => (
                    <Radio.Group {...field} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}>
                      {
                        predios.map( (item, index) => <Radio key={index} value={item.fid}>{item.codigo_miduvi} - {item.nombre_ciudadela}</Radio>)
                      }
                    </Radio.Group>
                  )}
                </Field>
              </div>
              <ErrorMessage name="codigo" component="div" className="error-message" />
              <div style={{ marginTop: "10px" }}>
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  Consultar
                </Button>
                <Button type="default" style={{ marginLeft: "10px" }} onClick={() => navigate("/")} >
                  Volver
                </Button>
              </div>
          </Form>
        )}

        {error && (
          <Alert message={error} type="error" showIcon style={{ marginTop: "20px" }} />
        )}
        {result && (
          <>
            <ClienteCard result={result} message={`<strong>IMPORTANTE:</strong> ¿Está seguro de solicitar el certificado IPRUS? Este tiene un costo de $${totalValor} y será enviado a su correo electrónico una vez se complete la solicitud.`} />
            <ImportanteAlerta message={`<strong>IMPORTANTE:</strong> ¿Está seguro de solicitar el certificado IPRUS? Este tiene un costo de $${totalValor} y será enviado a su correo electrónico una vez se complete la solicitud.`} />
          </>
        )}
      </Card>
    </div>
  );
};

export default Iprus;
