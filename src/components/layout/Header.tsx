import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared";

// Import logo images
import logoLight from "/icons/IA-light.png";
import logoDark from "/icons/IA-dark.png";

export function Header() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-between mb-2">
        <div className="w-8" /> {/* Spacer for centering */}
        <div className="flex items-center gap-3">
          {/* Logo - switches based on theme */}
          <img
            src={logoLight}
            alt="InterviewCoach AI"
            className="h-10 w-auto dark:hidden"
          />
          <img
            src={logoDark}
            alt="InterviewCoach AI"
            className="h-10 w-auto hidden dark:block"
          />
          <h1 className="text-3xl font-bold text-foreground">
            InterviewCoach AI
          </h1>
        </div>
        <ThemeToggle />
      </div>
      <p className="text-muted-foreground">
        AI-Powered Interview Prep • On-Device • No API Key Needed
      </p>
      <Card className="mt-3">
        <CardContent className="p-3">
          <p className="text-sm text-muted-foreground">
            <strong>Pro Tip:</strong> Highlight job descriptions on any webpage,
            right-click → <strong>"InterviewCoach AI"</strong> → then click the
            extension icon to see results!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
