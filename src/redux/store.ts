import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { 
  persistStore, 
  persistReducer, 
  type PersistConfig,
  createTransform,
  createMigrate
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import projectReducer from "./slices/projectSlice";
import documentEditorReducer from "./slices/documentEditorSlice";
import { queryClient } from "../config/queryClient";

/**
 * Persist Transform: Blacklist volatile fields from the auth slice.
 * We don't want to persist 'isInitialized' as it should always start false 
 * on a fresh application load.
 */
const authTransform = createTransform(
  (inboundState: any) => ({ ...inboundState, isInitialized: false }),
  (outboundState) => outboundState,
  { whitelist: ["auth"] }
);

/**
 * Migration: Handle state transitions between versions.
 * This is useful for clearing stale data after significant architecture changes.
 */
const migrations: any = {
  0: (state: any) => ({ ...state, auth: undefined }), // Reset auth if coming from unversioned/double-persisted state
};

const appReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  project: projectReducer,
  documentEditor: documentEditorReducer,
});

/**
 * Root Reducer with Reset Logic
 * When auth/logout is dispatched, we reset the entire state to undefined,
 * which forces all slices to return to their initialState.
 */
const rootReducer = (state: any, action: any) => {
  if (action.type === "auth/logout") {
    state = undefined;
  }
  return appReducer(state, action);
};

const persistConfig: PersistConfig<ReturnType<typeof appReducer>> = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth", "ui", "project", "documentEditor"],
  transforms: [authTransform],
  migrate: createMigrate(migrations, { debug: false }),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat((_: any) => (next: any) => (action: any) => {
      // Global cleanup on logout
      if (action.type === "auth/logout") {
        queryClient.clear();
        persistor.purge();
        // Manually clear old legacy persist key if it exists
        localStorage.removeItem("persist:auth");
      }
      return next(action);
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
