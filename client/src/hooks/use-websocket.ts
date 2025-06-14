import { useEffect, useRef } from "react";
import { wsClient } from "@/lib/websocket";

export function useWebSocket() {
  const isConnected = useRef(false);

  useEffect(() => {
    if (!isConnected.current) {
      wsClient.connect();
      isConnected.current = true;
    }

    return () => {
      wsClient.disconnect();
      isConnected.current = false;
    };
  }, []);

  return {
    send: wsClient.send.bind(wsClient),
    on: wsClient.on.bind(wsClient),
    off: wsClient.off.bind(wsClient),
  };
}
