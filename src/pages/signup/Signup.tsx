import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, TextField, } from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AuthWrapper, FormWrapper } from '../../components/Wrappers';
import { LinkButton } from "../../components/Links"
import TextGroup from "../../components/TextGroup"
import { useNavigate } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/Loader';
import { AuthContainer } from '../../components/containers/Containers';
import BorderLine from '../../components/BorderLine';

const schema = yup.object().shape({
    firstname: yup.string().required('Firstname is required'),
    lastname: yup.string().required('Lastname is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required').min(
        6,
        "Password must be at least 6 characters",
    ),
    confirmPassword: yup.string()
        .required("Confirm Password is required")
        .oneOf([yup.ref("password")], "Passwords must match"),
    phonenumber: yup.string().required('Phone number is required')
        .matches(/^\d{10}$/, "Enter a valid phone number")
});

function Signup() {
    const { handleSubmit, control, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
    });

    const { data, loading, error, fetchData } = useFetch("https://127.0.0.1:8080/user/signup", "POST", false)

    const navigate = useNavigate()

    const isLoading = loading

    const onSubmit = (data: any) => {
        fetchData(data)
    };

    useEffect(() => {
        if (data) {
            navigate("/")
        }
    }, [data])


    return (
        <AuthContainer>
            <Loader loading={isLoading} />
            <AuthWrapper>
                <h2>Create a new account</h2>
                <FormWrapper onSubmit={handleSubmit(onSubmit)}>
                    <TextGroup>
                        <Controller
                            name="firstname"
                            control={control}
                            render={({ field }) => (
                                <TextField style={{ width: "50%" }}
                                    {...field}
                                    label="Firstname"
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.firstname}
                                    helperText={errors.firstname?.message}
                                />
                            )}
                        />
                        <Controller
                            name="lastname"
                            control={control}
                            render={({ field }) => (
                                <TextField style={{ width: "50%" }}
                                    {...field}
                                    label="Lastname"
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.lastname}
                                    helperText={errors.lastname?.message}
                                />
                            )}
                        />
                    </TextGroup>
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
                        name="phonenumber"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Phone number"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                error={!!errors.phonenumber}
                                helperText={errors.phonenumber?.message}
                                inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 10 }}
                            />
                        )}
                    />
                    <TextGroup>
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
                            name="confirmPassword"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Confirm Password"
                                    type="text"
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.confirmPassword}
                                    helperText={errors.confirmPassword?.message}
                                />
                            )}
                        />

                    </TextGroup>
                    <Button style={{ width: "100%", margin: "1rem 0" }} type="submit" variant="contained" color="primary">
                        SIGN UP
                    </Button>
                    <BorderLine />
                    <LinkButton role="button" onClick={() => navigate("/")}>Already have an account</LinkButton>
                </FormWrapper>
            </AuthWrapper>
        </AuthContainer>

    );
}

export default Signup;