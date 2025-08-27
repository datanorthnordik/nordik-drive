
import "./App.css";
import { ThemeProvider } from "@mui/material/styles";
import ctheme from "./theme/theme";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/login/Login";
import Signup from "./pages/signup/Signup";
import DataView from "./pages/dataview/DataView";
import NotFoundPage from "./components/NotFound";
import Layout from "./components/Layout";
import AdminPanel from "./pages/adminpanel/AdminPanel";
import FileList from "./pages/file_list/FileList";

import ProtectedRoute from "./components/ProtectedRoute";
import AuthInitializer from "./components/AuthInitializer";

function App() {
  return (
    <ThemeProvider theme={ctheme}>
      <div className="App">
        <AuthInitializer />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route
            path="/dataview"
            element={
              <ProtectedRoute>
                <Layout showHeader={true}>
                  <DataView />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <Layout showHeader={true}>
                  <FileList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/adminpanel"
            element={
              <ProtectedRoute>
                <Layout showHeader={true}>
                  <AdminPanel />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;

