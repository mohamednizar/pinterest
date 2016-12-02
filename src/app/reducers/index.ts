import '@ngrx/core/add/operator/select';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/let';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';
/**
 * The compose function is one of our most handy tools. In basic terms, you give
 * it any number of functions and it returns a function. This new function
 * takes a value and chains it through every composed function, returning
 * the output.
 *
 * More: https://drboolean.gitbooks.io/mostly-adequate-guide/content/ch5.html
 */
import { compose } from '@ngrx/core/compose';

/**
 * storeFreeze prevents state from being mutated. When mutation occurs, an
 * exception will be thrown. This is useful during development mode to
 * ensure that none of the reducers accidentally mutates the state.
 */
import { storeFreeze } from 'ngrx-store-freeze';

/**
 * combineReducers is another useful metareducer that takes a map of reducer
 * functions and creates a new reducer that stores the gathers the values
 * of each reducer and stores them using the reducer's key. Think of it
 * almost like a database, where every reducer is a table in the db.
 *
 * More: https://egghead.io/lessons/javascript-redux-implementing-combinereducers-from-scratch
 */
import { combineReducers, ActionReducer } from '@ngrx/store';

/**
 * Every reducer module's default export is the reducer function itself. In
 * addition, each module should export a type or interface that describes
 * the state of the reducer plus any selector functions. The `* as`
 * notation packages up all of the exports into a single object.
 */
import * as fromUserAuth from './user-auth';
import * as fromPins from './pins'
import { User } from '../models/user';
import { routerReducer } from '@ngrx/router-store';
import { createSelector } from 'reselect';

/**
 * As mentioned, we treat each reducer like a table in a database. This means
 * our top level state interface is just a map of keys to inner state types.
 */
export interface AppState {
  userAuth: fromUserAuth.State;
  pins: fromPins.State
}

/**
 * Because metareducers take a reducer function and return a new reducer,
 * we can use our compose helper to chain them together. Here we are
 * using combineReducers to make our top level reducer, and then
 * wrapping that in storeLogger. Remember that compose applies
 * the result from right to left.
 */
const reducers = {
  userAuth: fromUserAuth.reducer,
  pins: fromPins.reducer,
  router: routerReducer
};

const developmentReducer: ActionReducer<AppState> = compose(storeFreeze, combineReducers)(reducers);
const productionReducer: ActionReducer<AppState> = combineReducers(reducers);

export function reducer(state: any, action: any) {
  if (environment.production) {
    return productionReducer(state, action);
  }
  else {
    return developmentReducer(state, action);
  }
}

/**
 * A selector function is a map function factory. We pass it parameters and it
 * returns a function that maps from the larger state tree into a smaller
 * piece of state. This selector simply selects the `books` state.
 *
 * Selectors are used with the `let` operator. They take an input observable
 * and return a new observable. Here's how you would use this selector:
 *
 * ```ts
 * class MyComponent {
 * 	constructor(state$: Observable<State>) {
 * 	  this.userAuthState$ = state$.let(getUserAuthState);
 * 	}
 * }
 * ```
 *
 * Note that this is equivalent to:
 * ```ts
 * class MyComponent {
 * 	constructor(state$: Observable<State>) {
 * 	  this.userAuthState$ = getUserAuthState(state$);
 * 	}
 * }
 * ```
 *
 */
export const getUserAuthState = (appState: AppState) => appState.userAuth;
export const getPinsState = (appState: AppState) => appState.pins;

/**
 * Every reducer module exports selector functions, however child reducers
 * have no knowledge of the overall state tree. To make them useable, we
 * need to make new selectors that wrap them.
 *
 * Once again our compose function comes in handy. From right to left, we
 * first select the books state then we pass the state to the book
 * reducer's getBooks selector, finally returning an observable
 * of search results.
 *
 * Share memoizes the selector functions and published the result. This means
 * every time you call the selector, you will get back the same result
 * observable. Each subscription to the resultant observable
 * is shared across all subscribers.
 */



// ************************************
// Authentication
// ************************************
export const getUserEntities = createSelector(getUserAuthState, fromUserAuth.getEntities);
export const getUserIds = createSelector(getUserAuthState, fromUserAuth.getIds);
export const getUser = createSelector(getUserAuthState, fromUserAuth.getUser);
export const getUserAuthStatus = createSelector(getUserAuthState, fromUserAuth.getAuthStatus);
/**
 * Some selector functions create joins across parts of state. This selector
 * composes the search result IDs to return an array of users in the store.
 */
export const getUsers = createSelector(getUserEntities, getUserIds, (userEntities, ids) => {
  return ids.map(id => userEntities[id]);
});

export function getUserById(id) {
  return createSelector(getUserEntities, (userEntities)=> {
    return userEntities[id]
  })
}
// ------------------------------------



// ************************************
// Pins State Funcations
// ************************************
export const getPinEntities = createSelector(getPinsState, fromPins.getEntities);
export const getPinIds = createSelector(getPinsState, fromPins.getIds);
export const getSelectedPinId = createSelector(getPinsState, fromPins.getSelectedId);
/**
 * Some selector functions create joins across parts of state. This selector
 * composes the search result IDs to return an array of pins in the store.
 */
export const getPins = createSelector(getPinEntities, getPinIds, (pins, ids) => {
  return ids.map(id => pins[id]);
});
export const getSelectedPin = createSelector(getPinEntities, getSelectedPinId, (pins, selectedId) => {
  return pins[selectedId];
})
export const getPinUser = createSelector(getUsers, getSelectedPin, (users, pin) => {
  return users.filter(user => user.id == pin.userId)[0]
});
// ------------------------------------