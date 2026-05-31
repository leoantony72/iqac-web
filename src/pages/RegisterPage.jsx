import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./RegisterPage.module.css";
import { departmentsList } from "../services/questionPaperService";
import {
  fetchUserRole,
  getSessionUser,
  signUpWithEmailPassword,
} from "../services/supabaseAuth";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("AD");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const redirectByRole = async (emailAddress) => {
    const userRole = await fetchUserRole(emailAddress);

    if (userRole === "faculty") {
      navigate("/faculty");
    } else if (userRole === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getSessionUser();
        if (user?.email) {
          await redirectByRole(user.email);
        }
      } catch (error) {
        console.error("Error checking existing session:", error);
      }
    };

    checkUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedName = name.trim();

      const { data, error } = await signUpWithEmailPassword({
        email: normalizedEmail,
        password,
        name: normalizedName,
        department,
        role: "faculty",
      });

      if (error) {
        throw error;
      }

      if (data?.session?.user?.email) {
        toast.success("Account created successfully.");
        await redirectByRole(data.session.user.email);
      } else {
        toast.success(
          "Account created. Please check your email to confirm it."
        );
        navigate("/");
      }
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerPage}>
      <aside className={styles.heroPanel}>
        <div className={styles.overlay} />
        <div className={styles.heroContent}>
          <h1>Join the IQAC workflow</h1>
          <p>
            Create a faculty account to upload question papers, track scrutiny,
            and manage approvals in one place.
          </p>
          <div className={styles.heroCard}>
            <span>Supabase Auth</span>
            <span>Profile row in `users`</span>
            <span>Ready for role-based access</span>
          </div>
        </div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.brandRow}>
          <img
            className={styles.logo}
            src="https://ik.imagekit.io/AIDA/IQAC%20Web/jec_logo.png?updatedAt=1738127876326"
            alt="JEC logo"
          />
          <div>
            <h2>Register</h2>
            <p>Faculty account setup</p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@college.edu"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Department</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            >
              {departmentsList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              minLength={6}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              minLength={6}
              required
            />
          </label>

          <button
            className={styles.primaryButton}
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <button
          className={styles.secondaryButton}
          type="button"
          onClick={() => navigate("/")}
        >
          Back to login
        </button>
      </main>
    </div>
  );
};

export default RegisterPage;
