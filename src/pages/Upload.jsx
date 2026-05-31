import { useState, useRef, useEffect } from "react";
import styles from "./Upload.module.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Worker, Viewer } from "@react-pdf-viewer/core"; // Import PDF Viewer
import "@react-pdf-viewer/core/lib/styles/index.css"; // Core styles
import "@react-pdf-viewer/default-layout/lib/styles/index.css"; // Default layout styles
import {
  departmentsList,
  getUserDepartment,
} from "../services/questionPaperService";
import { getSessionUser } from "../services/supabaseAuth";
import { supabase } from "../lib/supabase";
import { uploadPdfToStorage } from "../services/storageService";

// (No changes to extractName and DropdownField components)
const extractName = (email) => {
  const namePart = email.split("@")[0];
  const firstName = namePart.split(".")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

const DropdownField = ({ title, options, selectedValue, onChange }) => {
  return (
    <div className={styles.dropdownContainer}>
      <label className={styles.dropdownLabel}>{title}:</label>
      <select
        className={styles.dropdown}
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.value}
          </option>
        ))}
      </select>
    </div>
  );
};

// (No changes to dropdownData)
const dropdownData = [
  {
    title: "Share With",
    options: departmentsList.map((department) => ({ value: department })),
  },
  {
    title: "Year",
    options: [{ value: "1" }, { value: "2" }, { value: "3" }, { value: "4" }],
  },
  {
    title: "Semester",
    options: [
      { value: "1" },
      { value: "2" },
      { value: "3" },
      { value: "4" },
      { value: "5" },
      { value: "6" },
      { value: "7" },
      { value: "8" },
    ],
  },
];

// NEW: Reusable component for file upload sections to keep code DRY
const FileUploadSection = ({
  title,
  fileURL,
  onUploadClick,
  onFileChange,
  inputRef,
}) => {
  return (
    <div className={styles.previewSection}>
      <h2 className={styles.previewTitle}>{title}</h2>
      <div className={styles.previewBox}>
        {fileURL ? (
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer fileUrl={fileURL} />
          </Worker>
        ) : (
          <p>No file selected</p>
        )}
      </div>
      <input
        type="file"
        ref={inputRef}
        onChange={onFileChange}
        style={{ display: "none" }}
        accept="application/pdf"
      />
      <button
        type="button"
        className={styles.uploadButton}
        onClick={onUploadClick}
      >
        Upload File
      </button>
    </div>
  );
};

