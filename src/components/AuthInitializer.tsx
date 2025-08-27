// src/components/AuthInitializer.tsx
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setAuth, clearAuth, setChecked } from "../store/auth/authSlics";
import useFetch from "../hooks/useFetch";

const AuthInitializer = () => {
  const dispatch = useDispatch();
  const {fetchData, data, error} = useFetch("https://127.0.0.1:8080/user/me", "GET")

  useEffect(() => {
    fetchData()
  }, [dispatch]);

  useEffect(()=>{
    if(data && !error){
      const { firstname, id, email, lastname, phonenumber, role } = (data as any).user
      dispatch(setAuth({ token: "Cookies", user: { id, firstname, lastname, email, phonenumber, role } }));
    } else if(error){
      dispatch(clearAuth());
    }
    dispatch(setChecked(true));
  },[data, error])

  return null; 
};

export default AuthInitializer;
