import { io } from "socket.io-client";

let socketInstance = null;

export const getSocket = () => socketInstance;

export const connectSocket = (token) => {
  if (!token) {
    return null;
  }

  if (socketInstance?.connected) {
    return socketInstance;
  }

  socketInstance = io(import.meta.env.VITE_API_URL?.replace(/\/api$/, "") || "http://localhost:5000", {
    transports: ["websocket"],
    auth: { token },
    withCredentials: true,
  });

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
