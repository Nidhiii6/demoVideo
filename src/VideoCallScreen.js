import React, {useEffect, useContext, useRef} from 'react';
import AppContext from '../App';
import {TwilioVideoParticipantView} from 'react-native-twilio-video-webrtc';

const VideoCallScreen = ({navigation}) => {
  const twilioVideo = useRef(null);
  const {props, setProps} = useContext(AppContext);
  useEffect(() => {
    twilioVideo.current.connect({
      roomName: props.roomName,
      accessToken: props.token,
    });
    setProps({...props, status: 'connecting'});
    return () => {
      _onEndButtonPress();
    };
  }, []);

  {
    (props.status === 'connected' || props.status === 'connecting') && (
      <View style={styles.callWrapper}>
        {props.status === 'connected' && (
          <View style={styles.grid}>
            {Array.from(props.videoTracks, ([trackSid, trackIdentifier]) => (
              <TwilioVideoParticipantView
                style={styles.remoteVideo}
                key={trackSid}
                trackIdentifier={trackIdentifier}
              />
            ))}
          </View>
        )}
      </View>
    );
  }

  const _onEndButtonPress = () => {
    twilioVideo.current.disconnect();
    // setProps(initialState);
  };

  const _onMuteButtonPress = () => {
    twilioVideo.current
      .setLocalAudioEnabled(!props.isAudioEnabled)
      .then(isEnabled => setProps({...props, isAudioEnabled: isEnabled}));
  };

  const _onFlipButtonPress = () => {
    twilioVideo.current.flipCamera();
  };

  return (
    <>
      <View style={styles.optionsContainer}>
        <TouchableOpacity sonPress={_onEndButtonPress}>
          <Text style={styles.buttonText}>End</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={_onMuteButtonPress}>
          <Text style={styles.buttonText}>
            {props.isAudioEnabled ? 'Mute' : 'Unmute'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={_onFlipButtonPress}>
          <Text style={styles.buttonText}>Flip</Text>
        </TouchableOpacity>
      </View>
      <TwilioVideo
        ref={twilioVideo}
        onRoomDidConnect={() => {
          setProps({...props, status: 'connected'});
        }}
        onRoomDidDisconnect={() => {
          setProps({...props, status: 'disconnected'});
          navigation.goBack();
        }}
        onRoomDidFailToConnect={error => {
          Alert.alert('Error', error.error);
          setProps({...props, status: 'disconnected'});
          navigation.goBack();
        }}
        onParticipantAddedVideoTrack={({participant, track}) => {
          if (track.enabled) {
            setProps({
              ...props,
              videoTracks: new Map([
                ...props.videoTracks,
                [
                  track.trackSid,
                  {
                    participantSid: participant.sid,
                    videoTrackSid: track.trackSid,
                  },
                ],
              ]),
            });
          }
        }}
        onParticipantRemovedVideoTrack={({track}) => {
          const videoTracks = props.videoTracks;
          videoTracks.delete(track.trackSid);
          setProps({...props, videoTracks});
        }}
      />
    </>
  );
};

export default VideoCallScreen;
