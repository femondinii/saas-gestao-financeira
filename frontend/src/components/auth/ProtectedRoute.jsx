import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
    const loc = useLocation();
    const hasAccess = !!localStorage.getItem("access_token");

    if (!hasAccess) {
        return (
            <Navigate
                to="/login"
                replace state={{ from: loc }}
            />
        );
    }

    return <Outlet />;
}
