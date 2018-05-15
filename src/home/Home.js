
import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  AsyncStorage,
  Alert,
  Linking,
  View
} from 'react-native';
import { NavigationActions, StackActions } from 'react-navigation';
import {
  Container, Header, Content, Footer,
  Left, Body, Right,
  Card, CardItem,
  Text, H1,
  Button, Icon,
  Title,
  Form, Item, Input, Label
} from 'native-base';

import BackgroundGeolocation from "../react-native-background-geolocation";

import prompt from 'react-native-prompt-android';

import App from '../App';

const DEFAULT_USERNAME = "react-native-anonymous";
const TRACKER_HOST = 'http://tracker.transistorsoft.com/';
const USERNAME_KEY = '@transistorsoft:username';

// Only allow alpha-numeric usernames with '-' and '_'
const USERNAME_VALIDATOR =  /^[a-zA-Z0-9_-]*$/;

export default class Home extends Component<{}> {
  constructor(props) {
    super(props);

    let navigation = props.navigation;
    this.state = {
      username: navigation.state.params.username,
      url: TRACKER_HOST + navigation.state.params.username
    }
  }

  componentDidMount() {
    // #stop BackroundGeolocation and remove-listeners when Home Screen is rendered.
    BackgroundGeolocation.stop();
    BackgroundGeolocation.removeListeners();

    if (!this.state.username) {
      this.getUsername().then(this.doGetUsername.bind(this)).catch(() => {
        this.onClickEditUsername();
      });
    }
  }
  onClickNavigate(routeName) {
    App.setRootRoute(routeName);
    let action = StackActions.reset({
      index: 0,
      actions: [
        NavigationActions.navigate({routeName: routeName, params: {
          username: this.state.username
        }})
      ],
      key: null
    });
    this.props.navigation.dispatch(action);    
    
  }

  onClickEditUsername() {
    AsyncStorage.getItem(USERNAME_KEY, (err, username) => {
      AsyncStorage.removeItem(USERNAME_KEY);
      this.getUsername(username).then(this.doGetUsername.bind(this)).catch(() => {
        // Revert to current username on [Cancel]
        AsyncStorage.setItem(USERNAME_KEY, username);
        this.onClickEditUsername();
      });
    });
  }

  onClickViewServer() {
     Linking.canOpenURL(this.state.url).then(supported => {
      if (supported) {
        Linking.openURL(this.state.url);
      } else {
        console.log("Don't know how to open URI: " + this.props.url);
      }
    });
  }

  getUsername(defaultValue) {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem(USERNAME_KEY, (err, username) => {
        if (username) {
          resolve(username);
        } else {
          prompt('Tracking Server Username', 'Please enter a unique identifier (eg: Github username) so the plugin can post loctions to tracker.transistorsoft.com/{identifier}', [{
            text: 'OK',
            onPress: (username) => {
              username = username.replace(/\s+/, "");
              console.log('OK Pressed, username: ', username, username.length);
              if (!username.length) {
                Alert.alert('Username required','You must enter a username.  It can be any unique alpha-numeric identifier.', [{
                  text: 'OK', onPress: () => {
                    reject();
                  }
                }],{
                  cancelable: false
                });
              } else if (!USERNAME_VALIDATOR.test(username)) {
                Alert.alert("Invalid Username", "Username must be alpha-numeric\n('-' and '_' are allowed)", [{
                  text: 'OK', onPress: () => {
                    reject();
                  }
                }],{
                  cancelable: false
                });
              } else {
                resolve(username);
              }
            }
          }],{
            type: 'plain-text',
            defaultValue: defaultValue || ''
          });
        }
      });
    });
  }  

  doGetUsername(username) {
    AsyncStorage.setItem(USERNAME_KEY, username);

    this.setState({
      username: username,
      url: TRACKER_HOST + username
    });

    BackgroundGeolocation.setConfig({url: TRACKER_HOST + 'locations/' + username});
  }

  render() {
    return (
      <Container>
        <Header style={styles.header}>
          <Body>
            <Title style={styles.title}>BG Geolocation</Title>
          </Body>
        </Header>
        <Body style={styles.body}>
            <H1 style={styles.h1}>Example Applications</H1>
            <Button full style={styles.button} onPress={() => this.onClickNavigate('HelloWorld')}><Text>Hello World</Text></Button>
            <Button full style={styles.button} onPress={() => this.onClickNavigate('SimpleMap')}><Text>Simple Map</Text></Button>
            <Button full style={styles.button} onPress={() => this.onClickNavigate('Advanced')}><Text>Advanced</Text></Button>
        </Body>

        <Footer style={styles.footer}>
            <Card style={styles.userInfo}>
              <Text style={styles.p}>These apps will post locations to Transistor Software's demo server.  You can view your tracking in the browser by visiting:</Text>
              <Text style={styles.url}>{this.state.url}</Text>

              <Item inlineLabel disabled>
                <Label>Username</Label>
                <Input value={this.state.username} />
              </Item>
              <CardItem style={{margin: 0}}>
                <Left>
                  <Button danger small full onPress={this.onClickEditUsername.bind(this)}><Text>Edit username</Text></Button>
                </Left>
                <Right>
                  <Button small full onPress={this.onClickViewServer.bind(this)}><Text>View server</Text></Button>
                </Right>
              </CardItem>
            </Card>
        </Footer>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fedd1e'
  },
  title: {
    color: '#000'
  },
  body: {
    width: '100%',
    justifyContent: 'center',
    backgroundColor:'#272727'
  },
  h1: {
    color: '#fff',
    marginBottom: 20
  },
  p: {
    fontSize: 12,
    marginBottom: 5
  },
  url: {
    fontSize: 12,
    textAlign: 'center'
  },
  button: {
    marginBottom: 10
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  footer: {
    backgroundColor:"transparent",
    height: 215
  },
  userInfo: {
    padding: 10
  }
});
