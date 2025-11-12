import React, { createContext, useState } from 'react';
export const ThemeContext = createContext();
export function ThemeProvider({ children }){
  const [dark, setDark] = useState(true);
  return <ThemeContext.Provider value={{ dark, toggle: ()=>setDark(v=>!v) }}>{children}</ThemeContext.Provider>;
}
