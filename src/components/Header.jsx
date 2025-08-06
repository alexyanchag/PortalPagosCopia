import React, { useState, useEffect } from 'react';
import { Layout, Drawer, Button, Typography, Divider, Avatar, Space } from 'antd';
import { 
  QuestionCircleOutlined, 
  LeftOutlined, 
  SearchOutlined, 
  MenuOutlined, 
  UserOutlined, 
  LogoutOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const { Header } = Layout;
const { Title, Text } = Typography;

function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const showBackButton = location.pathname !== '/';
  
  const handleLogout = () => {
    dispatch(logout());
    navigate('/tramites');
    setDrawerVisible(false);
  };
  
  const showDrawer = () => {
    setDrawerVisible(true);
  };
  
  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <Header
      style={{
        background: 'linear-gradient(180deg, #1A69AF 0%, #1F447B 100%)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* Botón de regreso (si no está en la página principal) */}
      {showBackButton && (
        <LeftOutlined 
          style={{ 
            color: 'white', 
            fontSize: '20px', 
            cursor: 'pointer',
            position: 'absolute',
            left: '20px'
          }}
          onClick={() => navigate(-1)}
        />
      )}
      
      {/* Botón Hamburger a la derecha */}
      <MenuOutlined
        style={{
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          position: 'absolute',
          right: '20px',
          zIndex: 1
        }}
        onClick={showDrawer}
      />
      <div 
        style={{ 
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <div 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer' }}
        >
          <img 
            src="https://www.daule.gob.ec/wp-content/uploads/2025/01/Logo.png" 
            alt="Logo GAD Municipal de Daule" 
            height="40" 
          />
        </div>
      </div>  
      {/* Se eliminaron los iconos duplicados que ahora están en el drawer */}
      
      {/* Drawer lateral */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              size={40} 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#1A69AF', marginRight: '12px' }} 
            />
            <span>Menú</span>
          </div>
        }
        placement="left"
        onClose={closeDrawer}
        open={drawerVisible}
        width={280}
      >
        {user ? (
          <>
            {/* Información del usuario */}
            <div style={{ marginBottom: '20px' }}>
              <Title level={5}>Información del usuario</Title>
              <div style={{ marginLeft: '10px' }}>
                <p><Text strong>Nombre:</Text> {user.nombre} {user.apellido}</p>
                <p><Text strong>Cédula:</Text> {user.cedula}</p>
                <p><Text strong>Email:</Text> {user.email}</p>
              </div>
            </div>
            
            <Divider />
            
            {/* Opciones de navegación */}
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button 
                icon={<HistoryOutlined />} 
                onClick={() => {
                  navigate('/historial');
                  closeDrawer();
                }}
                style={{ textAlign: 'left', paddingLeft: '10px' }}
                block
              >
                Historial de Transacciones
              </Button>
              
              <Button 
                icon={<QuestionCircleOutlined />} 
                onClick={() => {
                  navigate('/faqplace');
                  closeDrawer();
                }}
                style={{ textAlign: 'left', paddingLeft: '10px' }}
                block
              >
                Preguntas Frecuentes
              </Button>
              
              {/* Botón de cerrar sesión */}
              <Button 
                danger 
                icon={<LogoutOutlined />} 
                onClick={handleLogout}
                style={{ marginTop: '20px', textAlign: 'left', paddingLeft: '10px' }}
                block
              >
                Cerrar Sesión
              </Button>
            </Space>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Text>No ha iniciado sesión</Text>
          </div>
        )}
      </Drawer>
    </Header>
  );
}

export default AppHeader;
