import React, { useEffect, useState } from "react";
import { AdminPanelWrapper } from "../../components/Wrappers";
import FileUploader from "../../components/FileUploader";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import UploadedFiles from "../../components/UploadedFiles";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/store";
import { setFiles } from "../../store/auth/fileSlice";

const AdminPanel = () => {
    const [newFile, setNewFile] = useState("")
    const { loading, error, data: files } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/file", "GET", true)
    const dispatch = useDispatch<AppDispatch>()
    useEffect(() => {
        if (files) {
            dispatch(setFiles({ files: (files as any).files }))
        }
    }, [files])
    return (
        <>
            <Loader loading={loading} />
            <AdminPanelWrapper>
                <>
                    <FileUploader setNewFile={setNewFile} />
                    <UploadedFiles newFile={newFile} />
                </>
            </AdminPanelWrapper>
        </>

    )

}

export default AdminPanel