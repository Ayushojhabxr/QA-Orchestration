import api from "./api";

export const getUsers = async () => {
  const { data } = await api.get("/users");
  return data;
};

export const getCompanyUsers = async () => {
  const { data } = await api.get("/users/company");
  return data;
};

export const getDevelopers = async () => {
  const { data } = await api.get("/users/developers");
  return data;
};

export const updateUserRole = async (id, role) => {
  const { data } = await api.patch(`/users/${id}/role`, { role });
  return data;
};
