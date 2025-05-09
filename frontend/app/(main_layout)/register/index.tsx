import RegisterForm from "@/components/registerForm";
import { RegisterContextProvider } from "@/context/RegisterContext";

/**
 * RegisterPage Component
 *
 * This component serves as the main registration page for new users.
 * It wraps the RegisterForm component with the RegisterContextProvider to manage the registration state and logic.
 *
 * Key Features:
 *   - Provides a registration form for new users to create an account.
 *   - Utilizes the RegisterContext to handle form state and submission.
 *   - Encapsulates the registration process within a single, reusable component.
 *
 * Functionality:
 *   - Renders the RegisterForm component, which contains the actual form fields and validation logic.
 *   - Provides the necessary context for the RegisterForm to function correctly.
 */

const RegisterPage = () => {
    return (
        <RegisterContextProvider>
            <RegisterForm />
        </RegisterContextProvider>
    )
};

export default RegisterPage;
