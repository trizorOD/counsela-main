import Header from "./components/Header";
import { desktopResources } from "./resources";
import { desktopSteps } from "./steps";
import "./style.css";

export const desktopVersion = {
    Footer: null,
    Header,
    id: "desktop",
    namespace: "desktop",
    resources: desktopResources,
    steps: desktopSteps
};
