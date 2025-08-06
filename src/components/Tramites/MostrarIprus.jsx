import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import config from '../../config/config';

const apiBaseUrlServicioIprus = config[config.environment].API_IPRUS;

const MostrarIprus = () => {
    const { md5 } = useParams();  // Captura el parámetro de la URL
    
  useEffect(() => {
    const urlApi = `${apiBaseUrlServicioIprus}/archivo/${md5}`;

    fetch(urlApi, {
      method: "GET",
      headers: {
        Accept: "application/pdf",
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const file = new Blob([blob], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(file);
        //window.open(fileURL); // O usa window.location.href = fileURL para forzar descarga
        window.location.href = fileURL
      })
      .catch((err) => {
        console.error("Error al cargar el PDF:", err);
      });
  }, []);

  return <p>Cargando PDF...</p>;
};

export default MostrarIprus;
