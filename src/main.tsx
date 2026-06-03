// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App";
import { AppWrapper } from "./components/common/PageMeta";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { PeriodProvider } from "./context/PeriodContext";
import { TerritoryProvider } from "./context/TerritoryContext";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <PeriodProvider>
              <TerritoryProvider>
                <AppWrapper>
                  <App />
                </AppWrapper>
              </TerritoryProvider>
            </PeriodProvider>
          </AuthProvider>
        </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);