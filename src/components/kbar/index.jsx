"use client";
import { UserContext } from "@/store/context/UserContext";
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch,
} from "kbar";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import RenderResults from "./render-result";
import { startHolyLoader } from "holy-loader";

export default function KBar({ children }) {
  const router = useRouter();
  const { state: UserState } = useContext(UserContext);
  const [navItems, setNavItems] = useState([]);

  useEffect(() => {
    if (UserState.value.data?.nav_items) {
      setNavItems(UserState.value.data?.nav_items);
    }
  }, [UserState]);

  const navigateTo = (url) => {
    if (UserState.value.data?.id) {
      startHolyLoader();
      router.push(`/${UserState.value.data.base_route}/${url}`);
    }
  };

  const localNavItems = [...navItems];

  const actions = useMemo(
    () =>
      localNavItems.flatMap((navItem) => {
        // Only include base action if the navItem has a real URL and is not just a container
        const baseAction =
          navItem.url !== "#"
            ? {
                id: `${navItem.title.toLowerCase()}Action`,
                name: navItem.title,
                shortcut: navItem.shortcut,
                keywords: navItem.title.toLowerCase(),
                section: "Navigation",
                subtitle: `Go to ${navItem.title}`,
                perform: () => navigateTo(navItem.url),
              }
            : null;

        // Map child items into actions
        const childActions =
          navItem.items?.map((childItem) => ({
            id: `${childItem.title.toLowerCase()}Action`,
            name: childItem.title,
            shortcut: childItem.shortcut,
            keywords: childItem.title.toLowerCase(),
            section: navItem.title,
            subtitle: `Go to ${childItem.title}`,
            perform: () => navigateTo(childItem.url),
          })) ?? [];

        // Return only valid actions (ignoring null base actions for containers)
        return baseAction ? [baseAction, ...childActions] : childActions;
      }),
    [navItems]
  );

  if (actions.length === 0) {
    return <>{children}</>;
  }

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}
const KBarComponent = ({ children }) => {
  return (
    <>
      <KBarPortal>
        <KBarPositioner className="scrollbar-hide fixed inset-0 z-[99999] bg-black/80 !p-0 backdrop-blur-sm">
          <KBarAnimator className="relative !mt-64 w-full max-w-[600px] !-translate-y-12 overflow-hidden rounded-lg border bg-background text-foreground shadow-lg">
            <div className="bg-background">
              <div className="border-x-0 border-b-2">
                <KBarSearch className="w-full border-none bg-background px-6 py-4 text-lg outline-none focus:outline-none focus:ring-0 focus:ring-offset-0" />
              </div>
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