export const NoteEditor = () => {
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [sharedDepartment, setSharedDepartment] = useState([]);
  const [dropdownValues, setDropdownValues] = useState({
    Department: "AD",
    Year: "2",
    Semester: "4",
  });

  // MODIFIED: State for two files (Set A and Set B)
  const [fileA, setFileA] = useState(null);
  const [fileURLA, setFileURLA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [fileURLB, setFileURLB] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(false);

  // MODIFIED: Refs for two file inputs
  const fileInputRefA = useRef(null);
  const fileInputRefB = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDepartment = async () => {
      try {
        const user = await getSessionUser();
        setCurrentUser(user);

        if (!user?.email) {
          return;
        }

        const userDept = await getUserDepartment(user.email);
        setDepartment(userDept);
      } catch (error) {
        console.error("Error fetching department:", error);
        toast.error("Error fetching department.");
      }
    };
    fetchUserDepartment();
  }, []);

  // (No changes to handleDropdownChange)
  const handleDropdownChange = (title, value) => {
    setDropdownValues((prev) => ({ ...prev, [title]: value }));
    if (title !== "Share With" || value === department) {
      return;
    }
    setSharedDepartment((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  // MODIFIED: Handles file changes for either Set A or Set B
  const handleFileChange = (e, fileSet) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      const fileUrl = URL.createObjectURL(selectedFile);
      if (fileSet === "A") {
        setFileA(selectedFile);
        setFileURLA(fileUrl);
      } else {
        // fileSet === 'B'
        setFileB(selectedFile);
        setFileURLB(fileUrl);
      }
    } else {
      toast.error("Please select a valid PDF file.");
    }
  };

  // MODIFIED: Triggers the correct file input click
  const handleFileUpload = (fileSet) => {
    if (fileSet === "A") {
      fileInputRefA.current.click();
    } else {
      // fileSet === 'B'
      fileInputRefB.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // MODIFIED: Validate both files are selected
    if (!subjectName || !subjectCode || !fileA || !fileB) {
      toast.error(
        "Please fill out all required fields and upload both Set A and Set B files."
      );
      return;
    }

    setLoading(true);
    try {
      // --- Upload File A ---
      const uploadedFileA = await uploadPdfToStorage(fileA);

      // --- Upload File B ---
      const uploadedFileB = await uploadPdfToStorage(fileB);

      const { data, error } = await supabase
        .from("uploads")
        .insert({
          subjectCode,
          course_name: subjectName,
          description,
          teacher_name: extractName(currentUser?.email),
          uploaded_by: currentUser?.email,
          status: "Pending",
          dept: department,
          shared: sharedDepartment,
          year: dropdownValues.Year,
          semester: dropdownValues.Semester,
          uploaded_at: new Date().toISOString(),
          file_name_a: uploadedFileA.fileName,
          file_url_a: uploadedFileA.fileUrl,
          file_name_b: uploadedFileB.fileName,
          file_url_b: uploadedFileB.fileUrl,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      toast.success("Files uploaded successfully!");
      console.log("Document written with ID: ", data.id);

      // MODIFIED: Reset all states including both files
      setSubjectCode("");
      setSubjectName("");
      setDescription("");
      setDropdownValues({ Department: "AD", Year: "2", Semester: "4" });
      setFileA(null);
      setFileURLA(null);
      setFileB(null);
      setFileURLB(null);

      navigate("/faculty");
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.editorContainer}>
      <form onSubmit={handleSubmit}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.userName}>
            Welcome, {extractName(currentUser?.email)}
          </h1>
          <div className={styles.mainContent}>
            <div className={styles.contentGrid}>
              {/* MODIFIED: The left column now contains two upload sections */}
              <div className={styles.previewColumn}>
                <FileUploadSection
                  title="Set A"
                  fileURL={fileURLA}
                  onUploadClick={() => handleFileUpload("A")}
                  onFileChange={(e) => handleFileChange(e, "A")}
                  inputRef={fileInputRefA}
                />
                <FileUploadSection
                  title="Set B"
                  fileURL={fileURLB}
                  onUploadClick={() => handleFileUpload("B")}
                  onFileChange={(e) => handleFileChange(e, "B")}
                  inputRef={fileInputRefB}
                />
              </div>

              {/* The details column remains the same */}
              <div className={styles.detailsColumn}>
                <div className={styles.detailsSection}>
                  <h2 className={styles.detailsTitle}>Details</h2>

                  {/* Field Groups for Subject Title, Code, Department */}
                  <div className={styles.formGroup}>
                    <label htmlFor="subjectName" className={styles.formLabel}>
                      Subject Title:
                    </label>
                    <input
                      id="subjectName"
                      type="text"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className={styles.formInput}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="subjectCode" className={styles.formLabel}>
                      Subject Code:
                    </label>
                    <input
                      id="subjectCode"
                      type="text"
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      className={styles.formInput}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="department" className={styles.formLabel}>
                      Department:
                    </label>
                    <input
                      id="department"
                      type="text"
                      value={department}
                      className={styles.formInput}
                      required
                      readOnly
                    />
                  </div>

                  {/* Dropdown Row */}
                  <div className={styles.dropdownRow}>
                    {dropdownData.map((dropdown, index) => (
                      <DropdownField
                        key={index}
                        title={dropdown.title}
                        options={dropdown.options}
                        selectedValue={dropdownValues[dropdown.title]}
                        onChange={(value) =>
                          handleDropdownChange(dropdown.title, value)
                        }
                      />
                    ))}
                  </div>

                  {/* Shared Departments Section */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Share With:</label>
                    <div className={styles.sharedDepartmentsContainer}>
                      {sharedDepartment.length > 0 ? (
                        sharedDepartment.map((dept, index) => (
                          <div
                            key={index}
                            className={styles.sharedDepartmentTag}
                          >
                            {dept}
                            <button
                              type="button"
                              className={styles.removeButton}
                              onClick={() =>
                                setSharedDepartment((prev) =>
                                  prev.filter((item) => item !== dept)
                                )
                              }
                            >
                              &times;
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className={styles.noSelectionText}>
                          No other departments selected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      disabled={loading}
                      className={styles.sendButton}
                    >
                      {loading ? "Uploading..." : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NoteEditor;
