import React, { useEffect, useMemo, useState } from "react";
import { Account, AppProvider, Session } from "@toolpad/core";
import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store/store";
import { clearAuth, setChecked } from "../../store/auth/authSlics";
import { color_secondary } from "../../constants/colors";

const initialSession: Session = {
  user: { name: "", email: "", image: "" },
};

export default function Logout() {
  const { user } = useSelector((state: any) => state.auth);
  const [session, setSession] = useState<Session | null>(initialSession);
  const { data, loading, fetchData } = useFetch("https://nordikdriveapi-724838782318.us-west1.run.app/user/logout", "POST", false);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (user) {
      setSession({
        user: {
          name: `${user.firstname} ${user.lastname}`,
          email: user.email,
          image: `https://ui-avatars.com/api/?name=${user.firstname}+${user.lastname}&background=004B9C&color=fff&size=64`,
        },
      });
    }
  }, [user]);

  useEffect(() => {
    if (data) {
      dispatch(clearAuth());
      dispatch(setChecked(true));
      setSession(initialSession);
    }
  }, [data]);

  const authentication = useMemo(() => ({
    signIn: () => setSession(session),
    signOut: () => fetchData(),
  }), [session]);

  return (
    <AppProvider session={session} authentication={authentication}>
      <Loader loading={loading} />
      <Account
        slotProps={{
          signInButton: { sx: { display: "none" } },
          signOutButton: { sx: { color: color_secondary, borderColor: color_secondary } },
        }}
      />
    </AppProvider>
  );
}
