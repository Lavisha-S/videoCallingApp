"use client";

import { useEffect, useState } from "react";
import Video, { Room, RemoteParticipant } from "twilio-video";
import VideoTile from "./VideoTile";
import Controls from "./Controls";

interface VideoRoomProps {
  user: { name: string; room: string };
  onLeave: () => void;
}

export default function VideoRoom({ user, onLeave }: VideoRoomProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user.name || !user.room) return;

    let activeRoom: Room;

    const connectRoom = async () => {
      try {
        const res = await fetch("http://localhost:5000/generate-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identity: user.name, roomName: user.room }),
        });

        const data = await res.json();

        if (!res.ok || !data.token) {
          setError(data.error || "Failed to fetch token");
          return;
        }

        activeRoom = await Video.connect(data.token, { name: user.room, audio: true, video: true });
        setRoom(activeRoom);
        setLoading(false);

        // Set participants
        setParticipants(Array.from(activeRoom.participants.values()));

        // Participant joined
        activeRoom.on("participantConnected", (p) => setParticipants((prev) => [...prev, p]));

        // Participant left
        activeRoom.on("participantDisconnected", (p) =>
          setParticipants((prev) => prev.filter((x) => x !== p))
        );

        // Handle duplicate identity or disconnect
        activeRoom.on("disconnected", (room) => {
          room.localParticipant.tracks.forEach((pub) => pub.track.stop());
          onLeave();
        });
      } catch (err: any) {
        console.error("Twilio connect error:", err);
        setError(err.message || "Connection failed");
        setLoading(false);
      }
    };

    connectRoom();

    return () => {
      if (activeRoom) activeRoom.disconnect();
    };
  }, [user, onLeave]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-white">Connecting...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <p>Error: {error}</p>
        <button
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          onClick={onLeave}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
        {room && <VideoTile participant={room.localParticipant} isLocal label="You" />}
        {participants.map((p) => (
          <VideoTile key={p.sid} participant={p} />
        ))}
      </div>

      {room && <Controls room={room} onLeave={onLeave} />}
    </div>
  );
}