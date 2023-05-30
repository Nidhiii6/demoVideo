import React, {useState, useRef, useEffect, useContext} from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import {
  checkMultiple,
  request,
  requestMultiple,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import AppContext from '../App';

const RegisterScreen = ({navigation}) => {
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
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView>
        <View>
          <View>
            <Text>User Name</Text>
            <TextInput
              autoCapitalize="none"
              value={props.userName}
              onChangeText={text => setProps({...props, userName: text})}
            />
          </View>
          <View>
            <Text>Room Name</Text>
            <TextInput
              autoCapitalize="none"
              value={props.roomName}
              onChangeText={text => setProps({...props, roomName: text})}
            />
          </View>
          <View>
            <TouchableOpacity
              disabled={false}
              onPress={() => {
                _checkPermissions(() => {
                  fetch(
                    `https://ae7a722dc260.ngrok.io/getToken?userName=${props.userName}`,
                  )
                    .then(response => {
                      if (response.ok) {
                        response.text().then(jwt => {
                          setProps({...props, token: jwt});
                          navigation.navigate('Video Call');
                          return true;
                        });
                      } else {
                        response.text().then(error => {
                          Alert.alert(error);
                        });
                      }
                    })
                    .catch(error => {
                      console.log('error', error);
                      Alert.alert('API not available');
                    });
                });
              }}>
              <Text>Connect to Video Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
