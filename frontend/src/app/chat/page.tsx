"use client";
import Loading from "@/components/Loading";
import { useAppData } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const ChatApp = () => {
  //if not loggedin then it will redirect to login page so we use useeffect here.
  const { loading, isAuth } = useAppData();

  const router = useRouter();

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  if (loading) return <Loading />;
  
  return <div>Chat App</div>;
};

export default ChatApp;
