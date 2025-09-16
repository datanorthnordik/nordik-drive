import Header from "./header/Header";
import { ReactElement, ReactNode } from "react";
import { LayoutWrapper } from "./Wrappers";

interface LayoutProps {
  children: ReactNode; 
  showHeader?: boolean;
}

export default function Layout(props: LayoutProps) {
  const {children, showHeader} = props
  return (
    <LayoutWrapper>
      {showHeader && <Header />}
      <main style={{boxSizing:'border-box'}}>{children}</main>
    </LayoutWrapper>
  );
}
