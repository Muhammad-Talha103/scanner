import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserInfo {
  id: string | number;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  password: string | number | boolean;
}

interface InitialState {
  userInfo: UserInfo | null;
}

const initialState: InitialState = {
  userInfo: null,
};



export const ProductsSlice = createSlice({
  name: "userdata",
  initialState,
  reducers: {

    setUserInfo: (state, action: PayloadAction<UserInfo>) => {
      state.userInfo = action.payload;
    },
    signOut: (state) => {
      state.userInfo = null;
    },
    
  },
});

export const {
  setUserInfo,
  signOut,
} = ProductsSlice.actions;
export default ProductsSlice.reducer;