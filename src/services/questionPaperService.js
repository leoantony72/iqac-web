import { supabase } from "../lib/supabase";

const submissions = [];
export const departmentsList = [
  "CE",
  "CSE",
  "ECE",
  "EEE",
  "ME",
  "MR",
  "AD",
  "CY",
  "Common Subjects",
];

export const uploadQuestionPaper = (data) => {
  submissions.push({ ...data, id: submissions.length + 1, status: "Pending" });
};

export const getSubmissions = () => submissions;

const uploadSelect =
  "id,subject_code,course_name,description,teacher_name,uploaded_by,status,dept,shared,year,semester,file_name,file_name_a,file_url_a,file_name_b,file_url_b,file_url,feedback,scrutiny_report,approved_at,uploaded_at";

const toDateTimeParts = (value) => {
  if (!value) {
    return { date: null, time: null };
  }

  const dateObject = new Date(value);

  if (Number.isNaN(dateObject.getTime())) {
    return { date: null, time: null };
  }

  return {
    date: dateObject.toLocaleDateString(),
    time: dateObject.toLocaleTimeString(),
  };
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value == null) {
    return [];
  }

  return [value];
};

const mapUploadRow = (row) => {
  const { date, time } = toDateTimeParts(row.uploaded_at);

  return {
    id: row.id,
    subjectCode: row.subject_code ?? "",
    courseName: row.course_name ?? "",
    description: row.description ?? "",
    teacherName: row.teacher_name ?? "",
    uploadedBy: row.uploaded_by ?? "",
    status: row.status ?? "Pending",
    dept: row.dept ?? "",
    shared: normalizeArray(row.shared),
    year: row.year ?? "",
    semester: row.semester ?? "",
    fileName: row.file_name ?? "",
    fileNameA: row.file_name_a ?? "",
    fileURLA: row.file_url_a ?? row.file_url ?? "",
    fileNameB: row.file_name_b ?? "",
    fileURLB: row.file_url_b ?? "",
    fileURL: row.file_url ?? "",
    feedback: normalizeArray(row.feedback),
    scrutinyReport: row.scrutiny_report ?? null,
    approvedAt: row.approved_at ?? null,
    uploadedAt: row.uploaded_at ?? null,
    date,
    time,
  };
};

const mapUserRow = (row) => ({
  id: row.id,
  email: row.email ?? "unknown@example.com",
  name: row.name ?? extractName(row.email),
  department: row.department ?? "Not Assigned",
  role: row.role ?? "faculty",
  scrutiny: row.scrutiny ?? false,
  scrutiny_common: row.scrutiny_common ?? false,
});

const fetchUploads = async (queryBuilder) => {
  const { data, error } = await queryBuilder.select(uploadSelect);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapUploadRow);
};

const fetchSingleUpload = async (queryBuilder) => {
  const { data, error } = await queryBuilder.select(uploadSelect).maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapUploadRow(data) : null;
};
// get submissions based on status
// for Admin
export const getApprovedSubmissions = async (status) => {
  try {
    const documents = await fetchUploads(
      supabase.from("uploads").eq("status", status)
    );

    console.log("Approved Submissions:", documents);
    return documents;
  } catch (error) {
    console.error("Error fetching approved submissions:", error);
    return [];
  }
};

// For teachers to sort through submission
export const getSubmissionsByStausAndEmail = async (email, status) => {
  try {
    const documents = await fetchUploads(
      supabase.from("uploads").eq("uploaded_by", email).eq("status", status)
    );

    console.log("Submissions:", status, documents);
    return documents;
  } catch (error) {
    console.error("Error fetching submissions by status and email:", error);
    return [];
  }
};

// for teachers to get details by id
export const getById = async (email) => {
  try {
    const document = await fetchSingleUpload(
      supabase.from("uploads").eq("uploaded_by", email).order("uploaded_at", {
        ascending: false,
      })
    );

    return document;
  } catch (error) {
    console.error("Error fetching filtered submissions:", error);
    throw error;
  }
};
export const getBySubmissionId = async (id) => {
  try {
    const document = await fetchSingleUpload(
      supabase.from("uploads").eq("id", id)
    );

    if (document) {
      console.log("Document data:", document);
      return document;
    }

    console.log("No document found with the given ID.");
    return null;
  } catch (error) {
    console.error("Error fetching document by ID:", error);
    throw error;
  }
};

