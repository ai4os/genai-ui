import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/RequireAuth";
import { ChatLayout } from "./pages/ChatLayout";
import { ChatPage } from "./pages/ChatPage";
import { NewChatPage } from "./pages/NewChatPage";
import { Landing } from "./pages/Landing";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Landing />} />

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