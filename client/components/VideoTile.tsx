"use client";

import { useEffect, useRef, useState } from "react";
import { RemoteParticipant, LocalParticipant, Track, VideoTrack } from "twilio-video";

interface VideoTileProps {
  participant: RemoteParticipant | LocalParticipant;
  isLocal?: boolean;
  label?: string;
}

export default function VideoTile({ participant, isLocal = false, label }: VideoTileProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [videoTracks, setVideoTracks] = useState<VideoTrack[]>([]);

  // safely subscribe
  const trackSubscribed = (track: Track | null) => track && track.kind === "video" ? (track as VideoTrack) : null;

  useEffect(() => {
    if (!participant) return;

    const initialTracks = Array.from(participant.tracks.values())
      .map(pub => trackSubscribed(pub.track))
      .filter(Boolean) as VideoTrack[];

    setVideoTracks(initialTracks);

    const trackAdded = (track: Track) => {
      const video = trackSubscribed(track);
      if (video) setVideoTracks(prev => [...prev, video]);
    };

    const trackRemoved = (track: Track) => {
      const video = trackSubscribed(track);
      if (video) setVideoTracks(prev => prev.filter(v => v !== video));
    };

    participant.on("trackSubscribed", trackAdded);
    participant.on("trackUnsubscribed", trackRemoved);

    return () => {
      participant.removeListener("trackSubscribed", trackAdded);
      participant.removeListener("trackUnsubscribed", trackRemoved);
    };
  }, [participant]);

  useEffect(() => {
    const ref = videoRef.current;
    if (!ref) return;

    ref.innerHTML = "";
    videoTracks.forEach((track) => {
      const el = track.attach();
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.objectFit = "cover";
      ref.appendChild(el);
    });

    return () => {
      videoTracks.forEach(track => track.detach().forEach(el => el.remove()));
    };
  }, [videoTracks]);

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border-2 border-gray-700">
      <div ref={videoRef} className="w-full h-full"></div>
      <div className="absolute bottom-1 left-1 px-2 py-1 bg-black/50 text-white text-sm rounded">
        {label || participant.identity || (isLocal ? "You" : "Participant")}
      </div>
    </div>
  );
}