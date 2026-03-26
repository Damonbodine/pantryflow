import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "rounded-[10px] shadow-warm",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton: "rounded-[10px] border-border",
            formButtonPrimary: "bg-primary hover:bg-primary/90 rounded-[10px]",
            footerActionLink: "text-primary hover:text-primary/80",
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
