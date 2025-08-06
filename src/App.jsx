import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, Grid } from 'antd';
import ConsultaForm from './components/ConsultaForm';
import PaymentStatus from './components/PaymentStatus';
import AppHeader from './components/Header';
import FaqPlace from './components/FaqPlace';
import Historial from './components/HistorialTransacciones';
import Dashboard from './components/Tramites/Dashboard';
import Iprus from './components/Tramites/Iprus';
import MostrarIprus from './components/Tramites/MostrarIprus';

const { Content } = Layout;
const { useBreakpoint } = Grid;

function App() {
  const screens = useBreakpoint();
  const contentPadding = screens.sm ? '0 50px' : '0 10px';

  return (
    <Router basename="/">
      <Layout style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Content
          style={{
            padding: contentPadding,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
          }}
        >
          <Routes>
            <Route path="/" element={<ConsultaForm />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            <Route path="/faqplace" element={<FaqPlace />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/tramites" element={<Dashboard />} />
            <Route path="/tramites/iprus" element={<Iprus />} />
            <Route path="/ver-iprus/:md5" element={<MostrarIprus />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
}

export default App;
