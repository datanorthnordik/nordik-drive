import * as React from 'react';
import { Account } from '@toolpad/core/Account';
import { AppProvider, Session } from '@toolpad/core';
import {color_secondary} from "../../constants/colors"
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

const initialsession = {
    user: {
        name: '',
        email: '',
        image: ``,
    },
};

export default function Logout() {
    const {user} = useSelector((state:any)=> state.auth)
    const [session, setSession] = React.useState<Session | null>(initialsession);
    const navigate = useNavigate()
    useEffect(()=>{
        setSession({
            user:{
                name: `${user.firstname}  ${user.lastname}`,
                email: user.email,
                image: `https://ui-avatars.com/api/?name=${user.firstname}+${user.lastname}&background=004B9C&color=fff`
            }
        })
    },[user])
    const authentication = React.useMemo(() => {
        return {
            signIn: () => {
                setSession(session);
            },
            signOut: () => {
                setSession(null);
                navigate("/")
            },
        };
    }, []);

    return (
        <AppProvider session={session} authentication={authentication}>
            <Account
                
                slotProps={{
                    signInButton: {
                        sx: {display: 'none'}
                    },
                    signOutButton:{
                        sx: {
                            color: `${color_secondary}`,
                            borderColor:  `${color_secondary}`
                        }
                    }
                }}
            />
        </AppProvider>

    );
}