import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosResponse } from "axios";

const API_BASE_URL = "https://api.syriasouq.com";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  console.log("oye token mil ggayaaaaa:", token);
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
  (response: AxiosResponse) => {
    console.log(
      "API Response:",
      response.status,
      `${API_BASE_URL}${response.config.url}`,
      response.data
    ); // Debug response
    if (response.data?.data && Array.isArray(response.data.data)) {
      response.data.data = response.data.data.map((item: any) => {
        if (item.images && Array.isArray(item.images)) {
          item.images = item.images.map((img: string) =>
            img && !img.startsWith("http")
              ? `${API_BASE_URL}/Uploads/cars/${img}`
              : img || "https://via.placeholder.com/150?text=No+Image"
          );
        } else if (item.car?.images && Array.isArray(item.car.images)) {
          // Handle wishlist car images
          item.car.images = item.car.images.map((img: string) =>
            img && !img.startsWith("http")
              ? `${API_BASE_URL}/Uploads/cars/${img}`
              : img || "https://via.placeholder.com/150?text=No+Image"
          );
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
  api.post("/api/auth/login", { phone, password });
export const register = (username: string, phone: string, password: string) =>
  api.post("/api/auth/register", { username, phone, password });
export const forgotPassword = (phone: string) =>
  api.post("/api/auth/forgot-password", { phone });
export const resetPassword = (
  phone: string,
  otp: string,
  newPassword: string
) => api.post("/api/auth/reset-password", { phone, otp, newPassword });
export const logout = () => api.post("/api/auth/logout");
export const getCars = (params: { sort?: string; limit?: number } = {}) =>
  api.get("/api/cars", { params });
export const getCarById = (id: string) => api.get(`/api/cars/${id}`);
export const getUserById = (id: string) => api.get(`/api/users/${id}`);
export const addCar = (carData: FormData) => api.post("/api/cars", carData);
export const getWishlist = () => api.get("/api/wishlist");
export const addToWishlist = (carId: string) =>
  api.post("/api/wishlist", { carId });
export const removeFromWishlist = (wishlistId: string) =>
  api.delete(`/api/wishlist/${wishlistId}`);
export const getWishlistByUserId = (userId: string) =>
  api.get(`/api/wishlist/uid/${userId}`);
export const getConversations = () => api.get("/api/conversations");
export const sendMessage = (conversationId: string, message: string) =>
  api.post("/api/messages", { conversationId, message });
export const updateProfile = (profileData: FormData) =>
  api.put("/api/users/profile", profileData);
