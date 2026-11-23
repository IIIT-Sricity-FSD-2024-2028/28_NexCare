import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { DialogProvider } from './components/ui/Dialogs';
import { Provider } from 'react-redux';
import { store } from './store';

import './styles/global.css';
import './styles/nav.css';
import './styles/portal.css';
import './styles/auth.css';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <DialogProvider>
          <App />
        </DialogProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
