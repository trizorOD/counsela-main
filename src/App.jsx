import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import Questionnaire from "./app/Questionnaire";
import { useIsMobile } from "./hooks/useMediaQuery";
import i18n from "./i18n";

const versionLoaders = {
    desktop: () => import("./versions/desktop").then((module) => module.desktopVersion),
    mobile: () => import("./versions/mobile").then((module) => module.mobileVersion)
};

function registerVersionResources(version) {
    Object.entries(version.resources).forEach(([language, translations]) => {
        i18n.addResourceBundle(language, version.namespace, translations, true, true);
    });
}

function App() {
    const isMobile = useIsMobile();
    const versionId = isMobile ? "mobile" : "desktop";
    const [version, setVersion] = useState(null);

    useEffect(() => {
        let isCurrent = true;

        versionLoaders[versionId]().then((loadedVersion) => {
            if (isCurrent) {
                registerVersionResources(loadedVersion);
                setVersion(loadedVersion);
            }
        });

        return () => {
            isCurrent = false;
        };
    }, [versionId]);

    if (!version) {
        return null;
    }

    return (
        <I18nextProvider i18n={i18n} defaultNS={version.namespace}>
            <Questionnaire version={version} />
        </I18nextProvider>
    );
}

export default App;
