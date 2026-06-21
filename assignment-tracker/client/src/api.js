const BASE = "/api";

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (options.raw) return res;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),

  admin: {
    dashboard: (params) => request("/admin/dashboard?" + new URLSearchParams(params)),
    users: (params) => request("/admin/users?" + new URLSearchParams(params)),
    addUserData: () => request("/admin/users/add-data"),
    addUser: (data) => request("/admin/users/add", { method: "POST", body: JSON.stringify(data) }),
    editUserData: (id) => request(`/admin/users/edit/${id}`),
    editUser: (id, data) => request(`/admin/users/edit/${id}`, { method: "POST", body: JSON.stringify(data) }),
    removeUser: (id) => request(`/admin/users/remove/${id}`, { method: "POST" }),
    calendar: () => request("/admin/calendar"),
    viewAssignment: (id) => request(`/admin/view/${id}`),
    config: () => request("/admin/config"),
    addDepartment: (dept) => request("/admin/config/department/add", { method: "POST", body: JSON.stringify({ department: dept }) }),
    removeDepartment: (dept) => request("/admin/config/department/remove", { method: "POST", body: JSON.stringify({ department: dept }) }),
    promote: (params) => request("/admin/promote?" + new URLSearchParams(params)),
    doPromote: (data) => request("/admin/promote", { method: "POST", body: JSON.stringify(data) }),
    passedOut: (params) => request("/admin/passedout?" + new URLSearchParams(params)),
    usersDownload: (params) => request("/admin/users/download?" + new URLSearchParams(params), { raw: true }),
    passedOutDownload: (params) => request("/admin/passedout/download?" + new URLSearchParams(params), { raw: true }),
    deleteAssignment: (id) => request(`/admin/delete/${id}`, { method: "DELETE" }),
  },

  teacher: {
    dashboard: (params) => request("/teacher/dashboard?" + new URLSearchParams(params)),
    config: () => request("/teacher/config"),
    add: (data) => request("/teacher/add", { method: "POST", body: JSON.stringify(data) }),
    editData: (id) => request(`/teacher/edit/${id}`),
    edit: (id, data) => request(`/teacher/edit/${id}`, { method: "POST", body: JSON.stringify(data) }),
    viewAssignment: (id) => request(`/teacher/view/${id}`),
    check: (assignmentId, studentId, checked) =>
      request(`/teacher/check/${assignmentId}/${studentId}`, { method: "POST", body: JSON.stringify({ checked }) }),
    uncheck: (assignmentId, studentId) =>
      request(`/teacher/check/${assignmentId}/${studentId}`, { method: "DELETE" }),
    deleteAssignment: (id) =>
      request(`/teacher/delete/${id}`, { method: "DELETE" }),
    calendar: () => request("/teacher/calendar"),
    students: (params) => request("/teacher/students?" + new URLSearchParams(params)),
    studentDetails: (id) => request(`/teacher/student/${id}`),
    history: (params) => request("/teacher/history?" + new URLSearchParams(params)),
    historyDownload: (params) => request("/teacher/history/download?" + new URLSearchParams(params), { raw: true }),
    studentsDownload: (params) => request("/teacher/students/download?" + new URLSearchParams(params), { raw: true }),
  },

  student: {
    dashboard: (params) => request("/student/dashboard?" + new URLSearchParams(params)),
    calendar: () => request("/student/calendar"),
    submit: (id, link) => request(`/student/submit/${id}`, { method: "POST", body: JSON.stringify({ link }) }),
  },
};
