"use client";

import React from "react";
import { AuthModal } from "@/components/modals/AuthModal";

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: { email: string; name?: string; avatarUrl?: string; sub?: string }) => Promise<void>;
}

export function GoogleLoginModal({ isOpen, onClose, onSuccess }: GoogleLoginModalProps) {
  return <AuthModal isOpen={isOpen} onClose={onClose} onGoogleSuccess={onSuccess} />;
}

export default GoogleLoginModal;
