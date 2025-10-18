import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, TextField, Box } from '@mui/material';
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
import toast from "react-hot-toast";
import { signup_success } from '../../constants/messages';

const schema = yup.object().shape({
    firstname: yup.string().required('First name is required'),
    lastname: yup.string().required('Last name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required').min(
        4,
        "Password must be at least 6 characters",
    ),
    confirmPassword: yup.string()
        .required("Confirm Password is required")
        .oneOf([yup.ref("password")], "Passwords must match")
});

function Signup() {
    const { handleSubmit, control, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
    });

    const { data, loading, error, fetchData } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/api/user/signup", "POST", false)

    const navigate = useNavigate()

    const onSubmit = (data: any) => {
        fetchData(data, {}, true)
    };

    useEffect(() => {
        if (data) {
            toast.success(signup_success)
            navigate("/")
        }
    }, [data])

    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])


    return (
        <AuthContainer>
            <Loader loading={loading} />
            <AuthWrapper>

                {/* Logos Section */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "2rem",
                        flexWrap: "wrap",
                        marginBottom: "1.5rem",
                    }}
                >
                    {/* Left Logo (Shingwauk) */}
                    <Box sx={{ height: "120px", maxWidth: "200px" }}>
                        <img
                            src="/logo-1.png"
                            alt="Children of Shingwauk Alumni Association"
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                    </Box>

                    {/* Right Logo (Nordik) */}
                    <Box sx={{ height: "60px", maxWidth: "220px" }}>
                        <img
                            src="https://nordikinstitute.com/wp-content/uploads/2020/04/NordikFinalLogo-640x160.png"
                            alt="Nordik Institute"
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                    </Box>
                </Box>

                <h2>Create a new account</h2>

                <FormWrapper onSubmit={handleSubmit(onSubmit)}>
                    <TextGroup>
                        <Controller
                            name="firstname"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    style={{ width: "50%" }}
                                    {...field}
                                    label="First name"
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
                                <TextField
                                    style={{ width: "50%" }}
                                    {...field}
                                    label="Last name"
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

                    <Button
                        style={{ width: "100%", margin: "1rem 0" }}
                        type="submit"
                        variant="contained"
                        color="primary"
                    >
                        SIGN UP
                    </Button>

                    <BorderLine />

                    <LinkButton role="button" onClick={() => navigate("/")}>
                        Already have an account
                    </LinkButton>
                </FormWrapper>
            </AuthWrapper>
        </AuthContainer>
    );
}

export default Signup;
