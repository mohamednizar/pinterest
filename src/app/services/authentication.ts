import { Injectable } from '@angular/core';
import { AngularFire, AuthProviders, AngularFireDatabase } from 'angularfire2';
import { User } from '../models/user';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AuthenticationService {
  userAuth: Observable<any>;

  constructor(
    public af: AngularFire,
    public db: AngularFireDatabase
  ) {
    this.userAuth = this.af.auth.map(
      user => this._changeState(user),
      error => console.trace(error),
    );
  };

  login(from: string) {
    this.af.auth.login({
      provider: this._getProvider(from)
    });
    return this.userAuth
  }

  logout() {
    this.af.auth.logout();
    return this.userAuth;
  }

  authStatus() {
    return this.userAuth;
  }

  findbyIds(ids: string[]) {
    return  this.db.list('users')
      .map(users => users.filter(user => ids.indexOf(user.$key) > -1))
      .map(users => users.map(user => new User(user)))
  }

  storeNewUser(userAuth){
    let user = userAuth.user;

    return this.findbyUID(user.uid).map(
      obj => {
        if(!obj.$value){
          this.db
            .object(`users/${user.uid}`)
            .set(user)
          .then(() => console.log('New User Added to DB'))
          .catch(() => console.clear());
        }
        return this.updateUserAuth(userAuth);
      }
    )
    .switchMap(_userAuth => _userAuth)
  }

  findbyUID(uid: string){
    return this.db.object(`users/${uid}`)
  }

  updateUserAuth(userAuth) {
    let user = userAuth.user;

    return this.findbyUID(user.uid).map(
      user => {
        return Object.assign({}, userAuth, {
          user: new User(user)
        });
      }
    )
  }

  private _changeState(user: any = null) {
    if(user) {
      return {
        user: this._getUserInfo(user),
        isAuthenticated: true
      }
    }
    else {
      return {
        user: null,
        isAuthenticated: false
      }
    }
  }

  private _getUserInfo(user: any): any {
    if(!user) {
      return {};
    }
    let data = user.auth.providerData[0];
    return {
      name: data.displayName,
      avatar: data.photoURL,
      email: data.email,
      provider: data.providerId,
      uid: user.auth.uid
    };
  }

  private _getProvider(from: string) {
    switch(from){
      case 'twitter': return AuthProviders.Twitter;
      case 'facebook': return AuthProviders.Facebook;
      case 'github': return AuthProviders.Github;
      case 'google': return AuthProviders.Google;
    }
  }
}