export const getUserDepartment = async (email) => {
  // Get the current logged-in user

  if (email) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("department")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        const department = data.department;
        console.log("User department:", department);
        return department; // Return the department value
      } else {
        console.log("No such user document!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user department:", error);
      return null;
    }
  } else {
    console.log("No user is currently logged in.");
    return null;
  }
};
export const getUserScrutinyCommon = async (email) => {
  // Get the current logged-in user

  if (email) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("scrutiny_common")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        const scrutiny_common = data.scrutiny_common;
        console.log("User scrutiny_common:", scrutiny_common);
        return scrutiny_common; // Return the department value
      } else {
        console.log("No such user document!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user department:", error);
      return null;
    }
  } else {
    console.log("No user is currently logged in.");
    return null;
  }
};

export const getSubmissionsByTeacher = async (email) => {
  try {
    return await fetchUploads(
      supabase.from("uploads").eq("uploaded_by", email)
    );
  } catch (error) {
    console.error("Error fetching filtered submissions:", error);
    throw error;
  }
};
export const getSubmissionsByDepartment = async (department) => {
  try {
    return await fetchUploads(supabase.from("uploads").eq("dept", department));
  } catch (error) {
    console.error("Error fetching filtered submissions:", error);
    throw error;
  }
};

export const getSubmissionsBySharedDepartment = async (userDepartment) => {
  try {
    const { data, error } = await supabase
      .from("uploads")
      .select(uploadSelect)
      .contains("shared", [userDepartment]);

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapUploadRow);
  } catch (error) {
    console.error("Error fetching submissions by shared department:", error);
    throw error;
  }
};

/**
 * Rejects a submission, adding a new feedback object and the scrutiny report to the document.
 * @param {string} id - The document ID of the submission.
 * @param {string} feedbackText - The feedback message from the user.
 * @param {Array<Object>} scrutinyReport - The detailed checklist data.
 */
export const provideFeedback = async (id, feedbackText, scrutinyReport) => {
  try {
    const currentSubmission = await getBySubmissionId(id);
    const feedbackList = normalizeArray(currentSubmission?.feedback);

    const { error } = await supabase
      .from("uploads")
      .update({
        status: "Rejected",
        feedback: [...feedbackList, feedbackText],
        scrutiny_report:
          scrutinyReport ?? currentSubmission?.scrutinyReport ?? null,
      })
      .eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error providing feedback:", error);
    throw error;
  }
};

/**
 * Approves a submission and saves the final scrutiny checklist report.
 * (This function is correct and needs no changes)
 * @param {string} id - The document ID of the submission.
 * @param {Array<Object>} scrutinyReport - The detailed checklist data.
 */
export const approveSubmission = async (id, scrutinyReport) => {
  try {
    const currentSubmission = await getBySubmissionId(id);
    const { error } = await supabase
      .from("uploads")
      .update({
        status: "Approved",
        approved_at: new Date().toISOString(),
        scrutiny_report:
          scrutinyReport ?? currentSubmission?.scrutinyReport ?? null,
      })
      .eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error approving submission:", error);
    throw error;
  }
};

// export const updateUserRole = async (email) => {
//   try {
//     // Reference the user document in Firestore
//     const userDocRef = doc(db, "users", email);

//     // Update the user's role
//     await updateDoc(userDocRef, { role: "sadmin" });

//   } catch (error) {
//     console.error("Error updating user role:", error);
//   }
// };

const extractName = (email) => {
  if (!email || typeof email !== "string") {
    console.error("Invalid email provided:", email);
    return "Unknown"; // Default value if email is invalid
  }

  const namePart = email.split("@")[0];
  const firstName = namePart.split(".")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id,email,name,department,role,scrutiny,scrutiny_common");

    if (error) {
      throw error;
    }

    const users = (data ?? []).map(mapUserRow);

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const createUser = async (userId, email, name, department, role) => {
  try {
    const { error } = await supabase.from("users").upsert(
      {
        id: userId,
        email,
        name,
        department,
        role,
        scrutiny: false,
        scrutiny_common: false,
      },
      {
        onConflict: "email",
      }
    );

    if (error) {
      throw error;
    }

    console.log(`User ${userId} created successfully`);
    return true;
  } catch (error) {
    console.error("Error creating user:", error);
    return false;
  }
};

export const deleteUser = async (userId) => {
  try {
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      throw error;
    }

    console.log(`User ${userId} deleted successfully`);
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
};

export const getAllSubmissions = async () => {
  try {
    const documents = await fetchUploads(supabase.from("uploads"));

    console.log("All Submissions:", documents);
    return documents;
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    return [];
  }
};

export const getAllSubmissionsByStatus = async (status) => {
  try {
    const documents = await fetchUploads(
      supabase.from("uploads").eq("status", status)
    );

    console.log("All Submissions:", documents);
    return documents;
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    return [];
  }
};
