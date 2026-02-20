import { auth } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Ensure user is authenticated
    const { userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
            {/* Decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            </div>

            {/* Sign out button */}
            <div className="fixed top-4 right-4 z-20">
                <SignOutButton>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50">
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </button>
                </SignOutButton>
            </div>

            {/* Main content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}
