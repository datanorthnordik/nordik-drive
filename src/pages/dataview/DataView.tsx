import { useEffect } from "react";
import DataGrid from "../../components/datatable/DataTable";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import { useSelector } from "react-redux";

export default function(){
    const {loading, error, fetchData, data} = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/api/file/data", "GET", false)
    const {selectedFile} = useSelector((state:any)=> state.file)
    useEffect(()=>{
        if(selectedFile){
            fetchData(null,{filename: selectedFile.filename, version: selectedFile.version})
        }
    }, [selectedFile])

    const rowData = data ? (data as any).map((item:any)=> ({...item.row_data, "id": item.id})) : []
    
    return (
        <>
         <Loader loading={loading}/>
         <DataGrid rowData={rowData}/>
        </>
        
    )
}