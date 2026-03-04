import { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Crear cuenta | Contably",
};

export default function SignupPage() {
  return <SignupForm />;
}
