import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, Checkbox, FormControlLabel, TextField, } from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AuthWrapper, FormWrapper } from '../../components/Wrappers';
import { LinkButton } from "../../components/Links"
import BorderLine from '../../components/BorderLine';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/Loader';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { setAuth } from '../../store/auth/authSlics';
import { AuthContainer } from '../../components/containers/Containers';
import { CheckBoxWrapper } from '../../components/TextGroup';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
  remember: yup.boolean()
});

function Login() {
  const { handleSubmit, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const {token} = useSelector((state:any)=> state.auth) 
  const dispatch = useDispatch<AppDispatch>();

  const navigate = useNavigate()

  const { data, loading, error, fetchData } = useFetch("https://127.0.0.1:8080/user/login", "POST", false)

  const onSubmit = (data: any) => {
    fetchData(data)
  };

  useEffect(() => {
    if ((data as any)?.data) {
      const {  firstname, id, email, lastname, phonenumber, role } = (data as any).data
      dispatch(setAuth({ token: "cookies", user: { id, firstname, lastname, email, phonenumber, role } }));
      navigate("/files")
    }
  }, [data])

  useEffect(()=>{
    if(token && !data){
      navigate("/files")
    }
  }, [token])

  return (
    <AuthContainer>
      <Loader loading={loading} />
      <AuthWrapper>
        <h2>Sign in with Email Address</h2>
        <FormWrapper onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email address"
                variant="outlined"
                fullWidth
                margin="normal"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                margin="normal"
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            )}
          />
          <Controller
            name="remember"
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <FormControlLabel
                style={{alignSelf: "flex-start"}}
                control={<CheckBoxWrapper  {...field} checked={field.value} />}
                label="Remember Me"
              />
            )}
          />
          <Button style={{ width: "100%", margin: "1rem 0rem" }} type="submit" variant="contained" color="primary">
            SIGN IN
          </Button>
          <LinkButton role="button">Forgotten password</LinkButton>
          <BorderLine />
          <Button style={{ margin: "1rem" }} onClick={() => { navigate("/signup") }}>Create new account</Button>
        </FormWrapper>
      </AuthWrapper>
    </AuthContainer>
  );
}

export default Login;