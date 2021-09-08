import { ToastContainer } from 'react-toastify';

import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';

import HomePage from './components/HomePage';
import { ClipboardProvider } from './hooks/clipboardContext';

import 'react-toastify/dist/ReactToastify.css';

const App = (): JSX.Element => {
  const theme = createTheme({ palette: { mode: 'light' } });
  return (
    <>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <ClipboardProvider>
          <HomePage />
          <ToastContainer />
        </ClipboardProvider>
      </ThemeProvider>
    </>
  );
};

export default App;
