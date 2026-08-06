import React, { useEffect, useMemo, useState } from "react";
import { Account, AppProvider, Session } from "@toolpad/core";
import useFetch from "../../hooks/useFetch";
import Loader from "../Loader";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store/store";
import { clearAuth, setChecked } from "../../store/auth/authSlics";
import { color_secondary } from "../../constants/colors";
import { apiUrl } from "../../config/api";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const initialSession: Session = {
  user: { name: "", email: "", image: "" },
};

export default function Logout() {
  const { user } = useSelector((state: any) => state.auth);
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(initialSession);
  const { data, loading, fetchData } = useFetch(apiUrl("user/logout"), "POST", false);
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

  const AccountMenuContent = (props: any) => {
    return (
      <Stack direction="column" {...props}>
        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography fontWeight={800}>{session?.user?.name || "Account"}</Typography>
          <Typography variant="body2" color="text.secondary">{session?.user?.email}</Typography>
        </Box>
        <Divider />
        <Box sx={{ px: 1.5, py: 1 }}>
          <Button onClick={() => navigate("/profile")} fullWidth variant="outlined">
            Profile & availability
          </Button>
        </Box>
        <Divider />
        <Box sx={{ px: 1.5, py: 1.5 }}>
          <Button fullWidth variant="outlined" color="inherit" onClick={authentication.signOut}>
            Sign out
          </Button>
        </Box>
      </Stack>
    );
  };

  const isSupportAdmin = String(user?.role || "").toLowerCase() === "admin";

  return (
    <AppProvider session={session} authentication={authentication}>
      <Loader loading={loading} />
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Account
          slots={isSupportAdmin ? { popoverContent: AccountMenuContent } : undefined}
          slotProps={{
            signInButton: { sx: { display: "none" } },
            signOutButton: { sx: { color: color_secondary, borderColor: color_secondary } },
          }}
        />
      </Box>
    </AppProvider>
  );
}
