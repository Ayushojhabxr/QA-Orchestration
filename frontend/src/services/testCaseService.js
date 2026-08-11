import api from "./api";

export const getTestCases = async (params = {}) => {
  const { data } = await api.get("/testcases", { params });
  return data;
};

export const createTestCase = async (payload) => {
  const { data } = await api.post("/testcases", payload);
  return data;
};

export const getTestCaseById = async (id) => {
  const { data } = await api.get(`/testcases/${id}`);
  return data;
};

export const uploadExcelFile = async ({ file, project, onUploadProgress }) => {
  const formData = new FormData();
  formData.append("file", file);
  if (project) {
    formData.append("project", project);
  }

  const { data } = await api.post("/testcases/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });

  return data;
};

export const updateTestCase = async (id, payload) => {
  const { data } = await api.patch(`/testcases/${id}`, payload);
  return data;
};

export const assignTestCase = async (id, assignedToDeveloperId) => {
  const { data } = await api.patch(`/testcases/${id}/assign`, { assignedToDeveloperId });
  return data;
};

export const addComment = async (id, payload) => {
  const body = typeof payload === "string" ? { text: payload } : payload;
  const { data } = await api.post(`/testcases/${id}/comments`, body);
  return data;
};

export const exportTestCases = async (params = {}) => {
  const { data } = await api.get("/testcases/export", {
    params,
    responseType: "blob",
  });
  return data;
};
