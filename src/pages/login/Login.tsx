import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, TextField, } from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {AuthWrapper} from '../../components/Wrappers';
import {LinkButton} from "../../components/Links"
import BorderLine from '../../components/BorderLine';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/Loader';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { setAuth } from '../../store/auth/authSlics';
import { AuthContainer } from '../../components/containers/Containers';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

function Login() {
  const { handleSubmit, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const dispatch = useDispatch<AppDispatch>();

  const navigate = useNavigate()

  const { data, loading, error, fetchData } = useFetch("http://127.0.0.1:8080/user/login", "POST", false)

  const onSubmit = (data: any) => {
    fetchData(data)
  };

  useEffect(() => {
    if ((data as any)?.data) {
      const {token, firstname, id, email, lastname} = (data as any).data
      dispatch(setAuth({ token, user: { id, firstname, lastname, email} }));
      navigate("/files")
    }
  }, [data])

  return (
    <AuthContainer>
      <Loader loading={loading} />
      <AuthWrapper>
        <h2>Sign in with Email Address</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
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
          <Button style={{ width: "100%", margin: "1rem 0rem" }} type="submit" variant="contained" color="primary">
            SIGN IN
          </Button>
          <LinkButton role="button">Forgotten password</LinkButton>
          <BorderLine />
          <Button style={{ margin: "1rem" }} onClick={() => { navigate("/signup") }}>Create new account</Button>
        </form>
      </AuthWrapper>
    </AuthContainer>
  );
}

export default Login;