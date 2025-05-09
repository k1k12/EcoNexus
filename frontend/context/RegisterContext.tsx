import { UserRole } from "@/types/types";
import { useContext, createContext, useState, ReactNode } from "react";

/**
 * RegisterContext Component
 *
 * This component provides a context for managing the registration form data across different components.
 * It stores the registration form values and provides a function to update them.
 *
 * Key Features:
 *   - Manages the registration form data, including user role, area code, first name, last name, email, password, and repeated password.
 *   - Provides a function to update the registration form data.
 *   - Allows components to access and update the registration form data without prop drilling.
 *
 * Functionality:
 *   - Stores the registration form data in a state variable.
 *   - Provides a setFormData function to update the registration form data.
 *   - Provides a RegisterContext.Provider to wrap the components that need access to the registration form data.
 *   - Provides a useRegisterContext hook to access the registration form data from other components.
 *
 * Context Value:
 *   - role: The user role (USER or COUNCIL).
 *   - areaCode: The area code of the user.
 *   - firstName: The first name of the user.
 *   - lastName: The last name of the user.
 *   - email: The email of the user.
 *   - password: The password of the user.
 *   - repeatedPassword: The repeated password of the user.
 *   - setFormData: A function to update the registration form data.
 *
 * Hooks:
 *   - useState: Used to manage the registration form data.
 *   - useContext: Used to access the RegisterContext from other components.
 */

type RegisterContextType = {
  role: UserRole,
  areaCode: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  repeatedPassword: string;
  setFormData: (data: Partial<RegisterContextType>) => void;
};

const RegisterContext = createContext<RegisterContextType | null>(null);

export const RegisterContextProvider = ({ children, role}: { children: ReactNode, role?: UserRole}) => {
  const [formData, setFormDataState] = useState<RegisterContextType>({
    role: role || "USER",
    areaCode: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    repeatedPassword: "",
    setFormData: () => {} // stub, replaced by the setFormData in the value of the provider
  });

  const setFormData = (data: Partial<RegisterContextType>) => {
    setFormDataState((prev) => ({ ...prev, ...data }));
  };

  return (
    <RegisterContext.Provider value={{ ...formData, setFormData }}>
      {children}
    </RegisterContext.Provider>
  );
};

export const useRegisterContext = () => {
  const ctx = useContext(RegisterContext);
  if (!ctx) throw new Error("RegisterContext not found");
  return ctx;
};
