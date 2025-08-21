import { useEffect } from "react";
import DataGrid from "../../components/datatable/DataTable";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import { useSelector } from "react-redux";

export default function(){
    const {loading, error, fetchData, data} = useFetch("http://127.0.0.1:8080/file/user", "POST", false)
    const {selectedFile} = useSelector((state:any)=> state.file)
    useEffect(()=>{
        if(selectedFile){
            fetchData({filename: selectedFile.filename, communities: selectedFile.community})
        }
    }, [selectedFile])

    
    return (
        <>
         <Loader loading={loading}/>
         <DataGrid rowData={(data as any)?.row_data ? (data as any)?.row_data: []}/>
        </>
        
    )
}