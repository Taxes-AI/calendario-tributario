import { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Crear cuenta | Calendario Tributario",
};

export default function SignupPage() {
  return <SignupForm />;
}
