import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUserProfile } from "../services/supabaseAuth";
import "../App.css";

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userProfile = await getCurrentUserProfile();
        setUserRole(userProfile?.role ?? null);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null);
      }

      setLoading(false);
    };

    fetchUserRole();
  }, []);

  if (loading) {
    return (
      <div className="Loader">
        <div>Loading...</div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Ensure requiredRoles is always an array and check if userRole is included
  if (!Array.isArray(requiredRoles) || !requiredRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;

// Redirect to login page if user is not authenticated or role does not match
// if (auth.currentUser.email == "sachin.ad21@jecc.ac.in") {
//   return children;
// }
