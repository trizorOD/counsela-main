import { useContactForm } from "./useContactForm.js";

function ContactScreenController({ View, ...screenProps }) {
    const contactForm = useContactForm(screenProps);

    return <View {...screenProps} contactForm={contactForm} />;
}

export default ContactScreenController;
