import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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

            {/* Main content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}
