import { RegisterContextProvider } from "@/context/RegisterContext";
import SelectAreaScreen from "@/components/selectAreaScreen/SelectAreaScreen";
import { useState } from "react";
import RegisterForm from "@/components/registerForm";
import { Platform } from "react-native";
import LeafletContextProvider from "@/context/LeafletContext";

/**
 * RegisterCouncilPage Component
 *
 * This component handles the registration process for council users.
 * It guides users through a two-step process: selecting a council area and filling out the registration form.
 *
 * Key Features:
 *   - Provides a two-step registration process for council users.
 *   - Utilizes the RegisterContext to manage the registration state and logic, specifically setting the role to "COUNCIL".
 *   - Integrates the SelectAreaScreen component for council area selection.
 *   - Renders the RegisterForm component with the hideCouncilPrompt prop to streamline the form for council users.
 *   - Uses LeafletContextProvider to provide Leaflet context to the SelectAreaScreen component on web platforms.
 *
 * Functionality:
 *   - Manages the current step of the registration process using a state variable.
 *   - Conditionally renders either the SelectAreaScreen or the RegisterForm based on the current step.
 *   - Provides a platform-specific implementation for the SelectAreaScreen, wrapping it with LeafletContextProvider on web platforms.
 */

const RegisterCouncilPage = () => {
    const [step, setStep] = useState<"selectArea" | "fillForm">("selectArea");
    return (
        <RegisterContextProvider role="COUNCIL">
            {step === "selectArea" ? (
                Platform.OS === "web" ?
                (<LeafletContextProvider>
                    <SelectAreaScreen onProceed={() => {setStep("fillForm")}} /> 
                </LeafletContextProvider>
                ) : (
                    <SelectAreaScreen onProceed={() => {setStep("fillForm")}} /> 
                )
            ) : (
            <RegisterForm hideCouncilPrompt />
            )}
        </RegisterContextProvider>
    )
}

export default RegisterCouncilPage;
