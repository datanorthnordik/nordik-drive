import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Autocomplete, Box, Button, Checkbox, Chip, FormControl, FormHelperText, InputLabel, MenuItem, OutlinedInput, Select, TextField, } from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AuthWrapper } from '../../components/Wrappers';
import { LinkButton } from "../../components/Links"
import TextGroup from "../../components/TextGroup"
import { useNavigate } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/Loader';
import { AuthContainer } from '../../components/containers/Containers';

const schema = yup.object().shape({
    firstname: yup.string().required('Firstname is required'),
    lastname: yup.string().required('Lastname is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required').matches(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,
        "Password must be at least 8 characters, include an uppercase letter, a number, and a special character"
    ),
    confirmPassword: yup.string()
        .required("Confirm Password is required")
        .oneOf([yup.ref("password")], "Passwords must match"),
    communities: yup.array().min(1, "Please select at least one community"),
});

function Signup() {
    const { handleSubmit, control, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            communities: [],
        },

    });

    const { data, loading, error, fetchData } = useFetch("http://127.0.0.1:8080/user/signup", "POST", false)
    const { data: communities, loading: cloading, error: cerror, fetchData: cFetchData } = useFetch("http://127.0.0.1:8080/communities", "GET", true)

    const navigate = useNavigate()

    const isLoading = loading || cloading

    const onSubmit = (data: any) => {
        fetchData(data)
    };

    useEffect(() => {
        if (data) {
            navigate("/files")
        }
    }, [data])

    useEffect(() => {
        console.log(communities)
    }, [communities])

    return (
        <AuthContainer>
            <Loader loading={isLoading} />
            <AuthWrapper>
                <h2>Create a new account</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
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
                    <Controller
                        name="communities"
                        control={control}
                        render={({ field }) => (
                            <Autocomplete
                                style={{margin: "10px 0px"}}
                                {...field}
                                multiple
                                options={Array.isArray((communities as any)?.communities) ? (communities as any)?.communities : []}
                                disableCloseOnSelect
                                getOptionLabel={(option: any) => option.name}
                                isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
                                renderOption={(props, option, { selected }) => (
                                    <li {...props}>
                                        <Checkbox
                                            style={{ marginRight: 8 }}
                                            checked={selected}
                                        />
                                        {option.name}
                                    </li>
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option: any, index: number) => (
                                        <Chip
                                            {...getTagProps({ index })}
                                            key={option.id}
                                            label={option.name}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Communities"
                                        placeholder="Search communities"
                                        error={!!errors.communities}
                                        helperText={errors.communities?.message}
                                    />
                                )}
                                onChange={(_, value) => field.onChange(value)}
                                value={field.value}
                            />
                        )}
                    />
                    <Button style={{ width: "100%", margin: "1rem 0" }} type="submit" variant="contained" color="primary">
                        SIGN UP
                    </Button>
                    <LinkButton role="button" onClick={() => navigate("/")}>Already have an account</LinkButton>
                </form>
            </AuthWrapper>
        </AuthContainer>

    );
}

export default Signup;