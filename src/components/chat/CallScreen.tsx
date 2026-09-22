'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Phone } from 'lucide-react';

interface CallScreenProps {
  roomName: string;
  userId: string;
  userName: string;
  isVideoCall: boolean;
  onClose: () => void;
}

function removeVietnameseTones(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

export default function CallScreen({ roomName, userId, userName, isVideoCall, onClose }: CallScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zpRef = useRef<any>(null);
  const hasJoined = useRef(false);
  const didConnect = useRef(false);
  const [connectionError, setConnectionError] = useState(false);

  // Luôn giữ bản mới nhất của onClose để gọi đúng state mà không cần re-render
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;
    if (!containerRef.current || hasJoined.current) return;
    
    const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET as string;
    
    if (!appID || !serverSecret) {
      setConnectionError(true);
      return;
    }

    hasJoined.current = true;

    const initCall = async () => {
      // 1. Kiểm tra phần cứng: Tách riêng Mic và Cam để không bị báo lỗi chung
      let canUseVideo = isVideoCall;
      let canUseAudio = true;
      
      // Test Camera (nếu có yêu cầu)
      if (isVideoCall) {
        try {
          const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
          vStream.getTracks().forEach(t => t.stop());
        } catch (err: any) {
          console.warn('Camera locked or unavailable:', err);
          canUseVideo = false; // Tự động tắt cam
        }
      }

      // Test Microphone
      try {
        const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        aStream.getTracks().forEach(t => t.stop());
      } catch (err: any) {
        console.warn('Microphone locked or unavailable:', err);
        canUseAudio = false; // Tự động tắt mic
      }

      if (!isMounted) return;

      const safeUserName = removeVietnameseTones(userName);

      try {
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID, 
          serverSecret, 
          roomName, 
          userId,
          safeUserName
        );

        if (!isMounted) return;

        zpRef.current = ZegoUIKitPrebuilt.create(kitToken);

        if (!zpRef.current) {
          setConnectionError(true);
          return;
        }

        zpRef.current.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          turnOnMicrophoneWhenJoining: canUseAudio,
          turnOnCameraWhenJoining: canUseVideo,
          showMyCameraToggleButton: isVideoCall, // Ẩn hoàn toàn nút bật/tắt camera nếu là gọi thoại
          showAudioVideoSettingsButton: isVideoCall, // Ẩn cài đặt video nếu là gọi thoại
          showPreJoinView: false,
          showLeavingView: false,
          showLeaveRoomConfirmDialog: false,
          onJoinRoom: () => {
            didConnect.current = true;
          },
          onLeaveRoom: () => {
            if (didConnect.current && isMounted) {
              onCloseRef.current(); // Dùng ref thay vì dependency
            }
          },
          onUserLeave: () => {
            if (didConnect.current && isMounted) {
              onCloseRef.current(); // Dùng ref thay vì dependency
            }
          }
        });
      } catch (e) {
        console.error('ZegoCloud initialization error:', e);
        if (isMounted) setConnectionError(true);
      }
    };

    initCall();

    return () => {
      isMounted = false;
      if (zpRef.current) {
        try { zpRef.current.destroy(); } catch(e) {}
        zpRef.current = null;
      }
      hasJoined.current = false;
      didConnect.current = false;
    };
  }, [roomName, userId, userName, isVideoCall]); // KHÔNG BAO GIỜ bỏ onClose vào đây!

  if (connectionError) {
    return (
      <div className="fixed inset-0 z-[1000] bg-gradient-to-b from-gray-800 to-gray-950 flex flex-col items-center justify-center text-white">
        <p className="text-xl font-bold mb-2">Không thể kết nối</p>
        <p className="text-gray-300 mb-6 text-center px-8">Vui lòng kiểm tra kết nối mạng và cho phép quyền Camera/Microphone</p>
        <button 
          onClick={() => onCloseRef.current()}
          className="px-8 py-3 bg-red-500 rounded-full font-bold hover:bg-red-600 transition-colors"
        >
          Đóng
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-[#1a1a1a] flex flex-col items-center justify-center">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
