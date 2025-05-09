import { LoginPages } from "@/types/types";
import { RegisterFields } from "@/types/types";
import { Text } from "react-native";

/**
 * SelectAreaScreen Component
 *
 * This component serves as a placeholder for the Select Area Screen functionality on platforms where it is not supported.
 * It displays a message informing the user that the functionality is not available on the current platform.
 *
 * Key Features:
 *   - Provides a fallback UI for unsupported platforms.
 *   - Informs the user about the platform restriction.
 *
 * Functionality:
 *   - Renders a message indicating that the Select Area Screen is not supported on the current platform.
 *   - Does not implement any actual area selection functionality.
 */

const SelectAreaScreen = ({registerData, setRegisterData, setPage} : 
                          {registerData: RegisterFields, 
                          setRegisterData: React.Dispatch<React.SetStateAction<RegisterFields>>,
                          setPage: React.Dispatch<React.SetStateAction<LoginPages>>}
) => {
    return <Text>Not supported on your platform</Text>
};

export default SelectAreaScreen;
