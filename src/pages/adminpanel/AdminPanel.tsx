import React, { useEffect } from "react";
import AdminTabs from "../../components/admintabs/AdminTabs"
import { AdminPanelWrapper } from "../../components/Wrappers"
import FileUploader from "../../components/FileUploader";
import RequestTable from "../../components/tables/RequestTable";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import UploadedFiles from "../../components/UploadedFiles";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store/store";
import { setFiles } from "../../store/auth/fileSlice";

const AdminPanel = ()=>{
    const [value, setValue] = React.useState(0);
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue)
    };
    const {loading, error, data: files} = useFetch("https://127.0.0.1:8080/file", "GET", true)
    const dispatch = useDispatch<AppDispatch>()
    const {isAdmin, isManager} = useSelector((state:any)=> state.role)
    useEffect(()=>{
        if(files){
            dispatch(setFiles({files: (files as any).files}))
        }
    }, [files])
    return(
        <>
            <Loader loading={loading}/>
            <AdminPanelWrapper>
            <AdminTabs handleChange={handleChange} value={value}/>
            {value==0 &&
                <>
                    <FileUploader/>
                    <UploadedFiles/>
                </>
            }
            {value ==1  && <RequestTable/>}
            </AdminPanelWrapper>
        </>
        
    )
    
}

export default AdminPanel