import './App.css';
import Login from "./pages/login/Login"
import Signup from './pages/signup/Signup';
import { ThemeProvider } from "@mui/material/styles";
import ctheme from "./theme/theme"
import { Route, Routes } from 'react-router-dom';
import DataView from './pages/dataview/DataView';
import NotFoundPage from './components/NotFound';
import Layout from './components/Layout';
import AdminPanel from './pages/adminpanel/AdminPanel';
import FileList from './pages/file_list/FileList';

function App() {
  return (
    <ThemeProvider theme={ctheme}>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dataview" element={<Layout showHeader={true}><DataView/></Layout>}/>
          <Route path="/files" element={<Layout showHeader={true}><FileList/></Layout>}/>
          <Route path="/adminpanel" element={<Layout showHeader={true}><AdminPanel/></Layout>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </ThemeProvider>

  );
}

export default App;
