"use client";

import { useEffect, useRef, useState } from "react";
import Video, { Room, RemoteParticipant, LocalParticipant } from "twilio-video";

interface User {
  name: string;
  room: string;
}

interface UseTwilioRoomReturn {
  room: Room | null;
  participants: RemoteParticipant[];
  dominantSpeaker: RemoteParticipant | null;
  error: string | null;
}

export const useTwilioRoom = (user: User): UseTwilioRoomReturn => {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [dominantSpeaker, setDominantSpeaker] = useState<RemoteParticipant | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectedRef = useRef(false);

  useEffect(() => {
    if (!user?.name || !user?.room || connectedRef.current) return;
    connectedRef.current = true;

    let activeRoom: Room;

    const connect = async () => {
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

        activeRoom = await Video.connect(data.token, { audio: true, video: true });
        setRoom(activeRoom);

        // Initial participants
        setParticipants(Array.from(activeRoom.participants.values()));

        // Dynamic participants
        const updateParticipants = () =>
          setParticipants(Array.from(activeRoom.participants.values()));
        activeRoom.on("participantConnected", updateParticipants);
        activeRoom.on("participantDisconnected", updateParticipants);

        // Dominant speaker
        activeRoom.on("dominantSpeakerChanged", (p: RemoteParticipant | null) => setDominantSpeaker(p));
      } catch (err: any) {
        console.error("Twilio connect error:", err);
        setError(err.message || "Connection failed");
      }
    };

    connect();

    return () => {
      if (activeRoom) {
        activeRoom.localParticipant.tracks.forEach((pub) => pub.track.stop());
        activeRoom.disconnect();
      }
    };
  }, [user]);

  return { room, participants, dominantSpeaker, error };
};