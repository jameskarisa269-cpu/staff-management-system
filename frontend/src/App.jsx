import { useEffect, useState } from "react";
import Dashboard from "./services/Dashboard";
import Login from "./Login";

function App() {
    const [session, setSession] = useState(() => {
        const token = window.localStorage.getItem("staffhub_token");
        const user = window.localStorage.getItem("staffhub_user");
        if (!token || !user) return null;
        try {
            return { token, user: JSON.parse(user) };
        } catch {
            window.localStorage.removeItem("staffhub_token");
            window.localStorage.removeItem("staffhub_user");
            return null;
        }
    });

    useEffect(() => {
        function expireSession() {
            window.localStorage.removeItem("staffhub_token");
            window.localStorage.removeItem("staffhub_user");
            setSession(null);
        }
        window.addEventListener("staffhub:unauthorized", expireSession);
        return () => window.removeEventListener("staffhub:unauthorized", expireSession);
    }, []);

    function handleLogin(data) {
        window.localStorage.setItem("staffhub_token", data.token);
        window.localStorage.setItem("staffhub_user", JSON.stringify(data.user));
        setSession({ token: data.token, user: data.user });
    }

    function handleLogout() {
        window.localStorage.removeItem("staffhub_token");
        window.localStorage.removeItem("staffhub_user");
        setSession(null);
    }

    return session
        ? <Dashboard user={session.user} onLogout={handleLogout} />
        : <Login onLogin={handleLogin} />;
}

export default App;