"use client";

import { useState } from "react";
import JoinScreen from "@/components/JoinScreen";
import VideoRoom from "@/components/VideoRoom";

interface User {
  name: string;
  room: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);

  const handleJoin = (userData: User) => {
    setUser(userData);
  };

  const handleLeave = () => {
    setUser(null);
  };

  return (
    <div className="h-screen w-screen bg-gray-900">
      {user ? (
        <VideoRoom user={user} onLeave={handleLeave} />
      ) : (
        <JoinScreen onJoin={handleJoin} />
      )}
    </div>
  );
}