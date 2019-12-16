import {Injectable, NgZone} from '@angular/core';
import {Router} from '@angular/router';

import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import {User} from './user';
import {Platform} from '@ionic/angular';
import {environment} from '../environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {GooglePlus} from '@ionic-native/google-plus/ngx';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  userData: any; // Save logged in user data
  user: any = {};
  result: any = {};
  constructor(
      public http: HttpClient,
      public afs: AngularFirestore,   // Inject Firestore service
      public afAuth: AngularFireAuth, // Inject Firebase auth service
      public router: Router,
      public platform: Platform,
      public gplus: GooglePlus,
      public ngZone: NgZone // NgZone service to remove outside scope warning
  ) {
    /* Saving user data in localstorage when
    logged in and setting up null when logged out */
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem('user'));
      } else {
        localStorage.setItem('user', null);
        JSON.parse(localStorage.getItem('user'));
      }
    });
  }

  googleLogin() {
      if (this.platform.is('cordova')) {
          this.nativeGoogleLogin();
      } else {
          this.webGoogleLogin();
      }
  }

  // Sign in with Google
   async nativeGoogleLogin(): Promise<void> {
      try {
          const gplusUser = await this.gplus.login({
              webClientId: '368105033032-2lrpf8cu5se24dh3j55f79eonk04saqe.apps.googleusercontent.com',
              offline: true
          });
          const credential = firebase.auth.GoogleAuthProvider.credential(gplusUser.idToken);

          return await firebase.auth().signInWithCredential(credential).then( (result) => {

              this.user = {
                  uid: result.user.uid,
                  phoneNumber: result.user.phoneNumber,
                  photoURL: result.user.photoURL,
                  isAnonymous: result.user.isAnonymous,
                  email: result.user.email,
                  displayName: result.user.displayName,
                  emailVerified: result.user.emailVerified,
                  refreshToken: result.user.refreshToken
              };
              console.log(this.user);
              this.ngZone.run(() => {
                  this.router.navigate(['/profile']);
              });
              this.SetUserData(result.user, environment.relUrl).then(r => console.log(r));
          }).catch((error) => {
              window.alert(error);
          });


      } catch (err) {
          console.log(err);
      }
    // return this.AuthLogin(new auth.GoogleAuthProvider());
  }

  async webGoogleLogin(): Promise<void> {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const credential = await this.afAuth.auth.signInWithPopup(provider).then((result) => {

            this.user = {
                uid: result.user.uid,
                phoneNumber: result.user.phoneNumber,
                photoURL: result.user.photoURL,
                isAnonymous: result.user.isAnonymous,
                email: result.user.email,
                displayName: result.user.displayName,
                emailVerified: result.user.emailVerified,
                refreshToken: result.user.refreshToken
            };
            console.log(this.user);
            this.ngZone.run(() => {
                this.router.navigate(['/profile']);
            });
            this.SetUserData(result.user, environment.relUrl).then(r => console.log(r));
        }).catch((error) => {
            window.alert(error);
        });

      } catch (err) {
        console.log(err);
      }
  }

  // Auth logic to run auth providers
 /* AuthLogin(provider) {

        return this.afAuth.auth.signInWithPopup(provider)
            .then((result) => {

                this.user = {
                    uid: result.user.uid,
                    phoneNumber: result.user.phoneNumber,
                    photoURL: result.user.photoURL,
                    isAnonymous: result.user.isAnonymous,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    emailVerified: result.user.emailVerified,
                    refreshToken: result.user.refreshToken
                };
                console.log(this.user);
                this.ngZone.run(() => {
                    this.router.navigate(['/profile']);
                });
                this.SetUserData(result.user);
            }).catch((error) => {
                window.alert(error);
            });
  }*/

  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */

 /* SetUserData(user) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
    return userRef.set(userData, {
      merge: true
    });
  } */

    SetUserData(user, relUrl) {
        return new Promise((resolve, reject) => {
            const headers = new HttpHeaders();
            headers.append('Accept', 'application/json');
            headers.append('Content-Type', 'application/json' );
            const formData = new FormData();
            formData.append('user', JSON.stringify(user));

            this.http.post(environment.domain + relUrl, formData, { headers }).subscribe(res => {
                resolve(res);
            }, error => {
                console.log(error);
                reject(error);
            });
        });
    }

    signOut() {
        this.afAuth.auth.signOut();
        localStorage.removeItem('user');
        this.gplus.logout();
        this.router.navigate(['/home']);
    }
  // Sign out
  /* signOut() {
    return this.afAuth.auth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['/home']);
    });
  } */
}
