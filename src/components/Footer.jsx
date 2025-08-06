import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

function AppFooter() {
  return (
    <Footer
      style={{
        textAlign: 'center',
        background: 'linear-gradient(180deg, #1A69AF 0%, #1F447B 100%)',
        color: 'white',
        padding: '10px 0',
      }}
    >
      &copy; 2023 GAD Municipal de Daule | Todos los Derechos Reservados.
    </Footer>
  );
}

export default AppFooter;
