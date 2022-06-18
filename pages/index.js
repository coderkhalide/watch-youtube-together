import { useEffect, useRef, useState } from 'react';
import YouTube from 'react-youtube';
import { io } from 'socket.io-client';

const socket = io("https://yooappforwatchtogether.herokuapp.com");

export default function Home() {
  const videoRef = useRef(null)
  const [stage, setState] = useState(null)
  const [fraction, setFraction] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const opts = {
    height: '600',
    width: '640',
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 0,
    },
  };

  const _onReady = (event) => {
    // access to player in all event handlers via event.target
    // event.target.pauseVideo();
    // if(!videoRef) return
    videoRef.current = event.target
    setState(event?.data)
  }

  const handleStateChange = (e) => {
    setState(e.data)
  }

  const seekTo = (time) => {
    videoRef.current?.seekTo(time?.toString(), true)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setFraction(videoRef.current?.getCurrentTime() / videoRef.current?.getDuration() * 100)
    }, 200)
    return () => {
      clearInterval(interval)
    };
  }, [videoRef]);

  const handleSeek = (e) => {
    const position = e.clientX - e?.target?.getBoundingClientRect()?.left;
    const newFrac = position / e.target.offsetWidth * 100
    const timeToSeek = newFrac * videoRef.current?.getDuration() / 100
    seekTo(timeToSeek)
    sentDeta(timeToSeek)
  }

  const sentDeta = (seek = false) => {
    if (!seek) return
    const detaToBrodCast = {
      state: isPlaying ? 'play' : 'pause',
      seek,
      current: seek
    }
    socket.emit('stage', detaToBrodCast);
  }

  useEffect(() => {
    socket.on('stage', (data) => {
      console.log('stage', data)

      data?.state == 'play' && setIsPlaying(true)
      data?.state == 'pause' && setIsPlaying(false)

      seekTo(data?.current)

      if (data?.seek) return seekTo(data?.seek)

      if (data?.state == 'play') videoRef.current?.playVideo()
      if (data?.state == 'pause') videoRef.current?.pauseVideo()
    }, [])

    return () => {
      socket.off('stage', false);
    }
  }, [])

  // useEffect(() => {
  //   if(stage == -1)  setIsPlaying(false)
  //   if(stage == 1)  setIsPlaying(true)
  //   if(stage == 2)  setIsPlaying(false)
  //   if(stage == 3)  setIsPlaying(true)
  // }, [stage, isPlaying])

  const play = () => {
    setIsPlaying(true)
  }

  const pause = () => {
    setIsPlaying(false)
  }

  useEffect(() => {
    isPlaying ? videoRef.current?.playVideo() : videoRef.current?.pauseVideo()

    socket.emit('stage', {
      state: isPlaying ? 'play' : 'pause',
      seek: false,
      current: videoRef.current?.getCurrentTime()
    });
  }, [isPlaying])

  return (
    <div className="">
      <div className="">
        <div className="relative">
          <YouTube
            videoId="3WRKjDsG6zk"
            className="w-full"
            opts={opts}
            onReady={_onReady}
            onStateChange={handleStateChange}
          />
          <div className="absolute top-0 left-0 w-full h-full z-10"></div>
        </div>
        <br />
        {true && (
          <div className="flex items-center">
            <button onClick={() => isPlaying ? pause() : play()} className="button mr-4">
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <div className="w-full h-fit relative cursor-pointer" onClick={handleSeek}>
              <div
                className="absolute top-1/2 left-0 w-5 h-5 border-4 border-gray-800"
                style={{ left: `${fraction}%`, transform: `translateY(-50%)` }}
              />
              <div className="line py-2 " >
                <div className="h-1 bg-black" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
