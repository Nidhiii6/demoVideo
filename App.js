import 'react-native-gesture-handler';
import React, {useState, useRef, useEffect, useContext} from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  NativeModules,
} from 'react-native';
import {
  checkMultiple,
  request,
  requestMultiple,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import Orientation from 'react-native-orientation-locker';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import {
  TwilioVideoLocalView,
  TwilioVideoParticipantView,
  TwilioVideo,
} from 'react-native-twilio-video-webrtc';
import {OuterExpressionKinds} from 'typescript';
const Stack = createStackNavigator();
const initialState = {
  isAudioEnabled: true,
  status: 'disconnected',
  participants: new Map(),
  videoTracks: new Map(),
  userName: '',
  roomName: '',
  token: '',
};

const AppContext = React.createContext(initialState);

const dimensions = Dimensions.get('window');

const App = () => {
  const [props, setProps] = useState(initialState);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AppContext.Provider value={{props, setProps}}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Video Call" component={VideoCallScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppContext.Provider>
    </>
  );
};

const HomeScreen = ({navigation}) => {
  const {props, setProps} = useContext(AppContext);

  const _checkPermissions = callback => {
    const iosPermissions = [PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.MICROPHONE];
    const androidPermissions = [
      PERMISSIONS.ANDROID.CAMERA,
      PERMISSIONS.ANDROID.RECORD_AUDIO,
    ];
    checkMultiple(
      Platform.OS === 'ios' ? iosPermissions : androidPermissions,
    ).then(statuses => {
      const [CAMERA, AUDIO] =
        Platform.OS === 'ios' ? iosPermissions : androidPermissions;
      if (
        statuses[CAMERA] === RESULTS.UNAVAILABLE ||
        statuses[AUDIO] === RESULTS.UNAVAILABLE
      ) {
        Alert.alert(
          'Error',
          'Hardware to support video calls is not available',
        );
      } else if (
        statuses[CAMERA] === RESULTS.BLOCKED ||
        statuses[AUDIO] === RESULTS.BLOCKED
      ) {
        Alert.alert(
          'Error',
          'Permission to access hardware was blocked, please grant manually',
        );
      } else {
        if (
          statuses[CAMERA] === RESULTS.DENIED &&
          statuses[AUDIO] === RESULTS.DENIED
        ) {
          requestMultiple(
            Platform.OS === 'ios' ? iosPermissions : androidPermissions,
          ).then(newStatuses => {
            if (
              newStatuses[CAMERA] === RESULTS.GRANTED &&
              newStatuses[AUDIO] === RESULTS.GRANTED
            ) {
              callback && callback();
            } else {
              Alert.alert('Error', 'One of the permissions was not granted');
            }
          });
        } else if (
          statuses[CAMERA] === RESULTS.DENIED ||
          statuses[AUDIO] === RESULTS.DENIED
        ) {
          request(statuses[CAMERA] === RESULTS.DENIED ? CAMERA : AUDIO).then(
            result => {
              if (result === RESULTS.GRANTED) {
                callback && callback();
              } else {
                Alert.alert('Error', 'Permission not granted');
              }
            },
          );
        } else if (
          statuses[CAMERA] === RESULTS.GRANTED ||
          statuses[AUDIO] === RESULTS.GRANTED
        ) {
          callback && callback();
        }
      }
    });
  };

  useEffect(() => {
    _checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.text}>User Name</Text>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              value={props.userName}
              onChangeText={text => setProps({...props, userName: text})}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.text}>Room Name</Text>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              value={props.roomName}
              onChangeText={text => setProps({...props, roomName: text})}
            />
          </View>
          <View style={styles.formGroup}>
            <TouchableOpacity
              disabled={false}
              style={styles.button}
              onPress={() => {
                _checkPermissions(() => {
                  // const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTSzJlYTkyYTEyZGMwZTFjMThlZTRiMjkyNDdkYmFiOTcyLTE2ODUzNTcxNDkiLCJncmFudHMiOnsiaWRlbnRpdHkiOiJ0ZXN0VXNlciIsInZpZGVvIjp7fX0sImlhdCI6MTY4NTM1NzE0OSwiZXhwIjoxNjg1MzYwNzQ5LCJpc3MiOiJTSzJlYTkyYTEyZGMwZTFjMThlZTRiMjkyNDdkYmFiOTcyIiwic3ViIjoiQUNjMmVkNTcwYmU5YTUzNDEzYTc5MjcxMzY2OTk2NmQ5ZSJ9.7fJaq7NSBv7tWf9xRjBntXZNAldZP8Z0-CuX8XbnnjE`;

                  fetch(
                    `http://qunote.softdemonew.info:5021/generate-token?user_name=${props.userName}`,
                    {
                      method: 'GET',
                      headers: {
                        Accept: 'application/json',
                      },
                    },
                  )
                    .then(response => {
                      // console.log('response=====>>>>>765', response.json());
                      return response.json();
                      // if (response.ok) {
                      //   response.text().then(jwt => {
                      //     // console.loh('jwt==============>>>>>>>>', jwt);
                      //     setProps({...props, token: jwt});
                      //     navigation.navigate('Video Call');
                      //     return true;
                      //   });
                      // } else {
                      //   response.text().then(error => {
                      //     Alert.alert(error);
                      //   });
                      // }
                    })
                    .then(json => {
                      // Bye bye Nidhi
                      const {token} = JSON.stringify(json);
                      setProps({...props, token: token});
                      navigation.navigate('Video Call');
                      return true;
                    })
                    .catch(error => {
                      console.log('error', error);
                      Alert.alert('API not available');
                    });
                });
              }}>
              <Text style={styles.buttonText}>Connect to Video Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const VideoCallScreen = ({navigation}) => {
  const twilioVideo = useRef(null);
  const {props, setProps} = useContext(AppContext);
  const [videoDimension, setvideoDimension] = useState(
    Dimensions.get('window'),
  );
  useEffect(() => {
    Orientation.lockToPortrait();
    return () => {
      Orientation.unlockAllOrientations();
    };
  }, []);
  useEffect(() => {
    twilioVideo.current.connect({
      roomName: props.roomName,
      accessToken: props.token,
    });
    setProps({...props, status: 'connecting'});
    return () => {
      _onEndButtonPress();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _onEndButtonPress = () => {
    twilioVideo.current.disconnect();
    setProps(initialState);
    navigation.navigate('Home');
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
    <View style={[styles.callContainer, {backgroundColor: 'green'}]}>
      {(props.status === 'connected' || props.status === 'connecting') && (
        <View style={styles.callWrapper}>
          {props.status === 'connected' && (
            <View
              style={[styles.remoteGrid, {backgroundColor: 'red', flex: 1}]}>
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
      )}
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.button} onPress={_onEndButtonPress}>
          <Text style={styles.buttonText}>End</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={_onMuteButtonPress}>
          <Text style={styles.buttonText}>
            {props.isAudioEnabled ? 'Mute' : 'Unmute'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={_onFlipButtonPress}>
          <Text style={styles.buttonText}>Flip</Text>
        </TouchableOpacity>
      </View>
      <TwilioVideoLocalView
        enabled={props.status === 'connected'}
        style={{
          ...styles.localVideo,
        }}
      />
      <TwilioVideo
        ref={twilioVideo}
        _onFlipButtonPress={() => {
          setProps({...props, flip: 'toggle'});
        }}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'lightgrey',
    flexDirection: 'row',
    // backgroundColor: 'yellow',
  },
  form: {
    flex: 1,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 20,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  formGroup: {
    margin: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
  textInput: {
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'lightgrey',
  },
  callContainer: {
    flex: 1,
    // height: 500,
    // width: '80%',
    backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callWrapper: {
    flex: 1,
    backgroundColor: 'pink',
    // justifyContent: 'center',
  },
  remoteGrid: {
    flex: 1,
  },
  remoteVideo: {
    flex: 1,
    height: '100%',
  },
  localVideo: {
    //
    height: '100%',
    width: '100%',
    // position: 'absolute',
    // right: 5,
    bottom: 50,
    // width: dimensions.width / 4,
    // height: dimensions.height / 4,
  },
  optionsContainer: {
    position: 'absolute',
    paddingHorizontal: 10,
    left: 0,
    right: 0,
    bottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default App;
