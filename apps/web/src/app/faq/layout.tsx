import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — PixelStock",
  description:
    "Frequently asked questions about PixelStock — licensing, contributing, accounts, API, and more.",
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
