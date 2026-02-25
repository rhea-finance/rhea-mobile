import React, { createContext, useContext, useState, useCallback } from "react";

interface TabBarContextValue {
  tabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
}

const TabBarContext = createContext<TabBarContextValue>({
  tabBarVisible: true,
  setTabBarVisible: () => {},
});

export const useTabBar = () => useContext(TabBarContext);

export const TabBarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tabBarVisible, setTabBarVisibleState] = useState(true);

  const setTabBarVisible = useCallback((visible: boolean) => {
    setTabBarVisibleState(visible);
  }, []);

  return (
    <TabBarContext.Provider value={{ tabBarVisible, setTabBarVisible }}>
      {children}
    </TabBarContext.Provider>
  );
};
