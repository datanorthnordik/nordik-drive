import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Button } from "@mui/material";
import { useEffect, useState } from "react";
import useFetch from "../../hooks/useFetch";
import { useNavigate } from "react-router-dom";
import Loader from "../Loader";
import toast from "react-hot-toast";
import { password_validation_success } from "../../constants/messages";

interface PasswordModalProps {
    open: boolean;
    closePasswordModal: (success: boolean) => void
}

const PasswordModal = (props: PasswordModalProps) => {
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordInput, setPasswordInput] = useState('')
    const navigate = useNavigate()
    const { open, closePasswordModal } = props
    const onCloseModal = () => {
        setPasswordInput('');
        setPasswordError('');
        closePasswordModal(false)
    }

    const { loading, error, fetchData, data } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/user/verify-password", "POST")

    const verifyPassword = () => {
        if( passwordInput.length > 0){
             fetchData({"password": passwordInput})
        }
    };

    useEffect(() => {
        if (data || error) {
            try {
                if (data && !error) {
                    toast.success(password_validation_success)
                    closePasswordModal(true);
                    setPasswordError("")
                } else if (error) {
                    setPasswordError("Incorrect password. Please try again.");
                }
            } catch (error) {
                setPasswordError("Error verifying password. Please try again.");
            }
        }
    }, [data, error])

    return (
        <>
            <Loader loading={loading}/>
            <Dialog open={open} onClose={onCloseModal}>
            <DialogTitle>Enter Password</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Password"
                    type="password"
                    fullWidth
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") verifyPassword(); }}
                />
                {passwordError && <Typography variant="body2" style={{ color: "red", marginTop: 8 }}>{passwordError}</Typography>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onCloseModal}>Cancel</Button>
                <Button onClick={()=>{verifyPassword()}} variant="contained" color="primary">Submit</Button>
            </DialogActions>
        </Dialog>
        </>
        
    )
}

export default PasswordModal