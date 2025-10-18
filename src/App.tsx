
import "./App.css";
import { ThemeProvider } from "@mui/material/styles";
import ctheme from "./theme/theme";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/login/Login";
import Signup from "./pages/signup/Signup";
import DataView from "./pages/dataview/DataView";
import NotFoundPage from "./components/NotFound";
import Layout from "./components/Layout";
import AdminPanel from "./pages/adminpanel/AdminPanel";
import FileList from "./pages/file_list/FileList";

import ProtectedRoute from "./components/ProtectedRoute";
import AuthInitializer from "./components/AuthInitializer";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import UserActivity from "./components/tables/UserActivity";
import ContactUs from "./pages/contact_us/ContactUs";
import Acknowledgement from "./pages/Acknowledgement/Acknowledgement";


function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <ThemeProvider theme={ctheme}>
      <div className="App" style={{boxSizing: "border-box"}}>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#333",
              fontSize: "1.2rem",   // larger text for readability
              padding: "16px",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
            },
            success: {
              iconTheme: {
                primary: "#4CAF50",
                secondary: "#fff",
              },
            },
            error: {
              style: {
                background: "#ffe6e6",
                color: "#b71c1c",
                border: "1px solid #f5c2c2",
              },
            },
          }}
        />

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
          path="/contact-us"
          element={
            <ProtectedRoute>
              <Layout showHeader={true}>
                <ContactUs />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/acknowledgement"
          element={
            <ProtectedRoute>
              <Layout showHeader={true}>
                <Acknowledgement />
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
          path="/useractivity"
          element={
            <ProtectedRoute>
              <Layout showHeader={true}>
                <UserActivity />
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
    </ThemeProvider >
    </LocalizationProvider>
  );
}

export default App;

