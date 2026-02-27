"use client";

import { FleetProvider } from "@/lib/FleetContext";
import AppShell from "@/components/AppShell";
import type { ReactNode } from "react";

export default function ClientShell({ children }: { children: ReactNode }) {
    return (
        <FleetProvider>
            <AppShell>{children}</AppShell>
        </FleetProvider>
    );
}
