"use client";

import { useState } from "react";

interface JoinScreenProps {
  onJoin: (user: { name: string; room: string }) => void;
}

export default function JoinScreen({ onJoin }: JoinScreenProps) {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  const join = () => {
    if (!name.trim() || name.length < 2) {
      alert("Enter a valid name (min 2 characters)");
      return;
    }
    if (!room.trim() || room.length < 3) {
      alert("Enter a valid room (min 3 characters)");
      return;
    }
    onJoin({ name: name.trim(), room: room.trim() });
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-2xl w-[360px] shadow-2xl">
        <h1 className="text-2xl font-semibold text-center mb-6">Join Meeting</h1>

        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 p-3 rounded-lg bg-gray-700 text-white outline-none"
        />

        <input
          type="text"
          placeholder="Room Name"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="w-full mb-6 p-3 rounded-lg bg-gray-700 text-white outline-none"
        />

        <button
          onClick={join}
          className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg transition font-semibold"
        >
          Join
        </button>
      </div>
    </div>
  );
}