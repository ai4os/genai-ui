import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/features/auth/require-auth";
import { ChatLayout } from "./layouts/chat-layout";
import { ChatPage } from "./pages/chat-page";
import { NewChatPage } from "./pages/new-chat-page";
import { LandingPage } from "./pages/landing-page";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected routes */}
        <Route element={<RequireAuth />}>
          <Route element={<ChatLayout />}>
            <Route path="/chat" element={<NewChatPage />} />
            <Route path="/chat/:chatId" element={<ChatPage />} />
          </Route>
        </Route>

        {/* Redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}