"use client";

import { useState } from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, ScreenShare } from "lucide-react";
import { Room, LocalVideoTrack } from "twilio-video";

interface ControlsProps {
  room: Room;
  onLeave: () => void;
}

export default function Controls({ room, onLeave }: ControlsProps) {
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [sharingTrack, setSharingTrack] = useState<LocalVideoTrack | null>(null);
  const [busy, setBusy] = useState(false);

  const toggleMic = () => {
    room.localParticipant.audioTracks.forEach(pub => pub.track?.isEnabled ? pub.track.disable() : pub.track?.enable());
    setMuted(!muted);
  };

  const toggleCam = () => {
    room.localParticipant.videoTracks.forEach(pub => pub.track?.isEnabled ? pub.track.disable() : pub.track?.enable());
    setCamOff(!camOff);
  };

  const toggleScreenShare = async () => {
    if (sharing || busy) return;
    setBusy(true);

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (!stream || !stream.getTracks().length) throw new Error("No screen track");

      const track = new LocalVideoTrack(stream.getTracks()[0]);
      await room.localParticipant.publishTrack(track);
      setSharingTrack(track);
      setSharing(true);

      track.mediaStreamTrack.onended = () => {
        room.localParticipant.unpublishTrack(track);
        track.stop();
        setSharing(false);
        setSharingTrack(null);
      };
    } catch (err) {
      console.error("Screen share error:", err);
      alert("Screen share failed");
    } finally {
      setBusy(false);
    }
  };

  const leaveRoom = () => {
    try {
      room.localParticipant.tracks.forEach(pub => {
        pub.track.stop();
        room.localParticipant.unpublishTrack(pub.track);
      });
      room.disconnect();
    } catch (err) {
      console.warn("Error leaving room:", err);
    } finally {
      onLeave();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-gray-900 p-3 rounded-full shadow-lg z-50">
      <button onClick={toggleMic} title={muted ? "Unmute" : "Mute"} className={`p-3 rounded-full transition ${muted ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}><MicOff /></button>
      <button onClick={toggleCam} title={camOff ? "Turn Camera On" : "Turn Camera Off"} className={`p-3 rounded-full transition ${camOff ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}><VideoOff /></button>
      <button onClick={toggleScreenShare} title={sharing ? "Sharing Screen" : "Share Screen"} disabled={busy} className={`p-3 rounded-full transition ${sharing ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}><ScreenShare /></button>
      <button onClick={leaveRoom} title="Leave Room" className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition"><PhoneOff /></button>
    </div>
  );
}