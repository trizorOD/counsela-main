import Footer from "./components/Footer";
import Header from "./components/Header";
import { mobileResources } from "./resources";
import { mobileSteps } from "./steps";
import "./style.css";

export const mobileVersion = {
    Footer,
    Header,
    id: "mobile",
    namespace: "mobile",
    resources: mobileResources,
    steps: mobileSteps
};
