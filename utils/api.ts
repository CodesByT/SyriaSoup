import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { type AxiosResponse } from "axios";

const API_BASE_URL = "https://api.syriasouq.com";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  // console.log("API: Token retrieved:", !!token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // console.log(
  //   "API Request:",
  //   config.method?.toUpperCase(),
  //   `${API_BASE_URL}${config.url}`
  // );
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data?.data && Array.isArray(response.data.data)) {
      response.data.data = response.data.data.map((item: any) => {
        if (item.images && Array.isArray(item.images)) {
          item.images = item.images.map((img: string) =>
            img && !img.startsWith("http")
              ? `${API_BASE_URL}/Uploads/cars/${img}`
              : img || "https://via.placeholder.com/150?text=No+Image"
          );
        } else if (item.car?.images && Array.isArray(item.car.images)) {
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
    if (
      error.response?.status !== 404 ||
      (!error.config?.url?.includes("/api/wishlist/uid/") &&
        !error.config?.url?.includes("/api/cars/user/"))
    ) {
      // console.error("API Error:", {
      //   url: `${API_BASE_URL}${error.config?.url}`,
      //   status: error.response?.status,
      //   message: error.message,
      //   responseData: error.response?.data,
      // });
    }
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
  // api.get("/api/cars?status=pending", { params });
  api.get("/api/cars?status=available", { params });
export const getCarById = (id: string) => api.get(`/api/cars/${id}`);
export const getUserById = (id: string) => api.get(`/api/users/${id}`);
export const addCar = (carData: FormData) =>
  api.post("/api/cars", carData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateCar = (carId: string, carData: FormData) =>
  api.put(`/api/cars/${carId}`, carData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteCar = (carId: string) => api.delete(`/api/cars/${carId}`);

export const getWishlist = () => api.get("/api/wishlist");
export const addToWishlist = (carId: string) =>
  api.post("/api/wishlist", { carId });
export const removeFromWishlist = (wishlistId: string) =>
  api.delete(`/api/wishlist/${wishlistId}`);
export const getWishlistByUserId = async (userId: string) => {
  try {
    const response = await api.get(`/api/wishlist/uid/${userId}`);
    return response;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // console.log("API: No wishlist found for user:", userId);
      return { data: { success: true, data: [] } };
    }
    throw error;
  }
};
export const getUserListings = async (userId: string) => {
  try {
    const response = await api.get(`/api/cars/user/${userId}`);
    return response;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // console.log("API: No listings found for user:", userId);
      return { data: { success: true, data: [] } };
    }
    throw error;
  }
};
export const updateProfileImage = async (
  userId: string,
  base64Image: string
) => {
  try {
    const response = await api.put(
      `/api/users/${userId}`,
      {
        profileImage: base64Image, // Send base64 string to updateUser endpoint
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response;
  } catch (error) {
    // console.error("Error updating profile image:", error);
    throw error;
  }
};
export const updateUserProfile = (userId: string, profileData: FormData) =>
  api.put(`/api/users/${userId}`, profileData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getConversations = () => api.get("/api/conversations");
export const sendMessage = (conversationId: string, message: string) =>
  api.post("/api/messages", { conversationId, message });
export const updateProfile = (profileData: FormData) =>
  api.put("/api/users/profile", profileData);
export const checkWishlist = async (
  carId: string,
  userId: string
): Promise<{ exists: boolean; wishlistId?: string }> => {
  try {
    const response = await getWishlistByUserId(userId);
    const wishlistData = response.data?.data || response.data;
    // console.log("API: checkWishlist response:", wishlistData);
    const item = Array.isArray(wishlistData)
      ? wishlistData.find((item: any) => item.car?._id === carId)
      : null;
    const exists = !!item;
    const wishlistId = item?._id;
    // console.log(
    //   "API: checkWishlist for carId:",
    //   carId,
    //   "userId:",
    //   userId,
    //   "exists:",
    //   exists,
    //   "wishlistId:",
    //   wishlistId
    // );
    return { exists, wishlistId };
  } catch (error: any) {
    // console.error("API: Error checking wishlist:", error);
    return { exists: false };
  }
};
