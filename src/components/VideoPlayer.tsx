import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

// Import the youtube tech.
import 'videojs-youtube';

interface VideoPlayerProps {
  options: videojs.PlayerOptions; // Use the official PlayerOptions type
  onReady?: (player: Player) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ options, onReady }) => {
  const videoNode = useRef<HTMLDivElement | null>(null); // Use a div for the ref
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!videoNode.current) {
      return;
    }

    // Ensure we only initialize once
    if (!playerRef.current) {
      // Create a dedicated data-vjs-player element
      const videoElement = document.createElement('video');
      videoElement.classList.add('video-js', 'vjs-big-play-centered');
      videoNode.current.appendChild(videoElement);

      const currentOrigin = window.location.origin;

      const videoJsOptions = {
        ...options, // Pass all options from the parent
        youtube: {
          origin: currentOrigin, // Solves postMessage error

          // ### wmode: 'transparent' REMOVED ###
          // This line was causing the mobile scrolling issue.
          
          // This is still needed to prevent YouTube's controls
          // from fighting with Video.js controls on mobile.
          controls: 0,
          
          // (Recommended) Disable related videos at the end
          rel: 0 
        }
      };

      // Initialize the player
      playerRef.current = videojs(videoElement, videoJsOptions, () => {
        console.log('Player is ready');
        if (onReady) {
          onReady(playerRef.current as Player);
        }
      });
    }

    // Clean up
    return () => {
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, onReady]); 

  return (
    <div data-vjs-player>
      <div ref={videoNode} />
    </div>
  );
};

export default VideoPlayer;