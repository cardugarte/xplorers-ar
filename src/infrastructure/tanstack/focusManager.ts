import { AppState, type AppStateStatus } from "react-native";
import { focusManager } from "@tanstack/react-query";

function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === "active");
}

AppState.addEventListener("change", onAppStateChange);
