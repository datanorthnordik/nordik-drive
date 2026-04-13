import React, { useEffect, useMemo } from "react";
import DataGrid from "../../components/datatable/DataTable";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import { useSelector } from "react-redux";
import { apiUrl } from "../../config/api";

export default function(){
    const {loading, error, fetchData, data} = useFetch(apiUrl("file/data"), "GET", false)
    const {selectedFile} = useSelector((state:any)=> state.file)
    useEffect(()=>{
        if(selectedFile){
            fetchData(null,{filename: selectedFile.filename, version: selectedFile.version})
        }
    }, [selectedFile])

    const rowData = useMemo(
        () => (data ? (data as any).map((item:any)=> ({...item.row_data, "id": item.id})) : []),
        [data]
    )
    
    return (
        <React.Fragment >
         <Loader loading={loading}/>
         <DataGrid data-testid="grid" rowData={rowData}/>
        </React.Fragment>

    )
}
