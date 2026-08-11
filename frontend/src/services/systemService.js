import api from "./api";

export const searchGlobal = async (q) => {
  const { data } = await api.get("/system/search", { params: { q } });
  return data;
};

export const getSystemAnalytics = async () => {
  const { data } = await api.get("/system/analytics");
  return data;
};

export const getActivityFeed = async (params = {}) => {
  const { data } = await api.get("/system/activity", { params });
  return data;
};
