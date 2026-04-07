import "./App.css";
import { lazy, Suspense, type ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import ctheme from "./theme/theme";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthInitializer from "./components/AuthInitializer";
import Loader from "./components/Loader";
import FileList from "./pages/file_list/FileList";
import NotFoundPage from "./components/NotFound";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useSelector } from "react-redux";

const DataView = lazy(() => import("./pages/dataview/DataView"));
const ContactUs = lazy(() => import("./pages/contact_us/ContactUs"));
const Acknowledgement = lazy(() => import("./pages/Acknowledgement/Acknowledgement"));
const CoronerPage = lazy(() => import("./pages/CoronerPage/CoronerPage"));
const ActivityLogs = lazy(() => import("./components/tables/ActivityLogs"));
const AdminPanel = lazy(() => import("./pages/adminpanel/AdminPanel"));
const AdminRequestsWrapper = lazy(() => import("./pages/request_hub/AdminRequestsWrapper"));
const MyRequestsWrapper = lazy(() => import("./pages/request_hub/MyRequestsWrapper"));


function App() {
  const {user} = useSelector((state:any)=> state.auth)

  const renderProtectedRoute = (page: ReactNode) => (
    <ProtectedRoute>
      <Layout showHeader={true}>{page}</Layout>
    </ProtectedRoute>
  );

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
      <Suspense fallback={<Loader loading={true} text="Loading page..." />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/dataview"
            element={renderProtectedRoute(<DataView />)}
          />
          <Route
            path="/contact-us"
            element={renderProtectedRoute(<ContactUs />)}
          />
          <Route
            path="/acknowledgement"
            element={renderProtectedRoute(<Acknowledgement />)}
          />
          <Route
            path="/coroner"
            element={renderProtectedRoute(<CoronerPage />)}
          />
          <Route
            path="/files"
            element={renderProtectedRoute(<FileList />)}
          />
          <Route
            path="/useractivity"
            element={renderProtectedRoute(<ActivityLogs />)}
          />
          <Route
            path="/adminpanel"
            element={renderProtectedRoute(<AdminPanel />)}
          />

          <Route
            path="/requests"
            element={renderProtectedRoute(
              user?.role === "Admin" ? <AdminRequestsWrapper /> : <MyRequestsWrapper />
            )}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
    </ThemeProvider >
    </LocalizationProvider>
  );
}

export default App;

