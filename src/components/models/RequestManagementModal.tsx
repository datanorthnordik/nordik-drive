import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Autocomplete, Button, Checkbox, Chip, FormControl, FormHelperText, InputLabel, MenuItem, Select, TextField, } from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/Loader';
import { CloseButton } from '../buttons/Button';

const schema = yup.object().shape({
    files: yup.array().min(1, "Please select at least one file"),
    role: yup.string().required("Please select a role"),
});

interface RequestManagementModalProps {
    selectedRequest: any;
    onProcess: ()=> void
    onClose: ()=>void
}

function RequestManagementModal(props: RequestManagementModalProps) {
    const { handleSubmit, control, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            files: [],
            role: ""
        },

    });

    const { selectedRequest, onClose, onProcess } = props

    const { data: roles, loading, error, fetchData } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/api/role", "GET", false)
    const { data: files, loading: cloading, error: cerror, fetchData: cFetchData } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/api/file", "GET", true)
    const { data: updateRequest, loading: uloading, fetchData: ufetchData } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/api/requests/update", "PUT", false)

    const navigate = useNavigate()

    const isLoading = loading || cloading || uloading

    useEffect(()=>{
        if(updateRequest){
            onProcess()
        }
    },[updateRequest])

    const onSubmit = (data: any) => {
        const body:any = []
        data.files.forEach((file:any)=>{
            body.push({
                filename: file.filename,
                community_name: selectedRequest.community_name,
                user_id: selectedRequest.user_id,
                status: "approved",
                role: data.role
            })
        })
        ufetchData(body)
    };

    useEffect(() => {
        fetchData(null)
        cFetchData(null)
    }, [])


    return (
        <>  <Loader loading={isLoading}></Loader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Controller
                    name="files"
                    control={control}
                    render={({ field }) => (
                        <Autocomplete
                            style={{ margin: "10px 0px" }}
                            {...field}
                            multiple
                            options={Array.isArray((files as any)?.files) ? (files as any)?.files : []}
                            disableCloseOnSelect
                            getOptionLabel={(option: any) => option.filename}
                            isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
                            renderOption={(props, option, { selected }) => (
                                <li {...props}>
                                    <Checkbox
                                        style={{ marginRight: 8 }}
                                        checked={selected}
                                    />
                                    {option.filename}
                                </li>
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option: any, index: number) => (
                                    <Chip
                                        {...getTagProps({ index })}
                                        key={option.id}
                                        label={option.filename}
                                    />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select files"
                                    placeholder="Search files"
                                    error={!!errors.files}
                                    helperText={errors.files?.message}
                                />
                            )}
                            onChange={(_, value) => field.onChange(value)}
                            value={field.value}
                        />
                    )}
                />
                <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                        <FormControl
                            fullWidth
                            style={{ margin: "10px 0px" }}
                            error={!!errors.role}
                        >
                            <InputLabel id="role-label">Select Role</InputLabel>
                            <Select
                                labelId="role-label"
                                {...field}
                                label="Select Role"
                            >

                                {((roles as any)?.roles ? (roles as any)?.roles : []).map((r: any) => (
                                    <MenuItem key={r.id} value={r.role}>
                                        {r.role}
                                    </MenuItem>
                                ))}

                            </Select>
                            {errors.role && (
                                <FormHelperText>{errors.role.message}</FormHelperText>
                            )}
                        </FormControl>
                    )}
                />

                <div style={{ display: "flex", gap: "10px" }}>
                    <CloseButton onClick={onClose} style={{ flex: 1 }}>Close</CloseButton>
                    <Button style={{ flex: 1 }} type="submit" variant="contained" color="primary">
                        Approve
                    </Button>
                </div>
            </form>
        </>

    );
}

export default RequestManagementModal;