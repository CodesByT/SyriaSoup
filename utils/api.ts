import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosResponse } from "axios";
import { Car } from "../types";

const API_BASE_URL = "https://api.syriasouq.com";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "multipart/form-data" },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(
    "API Request:",
    config.method?.toUpperCase(),
    `${API_BASE_URL}${config.url}`
  );
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse<{ data?: Car[]; success?: boolean }>) => {
    // console.log(
    //   "API Response:",
    //   response.status,
    //   `${API_BASE_URL}${response.config.url}`
    // );
    if (response.data?.data && Array.isArray(response.data.data)) {
      response.data.data = response.data.data.map((item: Car) => {
        if (item.images && Array.isArray(item.images)) {
          item.images = item.images.map((img: string) => {
            const fullUrl = img.startsWith("http")
              ? img
              : `${API_BASE_URL}/Uploads/cars/${img}`;
            // console.log("API: Transformed image URL:", fullUrl);
            return fullUrl;
          });
        }
        return item;
      });
    }
    return response;
  },
  (error) => {
    console.error("API Error:", {
      url: `${API_BASE_URL}${error.config?.url}`,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export const login = (phone: string, password: string) =>
  api.post("/auth/login", { phone, password });
export const register = (username: string, phone: string, password: string) =>
  api.post("/auth/register", { username, phone, password });
export const getCars = (params: { sort?: string; limit?: number } = {}) =>
  api.get("/api/cars", { params });
export const getCarById = (id: string) => api.get(`/api/cars/${id}`);
export const getUserById = (id: string) => api.get(`/api/users/${id}`);
export const addCar = (carData: FormData) => api.post("/api/cars", carData);
export const getWishlist = () => api.get("/api/wishlist");
export const addToWishlist = (carId: string) =>
  api.post("/api/wishlist", { carId });
export const removeFromWishlist = (carId: string) =>
  api.delete(`/api/wishlist/${carId}`);
export const getConversations = () => api.get("/api/conversations");
export const sendMessage = (conversationId: string, message: string) =>
  api.post("/api/messages", { conversationId, message });
export const updateProfile = (profileData: FormData) =>
  api.put("/api/users/profile", profileData);
