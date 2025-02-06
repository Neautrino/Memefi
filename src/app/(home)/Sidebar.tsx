import React from "react";
import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconBrandGithub,
  IconBrandX,
  IconCoins,
  IconStack2,
} from "@tabler/icons-react";

export default function Sidebar({ 
  activePage, 
  onPageChange 
}: { 
  activePage: string;
  onPageChange: (page: string) => void;
}) {
  const links = [
    {
      title: "Token Creation",
      icon: (
        <IconCoins className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
      onClick: () => onPageChange("token")
    },
    {
      title: "Token Minting",
      icon: (
        <IconStack2 className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
      onClick: () => onPageChange("mint")
    },
    {
      title: "Twitter",
      icon: (
        <IconBrandX className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "https://x.com/Neautrino_08"
    },
    {
      title: "GitHub",
      icon: (
        <IconBrandGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "https://github.com/neautrino"
    },
  ];
  
  return (
    <div className="h-full">
      <FloatingDock
        items={links.map(link => ({
          ...link,
          onClick: link.onClick,
          active: link.onClick && activePage === link.title.toLowerCase().split(' ')[1]
        }))}
        desktopClassName="bg-transparent"
      />
    </div>
  );
}