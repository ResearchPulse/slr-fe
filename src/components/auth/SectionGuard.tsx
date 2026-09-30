import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type RootState } from "../../redux/store";
import { setCurrentSection } from "../../redux/slices/uiSlice";

interface SectionGuardProps {
  children: React.ReactNode;
  section: "admin" | "client";
}

const SectionGuard: React.FC<SectionGuardProps> = ({ children, section }) => {
  const dispatch = useDispatch();
  const { currentSection } = useSelector((state: RootState) => state.ui);

  useEffect(() => {
    if (currentSection !== section) {
      dispatch(setCurrentSection(section));
    }
  }, [section, currentSection, dispatch]);

  return <>{children}</>;
};

export default SectionGuard;
