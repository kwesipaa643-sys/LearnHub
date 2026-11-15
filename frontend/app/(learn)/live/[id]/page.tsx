'use client';
// app/(learn)/live/[id]/page.tsx
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
  ControlBar,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { Loader2, Video, ArrowLeft } from 'lucide-react';
import { liveClassesApi } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LiveClassRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [roomData, setRoomData] = useState<{ token: string; room: string; url: string } | null>(null);
  const [joining, setJoining] = useState(true);

  const joinMutation = useMutation({
    mutationFn: () => liveClassesApi.join(Number(id)),
    onSuccess: (res) => {
      setRoomData(res.data);
      setJoining(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Failed to join class');
      router.back();
    },
  });

  useEffect(() => {
    joinMutation.mutate();
  }, []);

  if (joining || !roomData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-indigo-400" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-indigo-400" />
          <p className="text-gray-400">Joining live class...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900" data-lk-theme="default">
      <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-4">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Leave
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium">Live Class</span>
        </div>
      </div>

      <LiveKitRoom
        video={true}
        audio={true}
        token={roomData.token}
        serverUrl={roomData.url}
        style={{ height: 'calc(100vh - 56px)' }}
        onDisconnected={() => {
          toast.success('You have left the live class');
          router.back();
        }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
