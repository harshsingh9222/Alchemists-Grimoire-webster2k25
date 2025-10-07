import { getUser } from "../api";
import { login as authLogin } from "../store/authSlice.js";

export const getCurrentUser = async (dispatch) => {
    try {
        const response = await getUser();
        console.log("Current user response:", response.user);
        // If the response contains user data, dispatch the login action
        if (response?.user) {
            dispatch(authLogin(response.user));
            return response.user;
        }
    } catch (error) {
        console.log(error);
        
    }
};