'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { authApi } from '@/lib/api/api.auth';
import { RawMessage } from '@/types'; 
import { BASE_URL } from '@/types/core';

export type SocketEvent = 
  | (RawMessage & { event: 'message.receive' })
  | { event: 'user.online' | 'user.offline'; user_id: string };

interface SocketOptions {
  onMessageReceive?: (data: RawMessage) => void;
  onUserStatus?: (data: { event: string; user_id: string }) => void;
}

export function useSocket({ onMessageReceive, onUserStatus }: SocketOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const [isConnected, setIsConnected] = useState(false);

  // CRITICAL FIX: Use Refs for callbacks. 
  // This allows the WebSocket to stay open even when the UI logic (onMessageReceive) 
  // in ChatProvider changes due to activeContact updates.
  const onMessageReceiveRef = useRef(onMessageReceive);
  const onUserStatusRef = useRef(onUserStatus);

  useEffect(() => {
    onMessageReceiveRef.current = onMessageReceive;
    onUserStatusRef.current = onUserStatus;
  }, [onMessageReceive, onUserStatus]);

  const getWsUrl = useCallback(() => {
    if (!BASE_URL) return null;
    const token = localStorage.getItem('whisper_token');
    if (!token) return null;

    const protocol = BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const host = BASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `${protocol}://${host}/ws?token=${token}`;
  }, []);

  const connect = useCallback(async () => {
    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) return;

    const wsUrl = getWsUrl();
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SocketEvent;
        if (data.event === 'message.receive') {
          // Use the Ref instead of the direct prop
          onMessageReceiveRef.current?.(data as RawMessage);
        } else if (data.event === 'user.online' || data.event === 'user.offline') {
          // Use the Ref instead of the direct prop
          onUserStatusRef.current?.({ event: data.event, user_id: data.user_id });
        }
      } catch (err) {
        console.error('WS Parse Error:', err);
      }
    };

    ws.onclose = async (event) => {
      setIsConnected(false);
      socketRef.current = null;

      if (event.code === 4001) {
        try {
          await authApi.refresh();
          // eslint-disable-next-line react-hooks/immutability
          scheduleReconnect(0);
        } catch {
          window.location.href = '/login';
        }
        return;
      }

      if (event.code === 4003) {
        window.location.href = '/login';
        return;
      }

      if (event.code !== 1000) {
        const timeout = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
        reconnectAttempts.current++;
        scheduleReconnect(timeout);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getWsUrl]);

  const scheduleReconnect = useCallback((delay: number) => {
    if (reconnectTimeout.current) return;
    reconnectTimeout.current = setTimeout(() => {
      reconnectTimeout.current = null;
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      socketRef.current?.close(1000);
      socketRef.current = null;
    };
  }, [connect]);

  const sendWsMessage = useCallback((to: string, encryptedPackage: Record<string, unknown>) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'message.send',
        to,
        payload: encryptedPackage,
      }));
      return true;
    }
    return false;
  }, []);

  return { sendWsMessage, isConnected };
}