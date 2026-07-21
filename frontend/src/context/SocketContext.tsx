"use client";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { chat_service, useAppData } from "./AppContext";
import { Message } from "@/app/chat/page";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  newMessage: Message | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
  newMessage: null,
});

interface ProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: ProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAppData();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(chat_service, {
      query: { userId: user._id },
    });

    setSocket(newSocket);

    newSocket.on("getOnlineUser", (users: string[]) => {
      setOnlineUsers(users);
    });

    newSocket.on("newMessage", (message: Message) => {
      setNewMessage(message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, newMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const SocketData = () => useContext(SocketContext);
