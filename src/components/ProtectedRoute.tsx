import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { JSX } from "react";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { token, checked } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!checked) {
    return <div>Loading...</div>; // wait until auth is checked
  }

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
