import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useSelector } from 'react-redux';
import App from './App';
import { ConfigProvider, App as AntApp } from 'antd';
import 'antd/dist/reset.css';
import store from './store';

const Root = () => {
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    if (auth.user && auth.token) {
      localStorage.setItem(
        'auth',
        JSON.stringify({ user: auth.user, token: auth.token })
      );
    } else {
      localStorage.removeItem('auth');
    }
  }, [auth]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1A69AF',
        },
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));

const app = (
  <Provider store={store}>
    <Root />
  </Provider>
);

if (import.meta.env.PROD) {
  root.render(<React.StrictMode>{app}</React.StrictMode>);
} else {
  root.render(app);
}
