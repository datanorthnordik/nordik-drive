import { useEffect } from "react"
import useFetch from "../../hooks/useFetch"
import { FileListWrapper } from "../../components/Wrappers"
import { FileButton } from "../../components/buttons/Button"
import { color_primary, color_secondary } from "../../constants/colors"
import { Button, Typography } from "@mui/material"
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch } from "../../store/store"
import { setSelectedFile } from "../../store/auth/fileSlice"
import { setRoles } from "../../store/auth/roleSlice"

const FileList = ()=>{
    const navigate = useNavigate()
    const dispatch = useDispatch<AppDispatch>();
    const {loading, error, fetchData, data: files} = useFetch("http://127.0.0.1:8080/requests/user", "GET", false)
    const {loading: rloading, error:rerror, data: roles, fetchData: rFetch} = useFetch("http://127.0.0.1:8080/role/user", "GET", true)
    const {selectedFile} = useSelector((state:any)=> state.file)
    useEffect(()=>{
        fetchData(null)
    }, [])

    useEffect(()=>{
        if(roles){
            dispatch(setRoles({"roles": (roles as any).roles }))
        }
    }, [roles])

    const onSelectFile = (file:any)=>{
        dispatch(setSelectedFile({selected:{filename: file.filename, community: file.community}}))
    }

    return(
        
        <FileListWrapper>
            <div style={{width: "100%", display: "flex", alignItems:"center", gap: "20px"}}>
                <h2 style={{color: color_primary}}>Access Files</h2>
                <Typography style={
                    {display: "flex", alignItems:"center", justifyContent: "center", color: color_secondary}
                    }>
                    <InfoOutlineIcon style={{color: color_secondary}}/>
                    Please select the file to view data
                </Typography>
            </div>
            
            {(files as any)?.access.map((file:any)=>(
                <FileButton className={file.filename == selectedFile?.filename ? "active_button": ""} onClick={()=>onSelectFile(file)}>
                    {file.filename}
                </FileButton>
            ))}
            <div style={{width:"100%", display:"flex", justifyContent:"flex-end"}}>
                <Button onClick={()=>navigate("/dataview")}>Proceed</Button>
            </div>
        </FileListWrapper>
    )
}

export default FileList