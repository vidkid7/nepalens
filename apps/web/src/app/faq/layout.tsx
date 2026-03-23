import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — NepaLens",
  description:
    "Frequently asked questions about NepaLens — licensing, contributing, accounts, API, and more.",
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
