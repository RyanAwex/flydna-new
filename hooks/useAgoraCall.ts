import { useRef, useState, useCallback } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

function isValidToken(token: any): boolean {
  if (!token || typeof token !== "string") return false;
  if (token.length < 20) return false;
  return ["007", "006"].includes(token.slice(0, 3));
}

function sanitizeParam(val: any): any {
  return val === "undefined" || val === "null" || !val ? null : val;
}

export function useAgoraCall() {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrack = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrack = useRef<ICameraVideoTrack | null>(null);
  const isJoiningRef = useRef(false);

  const [isCallActive, setIsCallActive] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [localVideoTrackState, setLocalVideoTrackState] = useState<ICameraVideoTrack | null>(null);

  const setupClientEvents = (client: IAgoraRTCClient) => {
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "video") {
        setRemoteUsers((prev) =>
          prev.find((u) => u.uid === user.uid) ? prev : [...prev, user]
        );
        const playRemote = (retries = 5) => {
          const el = document.getElementById(`agora_remote${user.uid}`) || document.getElementById("agora_remote");
          if (el && user.videoTrack) {
            try {
              user.videoTrack.play(el);
            } catch (err) {
              console.warn("[Agora] Remote video play error:", err);
            }
          } else if (retries > 0) {
            setTimeout(() => playRemote(retries - 1), 300);
          }
        };
        setTimeout(() => playRemote(), 200);
      }
      if (mediaType === "audio") {
        try {
          user.audioTrack?.play();
        } catch (err) {
          console.warn("[Agora] Remote audio play error:", err);
        }
      }
    });

    client.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "video") {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      }
    });

    client.on("user-left", (user) => {
      setRemoteUsers((prev) => {
        const remaining = prev.filter((u) => u.uid !== user.uid);
        if (remaining.length === 0) {
          setTimeout(() => {
            safeCleanup();
          }, 300);
        }
        return remaining;
      });
    });
  };


  const safeCleanup = useCallback(async () => {
    try {
      localAudioTrack.current?.close();
      localAudioTrack.current = null;
      localVideoTrack.current?.close();
      localVideoTrack.current = null;
      setLocalVideoTrackState(null);
      setRemoteUsers([]);
      if (clientRef.current) {
        if (clientRef.current.connectionState !== "DISCONNECTED") {
          await clientRef.current.leave().catch(() => {});
        }
        clientRef.current = null;
      }
    } finally {
      setIsCallActive(false);
      isJoiningRef.current = false;
    }
  }, []);

  const startCall = useCallback(
    async (
      isVideoEnabled: boolean,
      channel: string | null,
      rtcToken: string | null,
      rtcUid: any,
      isScreenShare: boolean = false
    ) => {
      if (isJoiningRef.current) return;
      isJoiningRef.current = true;
      setError(null);

      const cleanChannel = channel ? channel.trim() : null;
      const cleanToken = rtcToken ? rtcToken.trim() : null;

      if (!AGORA_APP_ID) {
        setError("Agora App ID not found");
        isJoiningRef.current = false;
        return;
      }
      if (!cleanChannel) {
        setError("Call Error: Channel name is missing");
        isJoiningRef.current = false;
        return;
      }
      if (!cleanToken || !isValidToken(cleanToken)) {
        setError("Call Error: RTC Token is missing or invalid");
        isJoiningRef.current = false;
        return;
      }
      const rawUid = Number(rtcUid);
      if (isNaN(rawUid) || rawUid <= 0) {
        setError("Call Error: RTC UID is not a valid number");
        isJoiningRef.current = false;
        return;
      }
      const finalUid = rawUid & 0x7fffffff || 1;

      try {
        if (clientRef.current) {
          try {
            if (clientRef.current.connectionState !== "DISCONNECTED") {
              await clientRef.current.leave();
            }
          } catch {}
          clientRef.current = null;
        }

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setupClientEvents(client);
        clientRef.current = client;

        await client.join(AGORA_APP_ID, cleanChannel, cleanToken, finalUid);

        if (isScreenShare) {
          try {
            const screenResult = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "1080p_1" }, "auto");
            let screenVideoTrack: any;
            if (Array.isArray(screenResult)) {
              screenVideoTrack = screenResult[0];
            } else {
              screenVideoTrack = screenResult;
            }
            localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
            localVideoTrack.current = screenVideoTrack;
            setLocalVideoTrackState(screenVideoTrack);

            screenVideoTrack.on("track-ended", () => {
              safeCleanup();
            });
          } catch (err) {
            console.error("Screen share creation failed, falling back to camera:", err);
            const [audioTrack, videoTrack] =
              await AgoraRTC.createMicrophoneAndCameraTracks(
                { AEC: true, ANS: true, AGC: true },
                { encoderConfig: "720p_3" }
              );
            localAudioTrack.current = audioTrack;
            localVideoTrack.current = videoTrack;
            setLocalVideoTrackState(videoTrack);
          }
        } else if (isVideoEnabled) {
          try {
            localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: true, AGC: true });
          } catch (e) {
            console.warn("[Agora] Could not capture microphone:", e);
          }
          try {
            localVideoTrack.current = await AgoraRTC.createCameraVideoTrack({ encoderConfig: "720p_3" });
            setLocalVideoTrackState(localVideoTrack.current);
          } catch (e) {
            console.warn("[Agora] Could not capture camera:", e);
          }
        } else {
          try {
            localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: true, AGC: true });
          } catch (e) {
            console.warn("[Agora] Could not capture microphone:", e);
          }
        }

        const tracks = [localAudioTrack.current, localVideoTrack.current].filter(Boolean) as any[];
        if (tracks.length) await client.publish(tracks);

        setIsCallActive(true);
        if (localVideoTrack.current) {
          setTimeout(() => localVideoTrack.current?.play("agora_local"), 100);
        }
      } catch (err: any) {
        console.error("Agora startCall failed:", err);
        setError(err?.message || "Call failed");
        await safeCleanup();
      } finally {
        isJoiningRef.current = false;
      }
    },
    [safeCleanup]
  );

  const initAndStartCall = useCallback(
    async (isVideoEnabled: boolean, channelId: string, token: string) => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agora/getAuthToken`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ channelId }),
        });
        const data = await res.json();
        const d = data?.data;
        await startCall(isVideoEnabled, d?.channelId || channelId, sanitizeParam(d?.rtcToken), sanitizeParam(d?.rtcUid));
      } catch (err) {
        setError("Failed to get call token");
      }
    },
    [startCall]
  );

  const stopCall = useCallback(() => safeCleanup(), [safeCleanup]);

  // Mute/unmute local microphone
  const muteAudio = useCallback(async (muted: boolean) => {
    if (localAudioTrack.current) {
      await localAudioTrack.current.setEnabled(!muted);
      console.log(`[Agora] Mic ${muted ? "MUTED" : "UNMUTED"}`);
    }
  }, []);

  // Mute/unmute local camera
  const muteVideo = useCallback(async (off: boolean) => {
    if (localVideoTrack.current) {
      await localVideoTrack.current.setEnabled(!off);
      console.log(`[Agora] Camera ${off ? "OFF" : "ON"}`);
    }
  }, []);

  // Mute/unmute remote audio (speaker)
  const muteSpeaker = useCallback((muted: boolean) => {
    remoteUsers.forEach((user) => {
      if (user.audioTrack) {
        user.audioTrack.setVolume(muted ? 0 : 100);
      }
    });
    console.log(`[Agora] Speaker ${muted ? "MUTED" : "ON"}`);
  }, [remoteUsers]);

  const isScreenSharingRef = useRef(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const toggleScreenShare = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    const restoreCamera = async () => {
      if (localVideoTrack.current) {
        try { await client.unpublish(localVideoTrack.current as any); } catch (e) {}
        try { (localVideoTrack.current as any).close(); } catch (e) {}
        localVideoTrack.current = null;
      }
      try {
        const cam = await AgoraRTC.createCameraVideoTrack({ encoderConfig: "720p_3" });
        localVideoTrack.current = cam;
        setLocalVideoTrackState(cam);
        await client.publish(cam);
        setTimeout(() => { try { cam.play("agora_local"); } catch (e) {} }, 100);
      } catch (e) { console.warn("[Agora] camera restore failed:", e); }
      isScreenSharingRef.current = false;
      setIsScreenSharing(false);
    };
    if (isScreenSharingRef.current) { await restoreCamera(); return; }
    try {
      const screenResult = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "1080p_1" }, "auto");
      const screenTrack: any = Array.isArray(screenResult) ? screenResult[0] : screenResult;
      if (localVideoTrack.current) {
        try { await client.unpublish(localVideoTrack.current as any); } catch (e) {}
        try { (localVideoTrack.current as any).close(); } catch (e) {}
      }
      localVideoTrack.current = screenTrack;
      setLocalVideoTrackState(screenTrack);
      await client.publish(screenTrack);
      isScreenSharingRef.current = true;
      setIsScreenSharing(true);
      screenTrack.on("track-ended", () => { restoreCamera(); });
      setTimeout(() => { try { screenTrack.play("agora_local"); } catch (e) {} }, 100);
    } catch (e) {
      console.error("[Agora] screen share failed:", e);
    }
  }, []);

  return {
    isCallActive,
    remoteUsers,
    error,
    initAndStartCall,
    startCall,
    stopCall,
    localVideoTrack: localVideoTrackState,
    muteAudio,
    muteVideo,
    muteSpeaker,
    toggleScreenShare,
    isScreenSharing,
  };
}
